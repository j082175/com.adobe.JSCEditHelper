"use strict";
/**
 * Audio Preview Manager
 * 오디오 파일 미리보기 재생을 담당하는 TypeScript 모듈
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var AudioPreviewManager = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var uiService = null;
    function initializeDIDependencies() {
        try {
            diContainer = window.DI;
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
        setTimeout(function () {
            if (!utilsService || !uiService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    // 서비스 가져오기 헬퍼 함수들
    function getUtils() {
        var fallback = {
            debugLog: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[AudioPreviewManager]', msg);
            },
            logDebug: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[AudioPreviewManager]', msg);
            },
            logInfo: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.info('[AudioPreviewManager]', msg);
            },
            logWarn: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.warn('[AudioPreviewManager]', msg);
            },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error('[AudioPreviewManager]', msg);
            },
            isValidPath: function (path) { return !!path; },
            getShortPath: function (path) { return path; },
            safeJSONParse: function (str) {
                try {
                    return JSON.parse(str);
                }
                catch (e) {
                    return null;
                }
            },
            saveToStorage: function (key, value) { localStorage.setItem(key, value); return true; },
            loadFromStorage: function (key) { return localStorage.getItem(key); },
            removeFromStorage: function (key) { localStorage.removeItem(key); return true; },
            CONFIG: {
                DEBUG_MODE: false,
                SOUND_FOLDER_KEY: 'soundInserter_folder',
                APP_NAME: 'JSCEditHelper',
                VERSION: '1.0.0'
            },
            LOG_LEVELS: {},
            log: function () { },
            getDIStatus: function () { return ({ isDIAvailable: false, containerInfo: 'Fallback mode' }); }
        };
        return utilsService || window.JSCUtils || fallback;
    }
    function getUIManager() {
        return uiService || window.JSCUIManager || {
            updateStatus: function (msg, _success) { return console.log('Status:', msg); }
        };
    }
    // 현재 재생 중인 오디오
    var currentAudio = null;
    var currentButton = null;
    var fadeInterval = null;
    // 기본 설정
    var defaultConfig = {
        volume: 1.0, // 각 오디오 파일의 원본 볼륨이 다르므로 최대 볼륨 사용
        maxDuration: 10, // 10초 최대 재생
        fadeInDuration: 0, // 페이드인 사용 안 함 (즉시 재생)
        fadeOutDuration: 1.0
    };
    var config = __assign({}, defaultConfig);
    /**
     * localStorage에서 미리보기 볼륨 가져오기
     */
    function getPreviewVolume() {
        try {
            var saved = localStorage.getItem('audioPreviewVolume');
            if (saved) {
                var volume = parseInt(saved, 10) / 100; // 0-100 → 0-1
                return Math.max(0, Math.min(1, volume)); // 0-1 범위로 제한
            }
        }
        catch (e) {
            getUtils().logWarn('볼륨 설정 로드 실패');
        }
        return 1.0; // 기본값
    }
    /**
     * 미리보기 설정 업데이트
     */
    function updateConfig(newConfig) {
        config = __assign(__assign({}, config), newConfig);
        getUtils().logDebug("\uBBF8\uB9AC\uBCF4\uAE30 \uC124\uC815 \uC5C5\uB370\uC774\uD2B8: ".concat(JSON.stringify(config)));
    }
    /**
     * 오디오 미리보기 재생
     */
    function playPreview(filePath, buttonElement) {
        return __awaiter(this, void 0, void 0, function () {
            var fileUrl, errorMessage;
            return __generator(this, function (_a) {
                try {
                    getUtils().logDebug("\uBBF8\uB9AC\uBCF4\uAE30 \uC7AC\uC0DD \uC2DC\uB3C4: ".concat(filePath));
                    // 현재 재생 중인 오디오 즉시 정지
                    stopCurrentPreviewImmediately();
                    // 파일 경로 검증
                    if (!filePath || typeof filePath !== 'string') {
                        return [2 /*return*/, {
                                success: false,
                                message: '유효하지 않은 파일 경로입니다.',
                                error: 'Invalid file path'
                            }];
                    }
                    fileUrl = void 0;
                    if (filePath.startsWith('file://')) {
                        fileUrl = filePath;
                    }
                    else {
                        // Windows 경로를 file:// URL로 변환
                        fileUrl = "file:///".concat(filePath.replace(/\\/g, '/'));
                    }
                    getUtils().logDebug("\uD30C\uC77C URL: ".concat(fileUrl));
                    // HTML5 Audio 객체 생성
                    currentAudio = new Audio(fileUrl);
                    currentButton = buttonElement || null;
                    // 오디오 설정 (사용자 설정 볼륨 적용)
                    currentAudio.volume = getPreviewVolume();
                    currentAudio.preload = 'auto';
                    // 이벤트 리스너 설정
                    return [2 /*return*/, new Promise(function (resolve) {
                            if (!currentAudio) {
                                resolve({
                                    success: false,
                                    message: '오디오 객체 생성 실패',
                                    error: 'Audio object creation failed'
                                });
                                return;
                            }
                            // 로드 완료 시
                            currentAudio.addEventListener('loadeddata', function () {
                                getUtils().logDebug('오디오 로드 완료');
                            });
                            // 재생 시작 시
                            currentAudio.addEventListener('play', function () {
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
                                    duration: (currentAudio === null || currentAudio === void 0 ? void 0 : currentAudio.duration) || undefined
                                });
                            });
                            // 재생 종료 시 (자연스럽게 끝났을 때는 즉시 정지)
                            currentAudio.addEventListener('ended', function () {
                                getUtils().logDebug('미리보기 재생 완료');
                                stopCurrentPreviewImmediately();
                            });
                            // 오류 발생 시
                            currentAudio.addEventListener('error', function (e) {
                                var _a;
                                var error = (_a = e.target) === null || _a === void 0 ? void 0 : _a.error;
                                var errorMessage = "\uBBF8\uB9AC\uBCF4\uAE30 \uC7AC\uC0DD \uC2E4\uD328: ".concat((error === null || error === void 0 ? void 0 : error.message) || '알 수 없는 오류');
                                getUtils().logWarn(errorMessage);
                                getUIManager().updateStatus(errorMessage, false);
                                stopCurrentPreview();
                                resolve({
                                    success: false,
                                    message: errorMessage,
                                    error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'
                                });
                            });
                            // 재생 시작
                            currentAudio.play().catch(function (error) {
                                var errorMessage = "\uC7AC\uC0DD \uC2DC\uC791 \uC2E4\uD328: ".concat(error.message);
                                getUtils().logWarn(errorMessage);
                                resolve({
                                    success: false,
                                    message: errorMessage,
                                    error: error.message
                                });
                            });
                            // 최대 재생 시간 제한
                            setTimeout(function () {
                                if (currentAudio && !currentAudio.paused) {
                                    getUtils().logDebug("\uCD5C\uB300 \uC7AC\uC0DD \uC2DC\uAC04(".concat(config.maxDuration, "\uCD08) \uB3C4\uB2EC, \uC790\uB3D9 \uC815\uC9C0"));
                                    stopCurrentPreview();
                                }
                            }, config.maxDuration * 1000);
                        })];
                }
                catch (error) {
                    errorMessage = "\uBBF8\uB9AC\uBCF4\uAE30 \uC7AC\uC0DD \uC911 \uC624\uB958: ".concat(error.message);
                    getUtils().logWarn(errorMessage);
                    getUIManager().updateStatus(errorMessage, false);
                    return [2 /*return*/, {
                            success: false,
                            message: errorMessage,
                            error: error.message
                        }];
                }
                return [2 /*return*/];
            });
        });
    }
    /**
     * 현재 재생 중인 미리보기 정지
     */
    function stopCurrentPreview() {
        try {
            // 페이드 인터벌 정리
            if (fadeInterval) {
                clearInterval(fadeInterval);
                fadeInterval = null;
            }
            if (currentAudio) {
                // 페이드아웃 시작
                startFadeOut(function () {
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
            }
            else {
                // currentAudio가 없으면 즉시 버튼만 복원
                if (currentButton) {
                    currentButton.style.backgroundColor = '';
                    currentButton.style.transform = '';
                    currentButton = null;
                }
                // UI 상태 업데이트
                getUIManager().updateStatus('미리보기 정지됨', true);
            }
        }
        catch (error) {
            getUtils().logWarn("\uBBF8\uB9AC\uBCF4\uAE30 \uC815\uC9C0 \uC911 \uC624\uB958: ".concat(error.message));
        }
    }
    /**
     * 현재 재생 중인 미리보기 즉시 정지 (페이드아웃 없음)
     */
    function stopCurrentPreviewImmediately() {
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
        }
        catch (error) {
            getUtils().logWarn("\uBBF8\uB9AC\uBCF4\uAE30 \uC989\uC2DC \uC815\uC9C0 \uC911 \uC624\uB958: ".concat(error.message));
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
    function startFadeOut(onComplete) {
        if (!currentAudio) {
            if (onComplete)
                onComplete();
            return;
        }
        // 기존 페이드 인터벌 정리 (중복 방지)
        if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
        }
        var initialVolume = currentAudio.volume;
        var stepCount = Math.floor(config.fadeOutDuration * 20); // 50ms 간격
        var volumeStep = initialVolume / stepCount;
        var currentStep = 0;
        fadeInterval = setInterval(function () {
            if (!currentAudio || currentStep >= stepCount) {
                if (fadeInterval) {
                    clearInterval(fadeInterval);
                    fadeInterval = null;
                }
                if (onComplete)
                    onComplete();
                return;
            }
            currentAudio.volume = Math.max(0, initialVolume - (volumeStep * currentStep));
            currentStep++;
        }, 50);
    }
    /**
     * 현재 재생 상태 확인
     */
    function isPlaying() {
        return currentAudio !== null && !currentAudio.paused;
    }
    /**
     * 현재 재생 중인 버튼인지 확인
     */
    function isCurrentButton(button) {
        return currentButton === button;
    }
    /**
     * 볼륨 설정
     */
    function setVolume(volume) {
        var clampedVolume = Math.max(0, Math.min(1, volume));
        config.volume = clampedVolume;
        if (currentAudio) {
            currentAudio.volume = clampedVolume;
        }
        getUtils().logDebug("\uBBF8\uB9AC\uBCF4\uAE30 \uBCFC\uB968 \uC124\uC815: ".concat(clampedVolume));
    }
    /**
     * 지원되는 오디오 형식 확인
     */
    function getSupportedFormats() {
        var audio = new Audio();
        var formats = [];
        var testFormats = [
            { ext: 'mp3', mime: 'audio/mpeg' },
            { ext: 'wav', mime: 'audio/wav' },
            { ext: 'ogg', mime: 'audio/ogg' },
            { ext: 'm4a', mime: 'audio/mp4' },
            { ext: 'aac', mime: 'audio/aac' },
            { ext: 'flac', mime: 'audio/flac' }
        ];
        testFormats.forEach(function (format) {
            var canPlay = audio.canPlayType(format.mime);
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
            currentFile: (currentAudio === null || currentAudio === void 0 ? void 0 : currentAudio.src) || null,
            config: __assign({}, config),
            supportedFormats: getSupportedFormats()
        };
    }
    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        var dependencies = [];
        if (utilsService)
            dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
        if (uiService)
            dependencies.push('JSCUIManager (DI)');
        else if (window.JSCUIManager)
            dependencies.push('JSCUIManager (Legacy)');
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
            dependencies: dependencies
        };
    }
    // 정리 함수 (페이지 언로드 시)
    function cleanup() {
        stopCurrentPreview();
        getUtils().logDebug('AudioPreviewManager 정리 완료');
    }
    // 페이지 언로드 시 정리
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', cleanup);
    }
    // 공개 API 반환
    return {
        playPreview: playPreview,
        stopCurrentPreview: stopCurrentPreview,
        stopCurrentPreviewImmediately: stopCurrentPreviewImmediately,
        isPlaying: isPlaying,
        isCurrentButton: isCurrentButton,
        setVolume: setVolume,
        updateConfig: updateConfig,
        getSupportedFormats: getSupportedFormats,
        getStatus: getStatus,
        getDIStatus: getDIStatus,
        cleanup: cleanup
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.AudioPreviewManager = AudioPreviewManager;
}
//# sourceMappingURL=audio-preview-manager.js.map