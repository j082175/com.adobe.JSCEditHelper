/**
 * JSCEditHelper - Error Handler
 * 일관된 에러 처리 및 사용자 피드백을 담당하는 모듈
 */

var JSCErrorHandler = (function() {
    'use strict';
    
    // 에러 타입 정의
    var ERROR_TYPES = {
        VALIDATION: 'validation',
        COMMUNICATION: 'communication',
        FILE_SYSTEM: 'file_system',
        USER_INPUT: 'user_input',
        SYSTEM: 'system',
        NETWORK: 'network'
    };
    
    // 에러 심각도 정의
    var ERROR_SEVERITY = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };
    
    // 사용자 친화적 에러 메시지
    var ERROR_MESSAGES = {
        [ERROR_TYPES.VALIDATION]: {
            INVALID_PATH: "폴더 경로가 올바르지 않습니다. 다시 확인해주세요.",
            EMPTY_PATH: "폴더 경로를 선택해주세요.",
            NO_AUDIO_FILES: "선택된 폴더에 오디오 파일이 없습니다.",
            INVALID_INPUT: "입력값이 올바르지 않습니다."
        },
        [ERROR_TYPES.COMMUNICATION]: {
            JSX_ERROR: "Premiere Pro와의 통신 중 오류가 발생했습니다.",
            EVENT_ERROR: "이벤트 처리 중 오류가 발생했습니다.",
            TIMEOUT: "작업이 시간 초과되었습니다. 다시 시도해주세요."
        },
        [ERROR_TYPES.FILE_SYSTEM]: {
            ACCESS_DENIED: "파일에 접근할 수 없습니다. 권한을 확인해주세요.",
            FILE_NOT_FOUND: "파일을 찾을 수 없습니다.",
            READ_ERROR: "파일을 읽을 수 없습니다."
        },
        [ERROR_TYPES.USER_INPUT]: {
            INVALID_SELECTION: "올바른 선택을 해주세요.",
            MISSING_CLIPS: "클립을 선택해주세요.",
            INVALID_TRACK: "올바른 오디오 트랙을 선택해주세요."
        },
        [ERROR_TYPES.SYSTEM]: {
            MEMORY_ERROR: "메모리 부족으로 작업을 완료할 수 없습니다.",
            UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
            INITIALIZATION_ERROR: "초기화 중 오류가 발생했습니다."
        }
    };
    
    // 에러 객체 생성
    function createError(type, code, message, details) {
        var error = {
            type: type || ERROR_TYPES.SYSTEM,
            code: code || 'UNKNOWN_ERROR',
            message: message || ERROR_MESSAGES[ERROR_TYPES.SYSTEM].UNKNOWN_ERROR,
            details: details || null,
            timestamp: new Date().toISOString(),
            severity: getSeverityByType(type)
        };
        
        return error;
    }
    
    // 에러 타입에 따른 심각도 결정
    function getSeverityByType(type) {
        switch (type) {
            case ERROR_TYPES.VALIDATION:
            case ERROR_TYPES.USER_INPUT:
                return ERROR_SEVERITY.LOW;
            case ERROR_TYPES.FILE_SYSTEM:
            case ERROR_TYPES.COMMUNICATION:
                return ERROR_SEVERITY.MEDIUM;
            case ERROR_TYPES.SYSTEM:
                return ERROR_SEVERITY.HIGH;
            default:
                return ERROR_SEVERITY.MEDIUM;
        }
    }
    
    // 에러 처리 및 로깅
    function handleError(error, showToUser) {
        if (typeof error === 'string') {
            error = createError(ERROR_TYPES.SYSTEM, 'STRING_ERROR', error);
        }
        
        // 로깅
        switch (error.severity) {
            case ERROR_SEVERITY.CRITICAL:
            case ERROR_SEVERITY.HIGH:
                JSCUtils.logError(formatErrorForLog(error));
                break;
            case ERROR_SEVERITY.MEDIUM:
                JSCUtils.logWarn(formatErrorForLog(error));
                break;
            case ERROR_SEVERITY.LOW:
                JSCUtils.logInfo(formatErrorForLog(error));
                break;
        }
        
        // 사용자에게 표시
        if (showToUser !== false) {
            JSCUIManager.updateStatus(error.message, false);
            
            // 디버그 정보 저장 (개발 모드에서)
            if (JSCUtils.CONFIG.DEBUG_MODE && error.details) {
                window.lastDebugInfo = JSON.stringify(error, null, 2);
                JSCUIManager.toggleDebugButton(true);
            }
        }
        
        return error;
    }
    
    // 로그용 에러 포맷팅
    function formatErrorForLog(error) {
        return `[${error.type}:${error.code}] ${error.message}` + 
               (error.details ? ` - Details: ${JSON.stringify(error.details)}` : '');
    }
    
    // 검증 에러 처리
    function handleValidationError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ERROR_TYPES.VALIDATION][code];
        var error = createError(ERROR_TYPES.VALIDATION, code, message, details);
        return handleError(error);
    }
    
    // 통신 에러 처리
    function handleCommunicationError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ERROR_TYPES.COMMUNICATION][code];
        var error = createError(ERROR_TYPES.COMMUNICATION, code, message, details);
        return handleError(error);
    }
    
    // 파일 시스템 에러 처리
    function handleFileSystemError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ERROR_TYPES.FILE_SYSTEM][code];
        var error = createError(ERROR_TYPES.FILE_SYSTEM, code, message, details);
        return handleError(error);
    }
    
    // 사용자 입력 에러 처리
    function handleUserInputError(code, customMessage, details) {
        var message = customMessage || ERROR_MESSAGES[ERROR_TYPES.USER_INPUT][code];
        var error = createError(ERROR_TYPES.USER_INPUT, code, message, details);
        return handleError(error);
    }
    
    // Try-catch 래퍼
    function safeExecute(fn, errorMessage, errorType) {
        try {
            return fn();
        } catch (e) {
            var error = createError(
                errorType || ERROR_TYPES.SYSTEM,
                'EXECUTION_ERROR',
                errorMessage || '작업 실행 중 오류가 발생했습니다.',
                { originalError: e.message, stack: e.stack }
            );
            handleError(error);
            return null;
        }
    }
    
    // 비동기 작업 에러 처리
    function handleAsyncError(error, context) {
        var errorObj = createError(
            ERROR_TYPES.SYSTEM,
            'ASYNC_ERROR',
            '비동기 작업 중 오류가 발생했습니다.',
            { context: context, originalError: error.message }
        );
        return handleError(errorObj);
    }
    
    // 공개 API
    return {
        ERROR_TYPES: ERROR_TYPES,
        ERROR_SEVERITY: ERROR_SEVERITY,
        createError: createError,
        handleError: handleError,
        handleValidationError: handleValidationError,
        handleCommunicationError: handleCommunicationError,
        handleFileSystemError: handleFileSystemError,
        handleUserInputError: handleUserInputError,
        safeExecute: safeExecute,
        handleAsyncError: handleAsyncError
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCErrorHandler = JSCErrorHandler;
}