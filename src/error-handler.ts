/**
 * JSCEditHelper - Error Handler
 * 일관된 에러 처리 및 사용자 피드백을 담당하는 모듈
 */

enum ErrorType {
    VALIDATION = 'validation',
    COMMUNICATION = 'communication',
    FILE_SYSTEM = 'file_system',
    USER_INPUT = 'user_input',
    SYSTEM = 'system',
    NETWORK = 'network'
}

enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

interface ErrorDetails {
    [key: string]: any;
}

interface JSCError {
    type: ErrorType;
    code: string;
    message: string;
    details: ErrorDetails | null;
    timestamp: string;
    severity: ErrorSeverity;
}

interface ErrorMessages {
    [ErrorType.VALIDATION]: {
        INVALID_PATH: string;
        EMPTY_PATH: string;
        NO_AUDIO_FILES: string;
        INVALID_INPUT: string;
    };
    [ErrorType.COMMUNICATION]: {
        JSX_ERROR: string;
        EVENT_ERROR: string;
        TIMEOUT: string;
    };
    [ErrorType.FILE_SYSTEM]: {
        ACCESS_DENIED: string;
        FILE_NOT_FOUND: string;
        READ_ERROR: string;
    };
    [ErrorType.USER_INPUT]: {
        INVALID_SELECTION: string;
        MISSING_CLIPS: string;
        INVALID_TRACK: string;
    };
    [ErrorType.SYSTEM]: {
        MEMORY_ERROR: string;
        UNKNOWN_ERROR: string;
        INITIALIZATION_ERROR: string;
    };
}

interface JSCErrorHandlerInterface {
    readonly ERROR_TYPES: typeof ErrorType;
    readonly ERROR_SEVERITY: typeof ErrorSeverity;
    createError(type: ErrorType, code: string, message?: string, details?: ErrorDetails): JSCError;
    handleError(error: JSCError | string, showToUser?: boolean): JSCError;
    handleValidationError(code: string, customMessage?: string, details?: ErrorDetails): JSCError;
    handleCommunicationError(code: string, customMessage?: string, details?: ErrorDetails): JSCError;
    handleFileSystemError(code: string, customMessage?: string, details?: ErrorDetails): JSCError;
    handleUserInputError(code: string, customMessage?: string, details?: ErrorDetails): JSCError;
    safeExecute<T>(fn: () => T, errorMessage?: string, errorType?: ErrorType): T | null;
    handleAsyncError(error: Error, context?: string): JSCError;
    getDIStatus(): any; // Phase 2.5
}

