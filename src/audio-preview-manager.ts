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
    function getUtils() {
        return utilsService || (window as any).JSCUtils || {
            logDebug: (msg: string) => console.log('[DEBUG]', msg),
            logWarn: (msg: string) => console.warn('[WARN]', msg),
            logInfo: (msg: string) => console.info('[INFO]', msg)
        };
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
        volume: 0.7,
        maxDuration: 10, // 10초 최대 재생
        fadeInDuration: 0.5,
        fadeOutDuration: 1.0
    };
    
    let config = { ...defaultConfig };
    
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
            
            // 현재 재생 중인 오디오 정지
            stopCurrentPreview();
            
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
            
            // 오디오 설정
            currentAudio.volume = 0; // 페이드인을 위해 0으로 시작
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
                    
                    // 페이드인 효과
                    startFadeIn();
                    
                    // UI 상태 업데이트
                    getUIManager().updateStatus('🔊 미리보기 재생 중...', true);
                    
                    resolve({
                        success: true,
                        message: '미리보기 재생을 시작했습니다.',
                        duration: currentAudio?.duration || undefined
                    });
                });
                
                // 재생 종료 시
                currentAudio.addEventListener('ended', () => {
                    getUtils().logDebug('미리보기 재생 완료');
                    stopCurrentPreview();
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
            if (currentAudio) {
                // 페이드아웃 시작
                startFadeOut(() => {
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                        currentAudio = null;
                    }
                });
            }
            
            // 버튼 상태 복원
            if (currentButton) {
                currentButton.style.backgroundColor = '';
                currentButton.style.transform = '';
                currentButton = null;
            }
            
            // 페이드 인터벌 정리
            if (fadeInterval) {
                clearInterval(fadeInterval);
                fadeInterval = null;
            }
            
            // UI 상태 업데이트
            getUIManager().updateStatus('미리보기 정지됨', true);
            
        } catch (error) {
            getUtils().logWarn(`미리보기 정지 중 오류: ${(error as Error).message}`);
        }
    }
    
    /**
     * 페이드인 효과
     */
    function startFadeIn(): void {
        if (!currentAudio) return;
        
        const targetVolume = config.volume;
        const stepCount = Math.floor(config.fadeInDuration * 20); // 50ms 간격
        const volumeStep = targetVolume / stepCount;
        let currentStep = 0;
        
        fadeInterval = setInterval(() => {
            if (!currentAudio || currentStep >= stepCount) {
                if (fadeInterval) {
                    clearInterval(fadeInterval);
                    fadeInterval = null;
                }
                if (currentAudio) {
                    currentAudio.volume = targetVolume;
                }
                return;
            }
            
            currentAudio.volume = Math.min(targetVolume, volumeStep * currentStep);
            currentStep++;
        }, 50) as any;
    }
    
    /**
     * 페이드아웃 효과
     */
    function startFadeOut(onComplete?: () => void): void {
        if (!currentAudio) {
            if (onComplete) onComplete();
            return;
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
        isPlaying,
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