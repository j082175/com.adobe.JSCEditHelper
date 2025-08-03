/**
 * JSCEditHelper - Utility Functions
 * 유틸리티 함수들을 모아놓은 모듈
 */

var JSCUtils = (function() {
    'use strict';
    
    // 설정 상수 (환경변수에서 읽어오거나 기본값 사용)
    var CONFIG = {
        DEBUG_MODE: (function() {
            try {
                return localStorage.getItem('JSC_DEBUG_MODE') === 'true' || false;
            } catch (e) {
                return false; // 프로덕션 기본값
            }
        })(),
        SOUND_FOLDER_KEY: "soundInserter_folder", // 기존 키와 호환성 유지
        APP_NAME: "JSCEditHelper",
        VERSION: "1.0.0"
    };
    
    // 로깅 레벨
    var LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };
    
    var currentLogLevel = CONFIG.DEBUG_MODE ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    
    // 로깅 함수
    function log(level, message) {
        if (level <= currentLogLevel && console) {
            var prefix = "[" + CONFIG.APP_NAME + "] ";
            switch (level) {
                case LOG_LEVELS.ERROR:
                    console.error(prefix + "ERROR: " + message);
                    break;
                case LOG_LEVELS.WARN:
                    console.warn(prefix + "WARN: " + message);
                    break;
                case LOG_LEVELS.INFO:
                    console.info(prefix + "INFO: " + message);
                    break;
                case LOG_LEVELS.DEBUG:
                    console.log(prefix + "DEBUG: " + message);
                    break;
            }
        }
    }
    
    // 편의 함수들
    function logError(message) { log(LOG_LEVELS.ERROR, message); }
    function logWarn(message) { log(LOG_LEVELS.WARN, message); }
    function logInfo(message) { log(LOG_LEVELS.INFO, message); }
    function logDebug(message) { log(LOG_LEVELS.DEBUG, message); }
    
    // 하위 호환성을 위한 별칭
    function debugLog(message) { logDebug(message); }
    
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

        for (var i = 0; i < errorPatterns.length; i++) {
            if (trimmedPath.indexOf(errorPatterns[i]) !== -1) {
                return false;
            }
        }

        // 4. 기본적인 Windows 경로 형식 확인 (너무 엄격하지 않게)
        // 절대경로(C:\) 또는 상대경로(.\ or 폴더명) 허용
        if (!/^[A-Za-z]:\\/.test(trimmedPath) && // 절대경로 아니고
            !/^\.?[\\\/]/.test(trimmedPath) &&   // 상대경로도 아니고  
            !/^[^\\\/]+/.test(trimmedPath)) {    // 단순 폴더명도 아니면
            return false;
        }

        // 5. 나머지는 모두 허용! (실용성 우선)
        return true;
    }
    
    // 경로 짧게 표시하는 헬퍼
    function getShortPath(path) {
        if (typeof path !== "string") return "Unknown path";
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
        } catch (e) {
            logError("Storage save failed: " + e.message);
            return false;
        }
    }
    
    function loadFromStorage(key) {
        try {
            var value = localStorage.getItem(key);
            logDebug("Storage load: " + key + (value ? " (found)" : " (not found)"));
            return value;
        } catch (e) {
            logError("Storage load failed: " + e.message);
            return null;
        }
    }
    
    function removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            logDebug("Storage remove: " + key);
            return true;
        } catch (e) {
            logError("Storage remove failed: " + e.message);
            return false;
        }
    }
    
    // JSON 안전한 파싱
    function safeJSONParse(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            logWarn("JSON parse failed: " + e.message);
            return null;
        }
    }
    
    // 공개 API
    return {
        CONFIG: CONFIG,
        LOG_LEVELS: LOG_LEVELS,
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
        safeJSONParse: safeJSONParse
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCUtils = JSCUtils;
}