"use strict";
/**
 * JSCEditHelper - Error Handler
 * 일관된 에러 처리 및 사용자 피드백을 담당하는 모듈
 */
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "validation";
    ErrorType["COMMUNICATION"] = "communication";
    ErrorType["FILE_SYSTEM"] = "file_system";
    ErrorType["USER_INPUT"] = "user_input";
    ErrorType["SYSTEM"] = "system";
    ErrorType["NETWORK"] = "network";
})(ErrorType || (ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
var JSCErrorHandler = (function () {
    'use strict';
    var _a;
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var uiService = null;
    function initializeDIDependencies() {
        try {
            diContainer = window.DI;
            if (diContainer) {
                // DI에서 서비스 가져오기 시도
                utilsService = diContainer.getSafe('JSCUtils');
                uiService = diContainer.getSafe('JSCUIManager');
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
        setTimeout(function () {
            if (!utilsService || !uiService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils() {
        return utilsService || window.JSCUtils || {
            logError: function (msg) { console.error(msg); },
            logWarn: function (msg) { console.warn(msg); },
            logInfo: function (msg) { console.log(msg); },
            CONFIG: { DEBUG_MODE: false }
        };
    }
    function getUIManager() {
        return uiService || window.JSCUIManager || {
            updateStatus: function (msg, _success) { console.log('Status:', msg); },
            toggleDebugButton: function (show) { console.log('Debug button:', show); }
        };
    }
    // 사용자 친화적 에러 메시지
    var ERROR_MESSAGES = (_a = {},
        _a[ErrorType.VALIDATION] = {
            INVALID_PATH: "폴더 경로가 올바르지 않습니다. 다시 확인해주세요.",
            EMPTY_PATH: "폴더 경로를 선택해주세요.",
            NO_AUDIO_FILES: "선택된 폴더에 오디오 파일이 없습니다.",
            INVALID_INPUT: "입력값이 올바르지 않습니다."
        },
        _a[ErrorType.COMMUNICATION] = {
            JSX_ERROR: "Premiere Pro와의 통신 중 오류가 발생했습니다.",
            EVENT_ERROR: "이벤트 처리 중 오류가 발생했습니다.",
            TIMEOUT: "작업이 시간 초과되었습니다. 다시 시도해주세요."
        },
        _a[ErrorType.FILE_SYSTEM] = {
            ACCESS_DENIED: "파일에 접근할 수 없습니다. 권한을 확인해주세요.",
            FILE_NOT_FOUND: "파일을 찾을 수 없습니다.",
            READ_ERROR: "파일을 읽을 수 없습니다."
        },
        _a[ErrorType.USER_INPUT] = {
            INVALID_SELECTION: "올바른 선택을 해주세요.",
            MISSING_CLIPS: "클립을 선택해주세요.",
            INVALID_TRACK: "올바른 오디오 트랙을 선택해주세요."
        },
        _a[ErrorType.SYSTEM] = {
            MEMORY_ERROR: "메모리 부족으로 작업을 완료할 수 없습니다.",
            UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
            INITIALIZATION_ERROR: "초기화 중 오류가 발생했습니다."
        },
        _a);
    // 에러 객체 생성
    function createError(type, code, message, details) {
        var error = {
            type: type || ErrorType.SYSTEM,
            code: code || 'UNKNOWN_ERROR',
            message: message || ERROR_MESSAGES[ErrorType.SYSTEM].UNKNOWN_ERROR,
            details: details || null,
            timestamp: new Date().toISOString(),
            severity: getSeverityByType(type)
        };
        return error;
    }
    // 에러 타입에 따른 심각도 결정
    function getSeverityByType(type) {
        switch (type) {
            case ErrorType.VALIDATION:
            case ErrorType.USER_INPUT:
                return ErrorSeverity.LOW;
            case ErrorType.FILE_SYSTEM:
            case ErrorType.COMMUNICATION:
                return ErrorSeverity.MEDIUM;
            case ErrorType.SYSTEM:
                return ErrorSeverity.HIGH;
            default:
                return ErrorSeverity.MEDIUM;
        }
    }
    // 에러 처리 및 로깅
    function handleError(error, showToUser) {
        if (showToUser === void 0) { showToUser = true; }
        var errorObj;
        if (typeof error === 'string') {
            errorObj = createError(ErrorType.SYSTEM, 'STRING_ERROR', error);
        }
        else {
            errorObj = error;
        }
        var utils = getUtils();
        var uiManager = getUIManager();
        // 로깅
        switch (errorObj.severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                utils.logError(formatErrorForLog(errorObj));
                break;
            case ErrorSeverity.MEDIUM:
                utils.logWarn(formatErrorForLog(errorObj));
                break;
            case ErrorSeverity.LOW:
                utils.logInfo(formatErrorForLog(errorObj));
                break;
        }
        // 사용자에게 표시
        if (showToUser !== false) {
            uiManager.updateStatus(errorObj.message, false);
            // 디버그 정보 저장 (개발 모드에서)
            if (utils.CONFIG.DEBUG_MODE && errorObj.details) {
                window.lastDebugInfo = JSON.stringify(errorObj, null, 2);
                uiManager.toggleDebugButton(true);
            }
        }
        return errorObj;
    }
    // 로그용 에러 포맷팅
    function formatErrorForLog(error) {
        return "[".concat(error.type, ":").concat(error.code, "] ").concat(error.message) +
            (error.details ? " - Details: ".concat(JSON.stringify(error.details)) : '');
    }
    // 검증 에러 처리
    function handleValidationError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ErrorType.VALIDATION][code];
        var error = createError(ErrorType.VALIDATION, code, message, details);
        return handleError(error);
    }
    // 통신 에러 처리
    function handleCommunicationError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ErrorType.COMMUNICATION][code];
        var error = createError(ErrorType.COMMUNICATION, code, message, details);
        return handleError(error);
    }
    // 파일 시스템 에러 처리
    function handleFileSystemError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ErrorType.FILE_SYSTEM][code];
        var error = createError(ErrorType.FILE_SYSTEM, code, message, details);
        return handleError(error);
    }
    // 사용자 입력 에러 처리
    function handleUserInputError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ErrorType.USER_INPUT][code];
        var error = createError(ErrorType.USER_INPUT, code, message, details);
        return handleError(error);
    }
    // Try-catch 래퍼
    function safeExecute(fn, errorMessage, errorType) {
        try {
            return fn();
        }
        catch (e) {
            var error = createError(errorType || ErrorType.SYSTEM, 'EXECUTION_ERROR', errorMessage || '작업 실행 중 오류가 발생했습니다.', { originalError: e.message, stack: e.stack });
            handleError(error);
            return null;
        }
    }
    // 비동기 작업 에러 처리
    function handleAsyncError(error, context) {
        var errorObj = createError(ErrorType.SYSTEM, 'ASYNC_ERROR', '비동기 작업 중 오류가 발생했습니다.', { context: context, originalError: error.message });
        return handleError(errorObj);
    }
    // DI 상태 확인 함수 (디버깅용) - Phase 2.5
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
    // 공개 API
    return {
        ERROR_TYPES: ErrorType,
        ERROR_SEVERITY: ErrorSeverity,
        createError: createError,
        handleError: handleError,
        handleValidationError: handleValidationError,
        handleCommunicationError: handleCommunicationError,
        handleFileSystemError: handleFileSystemError,
        handleUserInputError: handleUserInputError,
        safeExecute: safeExecute,
        handleAsyncError: handleAsyncError,
        getDIStatus: getDIStatus // Phase 2.5
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCErrorHandler = JSCErrorHandler;
}
//# sourceMappingURL=error-handler.js.map