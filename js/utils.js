"use strict";
/**
 * JSCEditHelper - Utility Functions
 * 유틸리티 함수들을 모아놓은 모듈
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
var JSCUtils = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    try {
        diContainer = window.DI;
    }
    catch (e) {
        // DI 사용 불가시 레거시 모드로 작동
    }
    // 설정 상수 (환경변수에서 읽어오거나 기본값 사용)
    var CONFIG = {
        DEBUG_MODE: (function () {
            try {
                return localStorage.getItem('JSC_DEBUG_MODE') === 'true' || false;
            }
            catch (e) {
                return false; // 프로덕션 기본값
            }
        })(),
        SOUND_FOLDER_KEY: "soundInserter_folder", // 기존 키와 호환성 유지
        APP_NAME: "JSCEditHelper",
        VERSION: "1.0.0"
    };
    var currentLogLevel = CONFIG.DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO;
    // 로깅 함수 (DI 지원)
    function log(level, message) {
        if (level <= currentLogLevel && console) {
            var prefix = "[".concat(CONFIG.APP_NAME, "] ");
            // DI에서 로거 서비스를 가져오려고 시도 (확장성)
            var logger = null;
            if (diContainer) {
                try {
                    logger = diContainer.getSafe('Logger');
                }
                catch (e) {
                    // 로거 서비스 없음, console 사용
                }
            }
            if (logger && typeof logger.log === 'function') {
                // DI 로거 사용
                logger.log(level, prefix + message);
            }
            else {
                // 기본 console 사용
                switch (level) {
                    case LogLevel.ERROR:
                        console.error(prefix + "ERROR: " + message);
                        break;
                    case LogLevel.WARN:
                        console.warn(prefix + "WARN: " + message);
                        break;
                    case LogLevel.INFO:
                        console.info(prefix + "INFO: " + message);
                        break;
                    case LogLevel.DEBUG:
                        console.log(prefix + "DEBUG: " + message);
                        break;
                }
            }
        }
    }
    // 편의 함수들 (하이브리드 로깅: ERROR/WARN은 UI에도 표시)
    function logError(message) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        log(LogLevel.ERROR, message);
        // ERROR는 UI에도 표시
        try {
            var timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
            var errorLog = "[".concat(timestamp, "] ERROR: ").concat(message, "\n");
            // lastDebugInfo에 누적 (기존 로그 유지)
            if (typeof window !== 'undefined') {
                window.lastDebugInfo = (window.lastDebugInfo || '') + errorLog;
                // 디버그 버튼 활성화
                if (window.JSCUIManager) {
                    window.JSCUIManager.toggleDebugButton(true);
                }
            }
        }
        catch (e) {
            // UI 업데이트 실패해도 콘솔 로그는 출력됨
        }
    }
    function logWarn(message) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        log(LogLevel.WARN, message);
        // WARN도 UI에 표시 (선택적)
        try {
            var timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            var warnLog = "[".concat(timestamp, "] WARN: ").concat(message, "\n");
            if (typeof window !== 'undefined') {
                window.lastDebugInfo = (window.lastDebugInfo || '') + warnLog;
                if (window.JSCUIManager) {
                    window.JSCUIManager.toggleDebugButton(true);
                }
            }
        }
        catch (e) {
            // UI 업데이트 실패해도 콘솔 로그는 출력됨
        }
    }
    function logInfo(message) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        log(LogLevel.INFO, message);
        // INFO는 콘솔에만 (UI 표시 안 함)
    }
    function logDebug(message) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        log(LogLevel.DEBUG, message);
        // DEBUG는 콘솔에만 (UI 표시 안 함)
    }
    // 하위 호환성을 위한 별칭
    function debugLog(message) {
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        logDebug(message);
    }
    // 실용적인 경로 검증 (기존 방식 복원)
    function isValidPath(path) {
        // 1. 기본 타입 및 존재 여부 확인
        if (!path || typeof path !== "string") {
            return false;
        }
        var trimmedPath = path.trim();
        // 2. 최소 길이 확인 (너무 짧으면 에러 가능성 높음)
        if (trimmedPath.length < 3) {
            return false;
        }
        // 3. ExtendScript 통신 에러 메시지 필터링 (핵심!)
        var errorPatterns = [
            "EvalScript error",
            "undefined",
            "null",
            "[object Object]",
            "error:",
            "JSX exception"
        ];
        for (var _i = 0, errorPatterns_1 = errorPatterns; _i < errorPatterns_1.length; _i++) {
            var pattern = errorPatterns_1[_i];
            if (trimmedPath.indexOf(pattern) !== -1) {
                return false;
            }
        }
        // 4. 기본적인 Windows 경로 형식 확인 (너무 엄격하지 않게)
        // 절대경로(C:\) 또는 상대경로(.\ or 폴더명) 허용
        if (!/^[A-Za-z]:\\/.test(trimmedPath) && // 절대경로 아니고
            !/^\.?[\\\/]/.test(trimmedPath) && // 상대경로도 아니고  
            !/^[^\\\/]+/.test(trimmedPath)) { // 단순 폴더명도 아니면
            return false;
        }
        // 5. 나머지는 모두 허용! (실용성 우선)
        return true;
    }
    // 경로 짧게 표시하는 헬퍼
    function getShortPath(path) {
        if (typeof path !== "string")
            return "Unknown path";
        var parts = path.split(/[\\/]/);
        if (parts.length > 2) {
            return ".../" + parts[parts.length - 2] + "/" + parts[parts.length - 1];
        }
        return path;
    }
    // 설정 관리
    function saveToStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            logDebug("Storage save: " + key);
            return true;
        }
        catch (e) {
            logError("Storage save failed: " + e.message);
            return false;
        }
    }
    function loadFromStorage(key) {
        try {
            var value = localStorage.getItem(key);
            logDebug("Storage load: " + key + (value ? " (found)" : " (not found)"));
            return value;
        }
        catch (e) {
            logError("Storage load failed: " + e.message);
            return null;
        }
    }
    function removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            logDebug("Storage remove: " + key);
            return true;
        }
        catch (e) {
            logError("Storage remove failed: " + e.message);
            return false;
        }
    }
    // JSON 안전한 파싱
    function safeJSONParse(jsonString) {
        try {
            return JSON.parse(jsonString);
        }
        catch (e) {
            logWarn("JSON parse failed: " + e.message);
            return null;
        }
    }
    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode'
        };
    }
    // 공개 API
    return {
        CONFIG: CONFIG,
        LOG_LEVELS: LogLevel,
        log: log,
        logError: logError,
        logWarn: logWarn,
        logInfo: logInfo,
        logDebug: logDebug,
        debugLog: debugLog, // 하위 호환성
        isValidPath: isValidPath,
        getShortPath: getShortPath,
        saveToStorage: saveToStorage,
        loadFromStorage: loadFromStorage,
        removeFromStorage: removeFromStorage,
        safeJSONParse: safeJSONParse,
        getDIStatus: getDIStatus // DI 상태 확인 (Phase 1.2)
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCUtils = JSCUtils;
}
//# sourceMappingURL=utils.js.map