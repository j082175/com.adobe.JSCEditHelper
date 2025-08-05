/**
 * Sound Engine - Main Business Logic
 * 효과음 삽입의 핵심 비즈니스 로직을 담당하는 메인 엔진
 */

interface SoundEngineConfig {
    folderPath: string;
    audioTrack: string | number;
    filterByDefaultPrefix?: boolean;
    excludePatterns?: string[];
    maxInsertions?: number;
}

interface SoundEngineResult {
    success: boolean;
    message: string;
    data?: any;
    debug?: string;
    debugLog?: string;
    executionTime?: number;
}

interface ExtendScriptCommand {
    action: string;
    data: any;
    requestId: string;
}

const SoundEngine = (function() {
    let requestCounter = 0;

    /**
     * 효과음 삽입 전체 프로세스 실행
     */
    async function executeSoundInsertion(config: SoundEngineConfig): Promise<SoundEngineResult> {
        const startTime = performance.now();
        let debugInfo = `효과음 삽입 시작 - ${new Date().toISOString()}\n`;
        
        try {
            debugInfo += `설정: ${JSON.stringify(config)}\n`;
            
            // 1. 입력 검증
            const validation = validateConfig(config);
            if (!validation.success) {
                return {
                    success: false,
                    message: validation.message,
                    debug: debugInfo + `검증 실패: ${validation.message}\n`
                };
            }

            // 2. 오디오 파일 검색 및 필터링
            debugInfo += "오디오 파일 검색 중...\n";
            const audioResult = await processAudioFiles(config);
            if (!audioResult.success) {
                return {
                    success: false,
                    message: audioResult.message,
                    debug: debugInfo + `오디오 파일 처리 실패: ${audioResult.message}\n`
                };
            }
            
            const audioFiles = audioResult.data as string[];
            debugInfo += `발견된 오디오 파일: ${audioFiles.length}개\n`;

            // 3. 클립 정보 수집
            debugInfo += "클립 정보 수집 중...\n";
            const clipsResult = await getSelectedClips();
            if (!clipsResult.success) {
                return {
                    success: false,
                    message: clipsResult.message,
                    debug: debugInfo + `클립 정보 수집 실패: ${clipsResult.message}\n`
                };
            }

            const clips = clipsResult.data as ClipInfo[];
            debugInfo += `선택된 클립: ${clips.length}개\n`;

            // 4. 삽입 계획 생성
            const audioTrackNumber = parseAudioTrack(config.audioTrack);
            const insertionPlan = (window as any).ClipTimeCalculator.createInsertionPlan(clips, audioFiles, audioTrackNumber);
            
            if (insertionPlan.totalInsertions === 0) {
                return {
                    success: false,
                    message: "삽입할 수 있는 위치가 없습니다. 클립을 2개 이상 선택해주세요.",
                    debug: debugInfo + "삽입 계획 생성 실패: 삽입 위치 없음\n"
                };
            }

            debugInfo += `삽입 계획: ${insertionPlan.totalInsertions}개 위치, 예상 시간: ${(window as any).ClipTimeCalculator.formatDuration(insertionPlan.estimatedDuration)}\n`;

            // 5. ExtendScript 명령 생성 및 실행
            const command = createInsertionCommand(insertionPlan, config);
            debugInfo += `ExtendScript 명령 생성 완료\n`;
            
            const executionResult = await executeExtendScriptCommand(command);
            
            const executionTime = performance.now() - startTime;
            debugInfo += `실행 완료 - 총 소요 시간: ${executionTime.toFixed(2)}ms\n`;
            
            // ExtendScript 디버그 로그 포함
            if (executionResult.debugLog) {
                debugInfo += "\n--- ExtendScript 통신 디버그 ---\n";
                debugInfo += executionResult.debugLog;
            }
            
            // JSX 내부 디버그 정보 포함
            if (executionResult.debug) {
                debugInfo += "\n--- JSX 내부 실행 디버그 ---\n";
                debugInfo += executionResult.debug;
            }

            const result: SoundEngineResult = {
                success: executionResult.success,
                message: executionResult.success 
                    ? `${insertionPlan.totalInsertions}개의 효과음이 성공적으로 삽입되었습니다.`
                    : executionResult.message,
                data: {
                    insertions: insertionPlan.totalInsertions,
                    audioTrack: audioTrackNumber,
                    files: audioFiles.length
                },
                debug: debugInfo,
                executionTime
            };

            // debugLog가 존재하는 경우에만 추가
            if (executionResult.debugLog) {
                result.debugLog = executionResult.debugLog;
            }

            return result;

        } catch (error) {
            const executionTime = performance.now() - startTime;
            debugInfo += `예외 발생: ${(error as Error).message}\n`;
            
            return {
                success: false,
                message: "효과음 삽입 중 오류가 발생했습니다.",
                debug: debugInfo,
                executionTime
            };
        }
    }

    /**
     * 클립 자동 정렬(마그넷) 실행
     */
    async function executeMagnetClips(): Promise<SoundEngineResult> {
        const startTime = performance.now();
        let debugInfo = `클립 자동 정렬 시작 - ${new Date().toISOString()}\n`;

        try {
            // 1. 클립 정보 수집
            const clipsResult = await getAllClipsInSequence();
            if (!clipsResult.success) {
                return {
                    success: false,
                    message: clipsResult.message,
                    debug: debugInfo + `클립 정보 수집 실패: ${clipsResult.message}\n`
                };
            }

            const clips = clipsResult.data as ClipInfo[];
            debugInfo += `시퀀스 내 클립: ${clips.length}개\n`;

            // 2. 마그넷 계획 생성
            const magnetPlan = (window as any).ClipTimeCalculator.createMagnetPlan(clips);
            
            if (magnetPlan.totalMoved === 0) {
                return {
                    success: true,
                    message: "정렬할 간격이 없습니다. 모든 클립이 이미 올바르게 정렬되어 있습니다.",
                    data: {
                        clipsMoved: 0,
                        gapsRemoved: 0
                    },
                    debug: debugInfo + "정렬 불필요: 간격 없음\n"
                };
            }

            debugInfo += `정렬 계획: ${magnetPlan.totalMoved}개 클립 이동, ${magnetPlan.gapsRemoved}개 간격 제거\n`;

            // 3. ExtendScript 명령 실행
            const command = createMagnetCommand(magnetPlan);
            const executionResult = await executeExtendScriptCommand(command);

            const executionTime = performance.now() - startTime;
            debugInfo += `실행 완료 - 총 소요 시간: ${executionTime.toFixed(2)}ms\n`;

            return {
                success: executionResult.success,
                message: executionResult.success
                    ? `${magnetPlan.totalMoved}개 클립을 이동하여 ${magnetPlan.gapsRemoved}개의 간격을 제거했습니다.`
                    : executionResult.message,
                data: {
                    clipsMoved: magnetPlan.totalMoved,
                    gapsRemoved: magnetPlan.gapsRemoved
                },
                debug: debugInfo,
                executionTime
            };

        } catch (error) {
            const executionTime = performance.now() - startTime;
            debugInfo += `예외 발생: ${(error as Error).message}\n`;

            return {
                success: false,
                message: "클립 자동 정렬 중 오류가 발생했습니다.",
                debug: debugInfo,
                executionTime
            };
        }
    }

    /**
     * 설정 검증
     */
    function validateConfig(config: SoundEngineConfig): SoundEngineResult {
        const errors: string[] = [];

        // 폴더 경로 검증
        if (!config.folderPath || typeof config.folderPath !== 'string') {
            errors.push('폴더 경로가 필요합니다');
        } else if (!window.JSCUtils.isValidPath(config.folderPath)) {
            errors.push('유효하지 않은 폴더 경로입니다');
        }

        // 오디오 트랙 검증
        if (config.audioTrack === undefined || config.audioTrack === null) {
            errors.push('오디오 트랙을 선택해주세요');
        }

        // 최대 삽입 개수 검증
        if (config.maxInsertions && (config.maxInsertions < 1 || config.maxInsertions > 1000)) {
            errors.push('최대 삽입 개수는 1-1000 사이여야 합니다');
        }

        return {
            success: errors.length === 0,
            message: errors.length > 0 ? errors.join(', ') : 'Valid configuration'
        };
    }

    /**
     * 오디오 파일 처리
     */
    async function processAudioFiles(config: SoundEngineConfig): Promise<SoundEngineResult> {
        try {
            const audioConfig = {
                folderPath: config.folderPath,
                filterByDefaultPrefix: config.filterByDefaultPrefix ?? true,
                excludePatterns: config.excludePatterns || []
            };

            // ExtendScript에서 파일 목록 가져오기
            const command: ExtendScriptCommand = {
                action: 'getAudioFiles',
                data: {
                    folderPath: audioConfig.folderPath,
                    filterByDefaultPrefix: audioConfig.filterByDefaultPrefix,
                    excludePatterns: audioConfig.excludePatterns
                },
                requestId: generateRequestId()
            };

            const result = await executeExtendScriptCommand(command);
            
            if (!result.success) {
                return {
                    success: false,
                    message: '오디오 파일을 불러올 수 없습니다: ' + result.message
                };
            }

            const audioFiles = result.data as string[];
            if (!audioFiles || audioFiles.length === 0) {
                const filterMsg = audioConfig.filterByDefaultPrefix 
                    ? "'Default'로 시작하는 " 
                    : "";
                return {
                    success: false,
                    message: `선택된 폴더에서 ${filterMsg}오디오 파일을 찾을 수 없습니다.`
                };
            }

            return {
                success: true,
                message: `${audioFiles.length}개의 오디오 파일을 찾았습니다.`,
                data: audioFiles
            };

        } catch (error) {
            return {
                success: false,
                message: '오디오 파일 처리 중 오류가 발생했습니다: ' + (error as Error).message
            };
        }
    }

    /**
     * 선택된 클립 정보 수집
     */
    async function getSelectedClips(): Promise<SoundEngineResult> {
        const command: ExtendScriptCommand = {
            action: 'getSelectedClips',
            data: {},
            requestId: generateRequestId()
        };

        return await executeExtendScriptCommand(command);
    }

    /**
     * 시퀀스 내 모든 클립 정보 수집
     */
    async function getAllClipsInSequence(): Promise<SoundEngineResult> {
        const command: ExtendScriptCommand = {
            action: 'getAllClips',
            data: {},
            requestId: generateRequestId()
        };

        return await executeExtendScriptCommand(command);
    }

    /**
     * 오디오 트랙 번호 파싱
     */
    function parseAudioTrack(audioTrack: string | number): number {
        if (typeof audioTrack === 'number') {
            return Math.max(1, Math.floor(audioTrack));
        }

        if (typeof audioTrack === 'string') {
            if (audioTrack.toLowerCase() === 'auto') {
                return 1; // 기본값
            }
            
            const parsed = parseInt(audioTrack, 10);
            if (!isNaN(parsed)) {
                return Math.max(1, parsed);
            }
        }

        return 1; // 기본값
    }

    /**
     * 삽입 명령어 생성
     */
    function createInsertionCommand(plan: InsertionPlan, config: SoundEngineConfig): ExtendScriptCommand {
        return {
            action: 'executeInsertionPlan',
            data: {
                insertions: plan.insertions,
                audioTrack: plan.audioTrack,
                folderPath: config.folderPath
            },
            requestId: generateRequestId()
        };
    }

    /**
     * 마그넷 명령어 생성
     */
    function createMagnetCommand(plan: MagnetPlan): ExtendScriptCommand {
        return {
            action: 'executeMagnetPlan',
            data: {
                movements: plan.movements,
                estimatedTime: plan.estimatedTime
            },
            requestId: generateRequestId()
        };
    }

    /**
     * ExtendScript 명령 실행
     */
    async function executeExtendScriptCommand(command: ExtendScriptCommand): Promise<SoundEngineResult & { debugLog?: string }> {
        return new Promise((resolve) => {
            const commandJson = JSON.stringify(command);
            const jsxFunction = `executeSoundEngineCommand(${JSON.stringify(commandJson)})`;

            // 디버그 로그 수집
            let debugLog = "";
            
            // ExtendScript 호출 및 응답 디버깅
            const logEntry1 = `🔧 ExtendScript 호출: ${jsxFunction}`;
            console.log(logEntry1);
            debugLog += logEntry1 + "\n";

            window.JSCCommunication.callExtendScript(jsxFunction, (result: string) => {
                try {
                    const logEntry2 = `🔧 ExtendScript 원본 응답: ${result}`;
                    const logEntry3 = `🔧 응답 타입: ${typeof result}`;
                    const logEntry4 = `🔧 응답 길이: ${result ? result.length : 0}`;
                    
                    console.log(logEntry2);
                    console.log(logEntry3);
                    console.log(logEntry4);
                    
                    debugLog += logEntry2 + "\n";
                    debugLog += logEntry3 + "\n";
                    debugLog += logEntry4 + "\n";

                    if (result === "true" || result === "false") {
                        const logEntry5 = "🔧 boolean 문자열 응답 처리";
                        console.log(logEntry5);
                        debugLog += logEntry5 + "\n";
                        
                        resolve({
                            success: result === "true",
                            message: result === "true" ? "Success" : "Failed",
                            debugLog: debugLog
                        });
                        return;
                    }

                    // JSON 응답 파싱 시도
                    const parsedResult = window.JSCUtils.safeJSONParse(result);
                    const logEntry6 = `🔧 JSON 파싱 결과: ${JSON.stringify(parsedResult)}`;
                    console.log(logEntry6);
                    debugLog += logEntry6 + "\n";

                    if (parsedResult) {
                        const logEntry7 = "🔧 JSON 파싱 성공, 결과 반환";
                        console.log(logEntry7);
                        debugLog += logEntry7 + "\n";
                        
                        resolve({
                            ...parsedResult,
                            debugLog: debugLog
                        } as SoundEngineResult & { debugLog: string });
                        return;
                    }

                    // 에러 메시지 처리
                    if (result && result.startsWith('error:')) {
                        const logEntry8 = "🔧 에러 메시지 처리";
                        console.log(logEntry8);
                        debugLog += logEntry8 + "\n";
                        
                        resolve({
                            success: false,
                            message: result.substring(6), // 'error:' 제거
                            debugLog: debugLog
                        });
                        return;
                    }

                    // 기본 실패 응답
                    const logEntry9 = "🔧 기본 실패 응답 처리";
                    console.log(logEntry9);
                    debugLog += logEntry9 + "\n";
                    
                    resolve({
                        success: false,
                        message: result || "알 수 없는 오류가 발생했습니다.",
                        debugLog: debugLog
                    });

                } catch (error) {
                    const logEntry10 = `🔧 예외 발생: ${error}`;
                    console.log(logEntry10);
                    debugLog += logEntry10 + "\n";
                    
                    resolve({
                        success: false,
                        message: "응답 처리 중 오류가 발생했습니다: " + (error as Error).message,
                        debugLog: debugLog
                    });
                }
            });
        });
    }

    /**
     * 요청 ID 생성
     */
    function generateRequestId(): string {
        return `req_${Date.now()}_${++requestCounter}`;
    }

    /**
     * 엔진 상태 확인
     */
    function getEngineStatus(): { isReady: boolean; dependencies: string[] } {
        const dependencies = [];
        let isReady = true;

        // 필수 의존성 체크
        if (!window.JSCUtils) {
            dependencies.push('JSCUtils');
            isReady = false;
        }

        if (!window.JSCCommunication) {
            dependencies.push('JSCCommunication');
            isReady = false;
        }

        if (!window.JSCUIManager) {
            dependencies.push('JSCUIManager');
            isReady = false;
        }

        return { isReady, dependencies };
    }

    // 공개 API 반환
    return {
        executeSoundInsertion,
        executeMagnetClips,
        getEngineStatus
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    (window as any).SoundEngine = SoundEngine;
}