const JSCErrorHandler = (function(): JSCErrorHandlerInterface {
    'use strict';

    // DIHelpers 사용 - 반복 코드 제거!
    const DIHelpers = (window as any).DIHelpers;

    // 서비스 가져오기 헬퍼 함수들
    function getUtils(): JSCUtilsInterface {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('ErrorHandler');
        }
        // Fallback
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[ErrorHandler]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[ErrorHandler]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[ErrorHandler]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[ErrorHandler]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[ErrorHandler]', msg),
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
        return (window.JSCUtils || fallback) as JSCUtilsInterface;
    }

    function getUIManager() {
        if (DIHelpers && DIHelpers.getUIManager) {
            return DIHelpers.getUIManager('ErrorHandler');
        }
        // Fallback
        return (window as any).JSCUIManager || {
            updateStatus: (msg: string, _success: boolean) => { console.log('Status:', msg); },
            toggleDebugButton: (show: boolean) => { console.log('Debug button:', show); }
        };
    }
    
    // 사용자 친화적 에러 메시지
    const ERROR_MESSAGES: ErrorMessages = {
        [ErrorType.VALIDATION]: {
            INVALID_PATH: "폴더 경로가 올바르지 않습니다. 다시 확인해주세요.",
            EMPTY_PATH: "폴더 경로를 선택해주세요.",
            NO_AUDIO_FILES: "선택된 폴더에 오디오 파일이 없습니다.",
            INVALID_INPUT: "입력값이 올바르지 않습니다."
        },
        [ErrorType.COMMUNICATION]: {
            JSX_ERROR: "Premiere Pro와의 통신 중 오류가 발생했습니다.",
            EVENT_ERROR: "이벤트 처리 중 오류가 발생했습니다.",
            TIMEOUT: "작업이 시간 초과되었습니다. 다시 시도해주세요."
        },
        [ErrorType.FILE_SYSTEM]: {
            ACCESS_DENIED: "파일에 접근할 수 없습니다. 권한을 확인해주세요.",
            FILE_NOT_FOUND: "파일을 찾을 수 없습니다.",
            READ_ERROR: "파일을 읽을 수 없습니다."
        },
        [ErrorType.USER_INPUT]: {
            INVALID_SELECTION: "올바른 선택을 해주세요.",
            MISSING_CLIPS: "클립을 선택해주세요.",
            INVALID_TRACK: "올바른 오디오 트랙을 선택해주세요."
        },
        [ErrorType.SYSTEM]: {
            MEMORY_ERROR: "메모리 부족으로 작업을 완료할 수 없습니다.",
            UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
            INITIALIZATION_ERROR: "초기화 중 오류가 발생했습니다."
        }
    };
    
    // 에러 객체 생성
    function createError(type: ErrorType, code: string, message?: string, details?: ErrorDetails): JSCError {
        const error: JSCError = {
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
    function getSeverityByType(type: ErrorType): ErrorSeverity {
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
    function handleError(error: JSCError | string, showToUser: boolean = true): JSCError {
        let errorObj: JSCError;
        
        if (typeof error === 'string') {
            errorObj = createError(ErrorType.SYSTEM, 'STRING_ERROR', error);
        } else {
            errorObj = error;
        }
        
        const utils = getUtils();
        const uiManager = getUIManager();
        
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
                (window as any).lastDebugInfo = JSON.stringify(errorObj, null, 2);
                uiManager.toggleDebugButton(true);
            }
        }
        
        return errorObj;
    }
    
    // 로그용 에러 포맷팅
    function formatErrorForLog(error: JSCError): string {
        return `[${error.type}:${error.code}] ${error.message}` + 
               (error.details ? ` - Details: ${JSON.stringify(error.details)}` : '');
    }
    
    // 검증 에러 처리
    function handleValidationError(code: string, customMessage?: string, details?: ErrorDetails): JSCError {
        const message = customMessage || (ERROR_MESSAGES[ErrorType.VALIDATION] as any)[code];
        const error = createError(ErrorType.VALIDATION, code, message, details);
        return handleError(error);
    }
    
    // 통신 에러 처리
    function handleCommunicationError(code: string, customMessage?: string, details?: ErrorDetails): JSCError {
        const message = customMessage || (ERROR_MESSAGES[ErrorType.COMMUNICATION] as any)[code];
        const error = createError(ErrorType.COMMUNICATION, code, message, details);
        return handleError(error);
    }
    
    // 파일 시스템 에러 처리
    function handleFileSystemError(code: string, customMessage?: string, details?: ErrorDetails): JSCError {
        const message = customMessage || (ERROR_MESSAGES[ErrorType.FILE_SYSTEM] as any)[code];
        const error = createError(ErrorType.FILE_SYSTEM, code, message, details);
        return handleError(error);
    }
    
    // 사용자 입력 에러 처리
    function handleUserInputError(code: string, customMessage?: string, details?: ErrorDetails): JSCError {
        const message = customMessage || (ERROR_MESSAGES[ErrorType.USER_INPUT] as any)[code];
        const error = createError(ErrorType.USER_INPUT, code, message, details);
        return handleError(error);
    }
    
    // Try-catch 래퍼
    function safeExecute<T>(fn: () => T, errorMessage?: string, errorType?: ErrorType): T | null {
        try {
            return fn();
        } catch (e) {
            const error = createError(
                errorType || ErrorType.SYSTEM,
                'EXECUTION_ERROR',
                errorMessage || '작업 실행 중 오류가 발생했습니다.',
                { originalError: (e as Error).message, stack: (e as Error).stack }
            );
            handleError(error);
            return null;
        }
    }
    
    // 비동기 작업 에러 처리
    function handleAsyncError(error: Error, context?: string): JSCError {
        const errorObj = createError(
            ErrorType.SYSTEM,
            'ASYNC_ERROR',
            '비동기 작업 중 오류가 발생했습니다.',
            { context: context, originalError: error.message }
        );
        return handleError(errorObj);
    }
    
    // DI 상태 확인 함수 (디버깅용) - Phase 2.5
    function getDIStatus() {
        const dependencies: string[] = [];

        if (DIHelpers) dependencies.push('DIHelpers (Available)');
        else dependencies.push('DIHelpers (Not loaded)');

        if ((window as any).JSCUtils)
            dependencies.push('JSCUtils (Available)');
        else
            dependencies.push('JSCUtils (Missing)');

        if ((window as any).JSCUIManager)
            dependencies.push('JSCUIManager (Available)');
        else
            dependencies.push('JSCUIManager (Missing)');

        return {
            isDIAvailable: !!DIHelpers,
            containerInfo: DIHelpers ? 'DIHelpers active' : 'Fallback mode',
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