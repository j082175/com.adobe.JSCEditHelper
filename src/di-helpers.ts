/**
 * DI Helpers - 공통 의존성 주입 패턴
 * 모든 모듈에서 반복되는 DI 패턴을 제거하기 위한 헬퍼 함수들
 */

/**
 * DI 컨테이너에서 서비스를 안전하게 가져오는 헬퍼
 * @param serviceName DI에 등록된 서비스 이름
 * @param legacyGlobal window 객체의 레거시 전역 변수 이름
 * @param fallback DI와 레거시 모두 없을 때 사용할 fallback 객체
 */
function getServiceSafely<T>(serviceName: string, legacyGlobal: string, fallback: T): T {
    try {
        const DI = (window as any).DI;
        if (DI) {
            const service = DI.getSafe(serviceName);
            if (service) return service as T;
        }
    } catch (e) {
        // DI 사용 불가, fallback으로 진행
    }

    // 레거시 전역 변수 확인
    const legacyService = (window as any)[legacyGlobal];
    if (legacyService) return legacyService as T;

    // Fallback 반환
    return fallback;
}

/**
 * JSCUtils 서비스 가져오기
 * @param moduleName 로깅에 사용할 모듈 이름
 */
function getUtilsHelper(moduleName: string = 'Module'): JSCUtilsInterface {
    const fallback: JSCUtilsInterface = {
        debugLog: (msg: string, ..._args: any[]) => console.log(`[${moduleName}]`, msg),
        logDebug: (msg: string, ..._args: any[]) => console.log(`[${moduleName}]`, msg),
        logInfo: (msg: string, ..._args: any[]) => console.info(`[${moduleName}]`, msg),
        logWarn: (msg: string, ..._args: any[]) => console.warn(`[${moduleName}]`, msg),
        logError: (msg: string, ..._args: any[]) => console.error(`[${moduleName}]`, msg),
        isValidPath: (path: string) => !!path,
        getShortPath: (path: string) => path,
        safeJSONParse: (str: string) => {
            try { return JSON.parse(str); }
            catch(e) { return null; }
        },
        saveToStorage: (key: string, value: string) => {
            localStorage.setItem(key, value);
            return true;
        },
        loadFromStorage: (key: string) => localStorage.getItem(key),
        removeFromStorage: (key: string) => {
            localStorage.removeItem(key);
            return true;
        },
        CONFIG: {
            DEBUG_MODE: false,
            SOUND_FOLDER_KEY: 'soundInserter_folder',
            APP_NAME: 'JSCEditHelper',
            VERSION: '1.0.0'
        },
        LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 } as any,
        log: (_level: any, _message: string) => {},
        getDIStatus: () => ({ isDIAvailable: false, containerInfo: 'Fallback mode' })
    };

    return getServiceSafely<JSCUtilsInterface>('JSCUtils', 'JSCUtils', fallback);
}

/**
 * JSCUIManager 서비스 가져오기
 */
function getUIManagerHelper(moduleName: string = 'Module'): any {
    const fallback = {
        updateStatus: (msg: string, _success?: boolean) => console.log(`[${moduleName} Status]`, msg),
        displayMessage: (msg: string) => console.log(`[${moduleName} Message]`, msg),
        toggleDebugButton: (_show: boolean) => {},
        displaySoundList: (_list: any[]) => {},
        updateMagnetStatus: (_success: boolean, _moved?: number, _removed?: number) => {},
        updateFolderPath: (_path: string) => {},
        updateSoundButtons: (_files: any[], _path: string) => {},
        resetDebugUI: () => {},
        showDebugInfo: () => {}
    };

    return getServiceSafely('JSCUIManager', 'JSCUIManager', fallback);
}

/**
 * JSCStateManager 서비스 가져오기
 */
function getStateManagerHelper(): any {
    const fallback = {
        saveFolderPath: (_path: string) => {},
        getCurrentFolderPath: () => '',
        clearFolderPath: () => {},
        validateState: () => ({ isValid: true, errors: [] }),
        getSettings: () => ({ folderPath: '', audioTrack: 1 }),
        setSettings: (_settings: any) => {}
    };

    return getServiceSafely('JSCStateManager', 'JSCStateManager', fallback);
}

/**
 * JSCCommunication 서비스 가져오기
 */
function getCommunicationHelper(): any {
    const fallback = {
        callExtendScript: (_script: string, _callback?: (result: string) => void) => {},
        callExtendScriptAsync: (_script: string) => Promise.reject(new Error('Communication not available')),
        getCSInterface: () => null,
        initialize: () => null
    };

    return getServiceSafely('JSCCommunication', 'JSCCommunication', fallback);
}

/**
 * JSCErrorHandler 서비스 가져오기
 */
function getErrorHandlerHelper(): any {
    const fallback = {
        handleError: (error: any) => console.error('Error:', error),
        logError: (msg: string, ..._args: any[]) => console.error(`[Error] ${msg}`),
        createError: (_type: any, _code: string, message?: string) => ({ message }),
        safeExecute: <T>(fn: () => T) => {
            try { return fn(); }
            catch(e) { console.error('Execution error:', e); return null; }
        }
    };

    return getServiceSafely('JSCErrorHandler', 'JSCErrorHandler', fallback);
}

// 전역 노출 (window 객체에서 접근 가능하도록)
if (typeof window !== 'undefined') {
    (window as any).DIHelpers = {
        getUtils: getUtilsHelper,
        getUIManager: getUIManagerHelper,
        getStateManager: getStateManagerHelper,
        getCommunication: getCommunicationHelper,
        getErrorHandler: getErrorHandlerHelper
    };
}
