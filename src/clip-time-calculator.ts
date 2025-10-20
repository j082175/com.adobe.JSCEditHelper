/**
 * Clip Time Calculation Engine
 * 클립 시간 계산, 정렬, 간격 분석을 담당하는 TypeScript 엔진
 */

interface TimeCode {
    ticks: number;
    seconds: number;
    timecode?: string;  // "00:01:23:15" 형식
}

interface ClipInfo {
    id: string;
    name: string;
    start: TimeCode;
    end: TimeCode;
    duration: TimeCode;
    trackIndex: number;
    trackType: 'video' | 'audio';
    selected: boolean;
}

interface ClipGap {
    startTime: TimeCode;
    endTime: TimeCode;
    duration: TimeCode;
    beforeClip: ClipInfo;
    afterClip: ClipInfo;
    gapIndex: number;
}

interface InsertionPlan {
    insertions: ClipInsertion[];
    totalInsertions: number;
    audioTrack: number;
    estimatedDuration: TimeCode;
}

interface ClipInsertion {
    position: TimeCode;
    audioFile: string;
    targetTrack: number;
    beforeClip?: ClipInfo;
    afterClip?: ClipInfo;
    insertionType: 'between' | 'before' | 'after' | 'overlay';
    clipDuration?: TimeCode; // 클립 길이 정보 (pre-trimming용)
}

interface MagnetPlan {
    movements: ClipMovement[];
    totalMoved: number;
    gapsRemoved: number;
    estimatedTime: number; // milliseconds
}

interface ClipMovement {
    clip: ClipInfo;
    fromPosition: TimeCode;
    toPosition: TimeCode;
    deltaTime: TimeCode;
}

