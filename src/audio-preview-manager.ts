/**
 * Audio Preview Manager
 * 오디오 파일 미리보기 재생을 담당하는 TypeScript 모듈
 */

interface AudioPreviewConfig {
    volume: number;
    maxDuration: number; // 초 단위
    fadeInDuration: number; // 초 단위
    fadeOutDuration: number; // 초 단위
}

interface AudioPreviewResult {
    success: boolean;
    message: string;
    duration?: number | undefined;
    error?: string | undefined;
}

const AudioPreviewManager = (function() {
    'use strict';
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    let uiService: any = null;
    
    function initializeDIDependencies() {
        try {
            diContainer = (window as any).DI;
            if (diContainer) {
                utilsService = diContainer.getSafe('JSCUtils');
                uiService = diContainer.getSafe('JSCUIManager');
            }
        }
        catch (e) {
            // DI 사용 불가시 레거시 모드로 작동
        }
    }
    
    // 초기화 시도
    initializeDIDependencies();
    
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            if (!utilsService || !uiService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    
    // 서비스 가져오기 헬퍼 함수들
    function getUtils(): JSCUtilsInterface {
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[AudioPreviewManager]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[AudioPreviewManager]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[AudioPreviewManager]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[AudioPreviewManager]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[AudioPreviewManager]', msg),
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
    
    function getUIManager() {
        return uiService || (window as any).JSCUIManager || {
            updateStatus: (msg: string, _success: boolean) => console.log('Status:', msg)
        };
    }
    
    // 현재 재생 중인 오디오
    let currentAudio: HTMLAudioElement | null = null;
    let currentButton: HTMLElement | null = null;
    let fadeInterval: number | null = null;
    
    // 기본 설정
    const defaultConfig: AudioPreviewConfig = {
        volume: 1.0, // 각 오디오 파일의 원본 볼륨이 다르므로 최대 볼륨 사용
        maxDuration: 10, // 10초 최대 재생
        fadeInDuration: 0, // 페이드인 사용 안 함 (즉시 재생)
        fadeOutDuration: 1.0
    };

    let config = { ...defaultConfig };

    /**
     * localStorage에서 미리보기 볼륨 가져오기
     */
    function getPreviewVolume(): number {
        try {
            const saved = localStorage.getItem('audioPreviewVolume');
            if (saved) {
                const volume = parseInt(saved, 10) / 100; // 0-100 → 0-1
                return Math.max(0, Math.min(1, volume)); // 0-1 범위로 제한
            }
        } catch (e) {
            getUtils().logWarn('볼륨 설정 로드 실패');
        }
        return 1.0; // 기본값
    }
    
    /**
     * 미리보기 설정 업데이트
     */
    function updateConfig(newConfig: Partial<AudioPreviewConfig>): void {
        config = { ...config, ...newConfig };
        getUtils().logDebug(`미리보기 설정 업데이트: ${JSON.stringify(config)}`);
    }
    
    /**
     * 오디오 미리보기 재생
     */
    async function playPreview(filePath: string, buttonElement?: HTMLElement): Promise<AudioPreviewResult> {
        try {
            getUtils().logDebug(`미리보기 재생 시도: ${filePath}`);

            // 현재 재생 중인 오디오 즉시 정지
            stopCurrentPreviewImmediately();

            // 파일 경로 검증
            if (!filePath || typeof filePath !== 'string') {
                return {
                    success: false,
                    message: '유효하지 않은 파일 경로입니다.',
                    error: 'Invalid file path'
                };
            }

            // CEP 환경에서 로컬 파일 접근을 위한 URL 생성
            let fileUrl: string;
            if (filePath.startsWith('file://')) {
                fileUrl = filePath;
            } else {
                // Windows 경로를 file:// URL로 변환
                fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
            }

            getUtils().logDebug(`파일 URL: ${fileUrl}`);

            // HTML5 Audio 객체 생성
            currentAudio = new Audio(fileUrl);
            currentButton = buttonElement || null;

            // 오디오 설정 (사용자 설정 볼륨 적용)
            currentAudio.volume = getPreviewVolume();
            currentAudio.preload = 'auto';

            // 이벤트 리스너 설정
            return new Promise<AudioPreviewResult>((resolve) => {
                if (!currentAudio) {
                    resolve({
                        success: false,
                        message: '오디오 객체 생성 실패',
                        error: 'Audio object creation failed'
                    });
                    return;
                }

                // 로드 완료 시
                currentAudio.addEventListener('loadeddata', () => {
                    getUtils().logDebug('오디오 로드 완료');
                });

                // 재생 시작 시
                currentAudio.addEventListener('play', () => {
                    getUtils().logDebug('미리보기 재생 시작');

                    // 버튼 시각적 피드백
                    if (currentButton) {
                        currentButton.style.backgroundColor = '#4CAF50';
                        currentButton.style.transform = 'scale(0.95)';
                    }

                    // UI 상태 업데이트
                    getUIManager().updateStatus('🔊 미리보기 재생 중...', true);

                    resolve({
                        success: true,
                        message: '미리보기 재생을 시작했습니다.',
                        duration: currentAudio?.duration || undefined
                    });
                });

                // 재생 종료 시 (자연스럽게 끝났을 때는 즉시 정지)
                currentAudio.addEventListener('ended', () => {
                    getUtils().logDebug('미리보기 재생 완료');
                    stopCurrentPreviewImmediately();
                });

                // 오류 발생 시
                currentAudio.addEventListener('error', (e) => {
                    const error = (e.target as HTMLAudioElement)?.error;
                    const errorMessage = `미리보기 재생 실패: ${error?.message || '알 수 없는 오류'}`;

                    getUtils().logWarn(errorMessage);
                    getUIManager().updateStatus(errorMessage, false);

                    stopCurrentPreview();

                    resolve({
                        success: false,
                        message: errorMessage,
                        error: error?.message || 'Unknown error'
                    });
                });

                // 재생 시작
                currentAudio.play().catch(error => {
                    const errorMessage = `재생 시작 실패: ${error.message}`;
                    getUtils().logWarn(errorMessage);

                    resolve({
                        success: false,
                        message: errorMessage,
                        error: error.message
                    });
                });

                // 최대 재생 시간 제한
                setTimeout(() => {
                    if (currentAudio && !currentAudio.paused) {
                        getUtils().logDebug(`최대 재생 시간(${config.maxDuration}초) 도달, 자동 정지`);
                        stopCurrentPreview();
                    }
                }, config.maxDuration * 1000);
            });
            
        } catch (error) {
            const errorMessage = `미리보기 재생 중 오류: ${(error as Error).message}`;
            getUtils().logWarn(errorMessage);
            getUIManager().updateStatus(errorMessage, false);
            
            return {
                success: false,
                message: errorMessage,
                error: (error as Error).message
            };
        }
    }
    
    /**
     * 현재 재생 중인 미리보기 정지
     */
    function stopCurrentPreview(): void {
        try {
            // 페이드 인터벌 정리
            if (fadeInterval) {
                clearInterval(fadeInterval);
                fadeInterval = null;
            }

            if (currentAudio) {
                // 페이드아웃 시작
                startFadeOut(() => {
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                        currentAudio = null;
                    }

                    // 페이드아웃 완료 후 버튼 상태 복원
                    if (currentButton) {
                        currentButton.style.backgroundColor = '';
                        currentButton.style.transform = '';
                        currentButton = null;
                    }

                    // UI 상태 업데이트
                    getUIManager().updateStatus('미리보기 정지됨', true);
                });
            } else {
                // currentAudio가 없으면 즉시 버튼만 복원
                if (currentButton) {
                    currentButton.style.backgroundColor = '';
                    currentButton.style.transform = '';
                    currentButton = null;
                }

                // UI 상태 업데이트
                getUIManager().updateStatus('미리보기 정지됨', true);
            }

        } catch (error) {
            getUtils().logWarn(`미리보기 정지 중 오류: ${(error as Error).message}`);
        }
    }
    
    /**
     * 현재 재생 중인 미리보기 즉시 정지 (페이드아웃 없음)
     */
    function stopCurrentPreviewImmediately(): void {
        try {
            // 페이드 인터벌 정리
            if (fadeInterval) {
                clearInterval(fadeInterval);
                fadeInterval = null;
            }

            // 오디오 즉시 정지
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }

            // 버튼 상태 복원
            if (currentButton) {
                currentButton.style.backgroundColor = '';
                currentButton.style.transform = '';
                currentButton = null;
            }

            // UI 상태 업데이트
            getUIManager().updateStatus('🔇 미리보기 정지됨', true);

        } catch (error) {
            getUtils().logWarn(`미리보기 즉시 정지 중 오류: ${(error as Error).message}`);
        }
    }
    
    /**
     * 페이드인 효과 (현재 사용 안 함 - 즉시 재생)
     */
    /*
    function startFadeIn(): void {
        if (!currentAudio) {
            getUtils().logDebug(`🎵 [FadeIn] ❌ currentAudio가 null이어서 페이드인 중단`);
            return;
        }

        // 기존 페이드 인터벌 정리 (중복 방지)
        if (fadeInterval) {
            getUtils().logDebug(`🎵 [FadeIn] 기존 fadeInterval 정리`);
            clearInterval(fadeInterval);
            fadeInterval = null;
        }

        const targetVolume = config.volume;
        const stepCount = Math.floor(config.fadeInDuration * 20); // 50ms 간격
        const volumeStep = targetVolume / stepCount;
        let currentStep = 0;

        getUtils().logDebug(`🎵 [FadeIn] 시작 - targetVolume: ${targetVolume}, stepCount: ${stepCount}, volumeStep: ${volumeStep}, initialVolume: ${currentAudio.volume}`);

        fadeInterval = setInterval(() => {
            if (!currentAudio || currentStep >= stepCount) {
                if (fadeInterval) {
                    clearInterval(fadeInterval);
                    fadeInterval = null;
                }
                if (currentAudio) {
                    currentAudio.volume = targetVolume;
                    getUtils().logDebug(`🎵 [FadeIn] ✅ 완료 - 최종 volume: ${currentAudio.volume}`);
                } else {
                    getUtils().logDebug(`🎵 [FadeIn] ❌ currentAudio가 null이 됨`);
                }
                return;
            }

            const newVolume = Math.min(targetVolume, volumeStep * currentStep);
            currentAudio.volume = newVolume;

            // 5단계마다 로그 (너무 많은 로그 방지)
            if (currentStep % 5 === 0 || currentStep === 0) {
                getUtils().logDebug(`🎵 [FadeIn] Step ${currentStep}/${stepCount} - volume: ${newVolume.toFixed(3)}`);
            }

            currentStep++;
        }, 50) as any;
    }
    */
    
    /**
     * 페이드아웃 효과
     */
    function startFadeOut(onComplete?: () => void): void {
        if (!currentAudio) {
            if (onComplete) onComplete();
            return;
        }

        // 기존 페이드 인터벌 정리 (중복 방지)
        if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
        }

        const initialVolume = currentAudio.volume;
        const stepCount = Math.floor(config.fadeOutDuration * 20); // 50ms 간격
        const volumeStep = initialVolume / stepCount;
        let currentStep = 0;

        fadeInterval = setInterval(() => {
            if (!currentAudio || currentStep >= stepCount) {
                if (fadeInterval) {
                    clearInterval(fadeInterval);
                    fadeInterval = null;
                }
                if (onComplete) onComplete();
                return;
            }

            currentAudio.volume = Math.max(0, initialVolume - (volumeStep * currentStep));
            currentStep++;
        }, 50) as any;
    }
    
    /**
     * 현재 재생 상태 확인
     */
    function isPlaying(): boolean {
        return currentAudio !== null && !currentAudio.paused;
    }
    
    /**
     * 현재 재생 중인 버튼인지 확인
     */
    function isCurrentButton(button: HTMLElement): boolean {
        return currentButton === button;
    }
    
    /**
     * 볼륨 설정
     */
    function setVolume(volume: number): void {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        config.volume = clampedVolume;
        
        if (currentAudio) {
            currentAudio.volume = clampedVolume;
        }
        
        getUtils().logDebug(`미리보기 볼륨 설정: ${clampedVolume}`);
    }
    
    /**
     * 지원되는 오디오 형식 확인
     */
    function getSupportedFormats(): string[] {
        const audio = new Audio();
        const formats: string[] = [];
        
        const testFormats = [
            { ext: 'mp3', mime: 'audio/mpeg' },
            { ext: 'wav', mime: 'audio/wav' },
            { ext: 'ogg', mime: 'audio/ogg' },
            { ext: 'm4a', mime: 'audio/mp4' },
            { ext: 'aac', mime: 'audio/aac' },
            { ext: 'flac', mime: 'audio/flac' }
        ];
        
        testFormats.forEach(format => {
            const canPlay = audio.canPlayType(format.mime);
            if (canPlay === 'probably' || canPlay === 'maybe') {
                formats.push(format.ext);
            }
        });
        
        return formats;
    }
    
    /**
     * 매니저 상태 정보
     */
    function getStatus() {
        return {
            isPlaying: isPlaying(),
            currentFile: currentAudio?.src || null,
            config: { ...config },
            supportedFormats: getSupportedFormats()
        };
    }
    
    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        const dependencies: string[] = [];
        if (utilsService) 
            dependencies.push('JSCUtils (DI)');
        else if ((window as any).JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
        
        if (uiService)
            dependencies.push('JSCUIManager (DI)');  
        else if ((window as any).JSCUIManager)
            dependencies.push('JSCUIManager (Legacy)');
            
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
            dependencies: dependencies
        };
    }
    
    // 정리 함수 (페이지 언로드 시)
    function cleanup(): void {
        stopCurrentPreview();
        getUtils().logDebug('AudioPreviewManager 정리 완료');
    }
    
    // 페이지 언로드 시 정리
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', cleanup);
    }
    
    // 공개 API 반환
    return {
        playPreview,
        stopCurrentPreview,
        stopCurrentPreviewImmediately,
        isPlaying,
        isCurrentButton,
        setVolume,
        updateConfig,
        getSupportedFormats,
        getStatus,
        getDIStatus,
        cleanup
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    (window as any).AudioPreviewManager = AudioPreviewManager;
}