const ClipTimeCalculator = (function() {
    'use strict';
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    
    function initializeDIDependencies() {
        try {
            diContainer = (window as any).DI;
            if (diContainer) {
                // DI에서 서비스 가져오기 시도
                utilsService = diContainer.getSafe('JSCUtils');
            }
        }
        catch (e) {
            // DI 사용 불가시 레거시 모드로 작동
        }
    }
    
    // 초기화 시도 (즉시 및 지연)
    initializeDIDependencies();
    
    // 앱 초기화 후에 DI 서비스 재시도
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            if (!utilsService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils(): JSCUtilsInterface {
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[ClipTimeCalculator]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[ClipTimeCalculator]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[ClipTimeCalculator]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[ClipTimeCalculator]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[ClipTimeCalculator]', msg),
            isValidPath: (path: string) => !!path,
            getShortPath: (path: string) => path,
            safeJSONParse: (str: string) => {
                try { return JSON.parse(str); }
                catch(e) { return null; }
            },
            saveToStorage: (key: string, value: string) => { localStorage.setItem(key, value); return true; },
            loadFromStorage: (key: string) => localStorage.getItem(key),
            removeFromStorage: (key: string) => { localStorage.removeItem(key); return true; },
            CONFIG: {
                DEBUG_MODE: false,
                SOUND_FOLDER_KEY: 'soundInserter_folder',
                APP_NAME: 'JSCEditHelper',
                VERSION: '1.0.0'
            },
            LOG_LEVELS: {} as any,
            log: () => {},
            getDIStatus: () => ({ isDIAvailable: false, containerInfo: 'Fallback mode' })
        };
        return utilsService || window.JSCUtils || fallback;
    }
    
    const TICKS_PER_SECOND = 254016000000; // Premiere Pro 내부 시간 단위

    /**
     * 선택된 클립들을 시간 순으로 정렬
     */
    function sortClipsByTime(clips: ClipInfo[]): ClipInfo[] {
        if (!clips || !Array.isArray(clips)) {
            return [];
        }

        return [...clips].sort((a, b) => {
            // 트랙 인덱스 우선, 그 다음 시작 시간
            if (a.trackIndex !== b.trackIndex) {
                return a.trackIndex - b.trackIndex;
            }
            return a.start.ticks - b.start.ticks;
        });
    }

    /**
     * 클립들 사이의 간격 분석
     */
    function analyzeClipGaps(clips: ClipInfo[]): ClipGap[] {
        const sortedClips = sortClipsByTime(clips);
        const gaps: ClipGap[] = [];

        if (sortedClips.length < 2) {
            const utils = getUtils();
            utils.logDebug('클립이 2개 미만이므로 간격 분석 불가');
            return gaps;
        }

        for (let i = 0; i < sortedClips.length - 1; i++) {
            const currentClip = sortedClips[i];
            const nextClip = sortedClips[i + 1];

            // 같은 트랙의 연속 클립만 고려
            if (currentClip.trackIndex === nextClip.trackIndex) {
                const gapStart = currentClip.end;
                const gapEnd = nextClip.start;

                // 간격이 실제로 존재하는지 확인
                if (gapEnd.ticks > gapStart.ticks) {
                    const gapDuration = subtractTime(gapEnd, gapStart);
                    
                    gaps.push({
                        startTime: gapStart,
                        endTime: gapEnd,
                        duration: gapDuration,
                        beforeClip: currentClip,
                        afterClip: nextClip,
                        gapIndex: gaps.length
                    });
                }
            }
        }

        const utils = getUtils();
        utils.logDebug(`분석된 클립 간격: ${gaps.length}개`);
        return gaps;
    }

    /**
     * 효과음 삽입 계획 생성
     */
    function createInsertionPlan(
        clips: ClipInfo[], 
        audioFiles: string[], 
        targetAudioTrack: number = 1
    ): InsertionPlan {
        const insertions: ClipInsertion[] = [];

        // 클립이 없거나 오디오 파일이 없으면 실패
        if (!clips || clips.length === 0) {
            const utils = getUtils();
            utils.logWarn('선택된 클립이 없습니다');
            return {
                insertions: [],
                totalInsertions: 0,
                audioTrack: targetAudioTrack,
                estimatedDuration: createTimeCode(0)
            };
        }

        if (!audioFiles || audioFiles.length === 0) {
            const utils = getUtils();
            utils.logWarn('사용할 오디오 파일이 없습니다');
            return {
                insertions: [],
                totalInsertions: 0,
                audioTrack: targetAudioTrack,
                estimatedDuration: createTimeCode(0)
            };
        }

        // 각 클립마다 효과음 1개씩 삽입 (클립 길이에 맞게 조정)
        const sortedClips = sortClipsByTime(clips);
        
        for (let i = 0; i < sortedClips.length; i++) {
            const clip = sortedClips[i];
            const randomAudioFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            
            // 클립이 비디오 타입이면 A2 트랙에 삽입 (개별 효과음 버튼과 동일한 로직)
            const targetTrack = clip.trackType === 'video' ? 2 : targetAudioTrack;
            
            const insertion: ClipInsertion = {
                position: clip.start,
                audioFile: randomAudioFile,
                targetTrack: targetTrack,
                afterClip: clip,
                insertionType: 'overlay', // 클립과 동시에 재생되도록
                clipDuration: clip.duration // 클립 길이 정보 추가 (pre-trimming용)
            };
            
            insertions.push(insertion);
            
            const utils = getUtils();
            utils.logInfo(`클립 ${clip.name}에 효과음 삽입 (길이: ${formatDuration(clip.duration)})`);
        }

        // 예상 총 소요 시간 계산 (각 삽입당 평균 2초 가정)
        const estimatedTotalSeconds = insertions.length * 2;
        const estimatedDuration = createTimeCode(estimatedTotalSeconds);

        const utils = getUtils();
        utils.logInfo(`효과음 삽입 계획: ${insertions.length}개 위치 (클립: ${clips.length}개)`);

        return {
            insertions,
            totalInsertions: insertions.length,
            audioTrack: targetAudioTrack,
            estimatedDuration
        };
    }

    /**
     * 클립 자동 정렬(마그넷) 계획 생성
     */
    function createMagnetPlan(clips: ClipInfo[]): MagnetPlan {
        const sortedClips = sortClipsByTime(clips);
        const movements: ClipMovement[] = [];
        let totalGapsRemoved = 0;

        if (sortedClips.length < 2) {
            return {
                movements: [],
                totalMoved: 0,
                gapsRemoved: 0,
                estimatedTime: 0
            };
        }

        // 각 트랙별로 처리
        const trackGroups = groupClipsByTrack(sortedClips);
        let cumulativeTimeShift = createTimeCode(0);

        Object.keys(trackGroups).forEach(trackIndexStr => {
            const trackIndex = parseInt(trackIndexStr);
            const trackClips = trackGroups[trackIndex];
            
            let previousClipEnd = trackClips[0].end;

            for (let i = 1; i < trackClips.length; i++) {
                const currentClip = trackClips[i];
                const gapDuration = subtractTime(currentClip.start, previousClipEnd);

                // 간격이 있다면 클립을 앞으로 당기기
                if (gapDuration.ticks > 0) {
                    const newPosition = previousClipEnd;
                    const deltaTime = subtractTime(currentClip.start, newPosition);

                    movements.push({
                        clip: currentClip,
                        fromPosition: currentClip.start,
                        toPosition: newPosition,
                        deltaTime: deltaTime
                    });

                    totalGapsRemoved++;
                    cumulativeTimeShift = addTime(cumulativeTimeShift, gapDuration);
                }

                // 다음 반복을 위해 이전 클립 끝 위치 업데이트
                const adjustedEndTime = subtractTime(currentClip.end, 
                    movements.length > 0 ? movements[movements.length - 1].deltaTime : createTimeCode(0));
                previousClipEnd = adjustedEndTime;
            }
        });

        // 예상 소요 시간 (이동할 클립 수 * 50ms)
        const estimatedTimeMs = movements.length * 50;

        const utils = getUtils();
        utils.logInfo(`마그넷 계획: ${movements.length}개 클립 이동, ${totalGapsRemoved}개 간격 제거`);

        return {
            movements,
            totalMoved: movements.length,
            gapsRemoved: totalGapsRemoved,
            estimatedTime: estimatedTimeMs
        };
    }

    /**
     * 클립들을 트랙별로 그룹화
     */
    function groupClipsByTrack(clips: ClipInfo[]): { [trackIndex: number]: ClipInfo[] } {
        const groups: { [trackIndex: number]: ClipInfo[] } = {};

        clips.forEach(clip => {
            if (!groups[clip.trackIndex]) {
                groups[clip.trackIndex] = [];
            }
            groups[clip.trackIndex].push(clip);
        });

        // 각 트랙 내에서 시간순 정렬
        Object.keys(groups).forEach(trackIndex => {
            groups[parseInt(trackIndex)].sort((a, b) => a.start.ticks - b.start.ticks);
        });

        return groups;
    }


    /**
     * 시간 코드 생성
     */
    function createTimeCode(seconds: number): TimeCode {
        const ticks = Math.floor(seconds * TICKS_PER_SECOND);
        return {
            ticks,
            seconds,
            timecode: formatTimecode(seconds)
        };
    }

    /**
     * Ticks를 TimeCode로 변환
     */
    function ticksToTimeCode(ticks: number): TimeCode {
        const seconds = ticks / TICKS_PER_SECOND;
        return {
            ticks,
            seconds,
            timecode: formatTimecode(seconds)
        };
    }

    /**
     * 시간 더하기
     */
    function addTime(time1: TimeCode, time2: TimeCode): TimeCode {
        const totalTicks = time1.ticks + time2.ticks;
        return ticksToTimeCode(totalTicks);
    }

    /**
     * 시간 빼기
     */
    function subtractTime(time1: TimeCode, time2: TimeCode): TimeCode {
        const resultTicks = Math.max(0, time1.ticks - time2.ticks);
        return ticksToTimeCode(resultTicks);
    }

    /**
     * 시간을 타임코드 문자열로 포맷
     */
    function formatTimecode(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const frames = Math.floor((seconds % 1) * 30); // 30fps 가정

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }

    /**
     * 클립 정보 검증
     */
    function validateClipInfo(clip: any): ClipInfo | null {
        if (!clip || typeof clip !== 'object') {
            return null;
        }

        // 필수 필드 검증
        const requiredFields = ['id', 'name', 'start', 'end', 'trackIndex'];
        for (const field of requiredFields) {
            if (!(field in clip)) {
                const utils = getUtils();
                utils.logWarn(`클립 정보에 필수 필드 누락: ${field}`);
                return null;
            }
        }

        // 시간 필드 검증
        if (!isValidTimeCode(clip.start) || !isValidTimeCode(clip.end)) {
            const utils = getUtils();
            utils.logWarn('클립의 시간 정보가 유효하지 않음');
            return null;
        }

        return clip as ClipInfo;
    }

    /**
     * TimeCode 유효성 검사
     */
    function isValidTimeCode(timeCode: any): boolean {
        return timeCode && 
               typeof timeCode.ticks === 'number' && 
               typeof timeCode.seconds === 'number' &&
               timeCode.ticks >= 0;
    }

    /**
     * 시간 차이를 사람이 읽기 쉬운 형태로 변환
     */
    function formatDuration(timeCode: TimeCode): string {
        const seconds = timeCode.seconds;
        
        if (seconds < 60) {
            return `${seconds.toFixed(1)}초`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}분 ${remainingSeconds}초`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}시간 ${minutes}분`;
        }
    }

    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        const dependencies: string[] = [];
        if (utilsService) 
            dependencies.push('JSCUtils (DI)');
        else if ((window as any).JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
            
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
            dependencies: dependencies
        };
    }

    // 공개 API 반환
    return {
        sortClipsByTime,
        analyzeClipGaps,
        createInsertionPlan,
        createMagnetPlan,
        createTimeCode,
        ticksToTimeCode,
        addTime,
        subtractTime,
        validateClipInfo,
        formatDuration,
        getDIStatus // DI 패턴 적용
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    (window as any).ClipTimeCalculator = ClipTimeCalculator;
}