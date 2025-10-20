"use strict";
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
function getServiceSafely(serviceName, legacyGlobal, fallback) {
    try {
        var DI = window.DI;
        if (DI) {
            var service = DI.getSafe(serviceName);
            if (service)
                return service;
        }
    }
    catch (e) {
        // DI 사용 불가, fallback으로 진행
    }
    // 레거시 전역 변수 확인
    var legacyService = window[legacyGlobal];
    if (legacyService)
        return legacyService;
    // Fallback 반환
    return fallback;
}
/**
 * JSCUtils 서비스 가져오기
 * @param moduleName 로깅에 사용할 모듈 이름
 */
function getUtilsHelper(moduleName) {
    if (moduleName === void 0) { moduleName = 'Module'; }
    var fallback = {
        debugLog: function (msg) {
            var _args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _args[_i - 1] = arguments[_i];
            }
            return console.log("[".concat(moduleName, "]"), msg);
        },
        logDebug: function (msg) {
            var _args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _args[_i - 1] = arguments[_i];
            }
            return console.log("[".concat(moduleName, "]"), msg);
        },
        logInfo: function (msg) {
            var _args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _args[_i - 1] = arguments[_i];
            }
            return console.info("[".concat(moduleName, "]"), msg);
        },
        logWarn: function (msg) {
            var _args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _args[_i - 1] = arguments[_i];
            }
            return console.warn("[".concat(moduleName, "]"), msg);
        },
        logError: function (msg) {
            var _args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _args[_i - 1] = arguments[_i];
            }
            return console.error("[".concat(moduleName, "]"), msg);
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
        saveToStorage: function (key, value) {
            localStorage.setItem(key, value);
            return true;
        },
        loadFromStorage: function (key) { return localStorage.getItem(key); },
        removeFromStorage: function (key) {
            localStorage.removeItem(key);
            return true;
        },
        CONFIG: {
            DEBUG_MODE: false,
            SOUND_FOLDER_KEY: 'soundInserter_folder',
            APP_NAME: 'JSCEditHelper',
            VERSION: '1.0.0'
        },
        LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
        log: function (_level, _message) { },
        getDIStatus: function () { return ({ isDIAvailable: false, containerInfo: 'Fallback mode' }); }
    };
    return getServiceSafely('JSCUtils', 'JSCUtils', fallback);
}
/**
 * JSCUIManager 서비스 가져오기
 */
function getUIManagerHelper(moduleName) {
    if (moduleName === void 0) { moduleName = 'Module'; }
    var fallback = {
        updateStatus: function (msg, _success) { return console.log("[".concat(moduleName, " Status]"), msg); },
        displayMessage: function (msg) { return console.log("[".concat(moduleName, " Message]"), msg); },
        toggleDebugButton: function (_show) { },
        displaySoundList: function (_list) { },
        updateMagnetStatus: function (_success, _moved, _removed) { },
        updateFolderPath: function (_path) { },
        updateSoundButtons: function (_files, _path) { },
        resetDebugUI: function () { },
        showDebugInfo: function () { }
    };
    return getServiceSafely('JSCUIManager', 'JSCUIManager', fallback);
}
/**
 * JSCStateManager 서비스 가져오기
 */
function getStateManagerHelper() {
    var fallback = {
        saveFolderPath: function (_path) { },
        getCurrentFolderPath: function () { return ''; },
        clearFolderPath: function () { },
        validateState: function () { return ({ isValid: true, errors: [] }); },
        getSettings: function () { return ({ folderPath: '', audioTrack: 1 }); },
        setSettings: function (_settings) { }
    };
    return getServiceSafely('JSCStateManager', 'JSCStateManager', fallback);
}
/**
 * JSCCommunication 서비스 가져오기
 */
function getCommunicationHelper() {
    var fallback = {
        callExtendScript: function (_script, _callback) { },
        callExtendScriptAsync: function (_script) { return Promise.reject(new Error('Communication not available')); },
        getCSInterface: function () { return null; },
        initialize: function () { return null; }
    };
    return getServiceSafely('JSCCommunication', 'JSCCommunication', fallback);
}
/**
 * JSCErrorHandler 서비스 가져오기
 */
function getErrorHandlerHelper() {
    var fallback = {
        handleError: function (error) { return console.error('Error:', error); },
        logError: function (msg) {
            var _args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _args[_i - 1] = arguments[_i];
            }
            return console.error("[Error] ".concat(msg));
        },
        createError: function (_type, _code, message) { return ({ message: message }); },
        safeExecute: function (fn) {
            try {
                return fn();
            }
            catch (e) {
                console.error('Execution error:', e);
                return null;
            }
        }
    };
    return getServiceSafely('JSCErrorHandler', 'JSCErrorHandler', fallback);
}
// 전역 노출 (window 객체에서 접근 가능하도록)
if (typeof window !== 'undefined') {
    window.DIHelpers = {
        getUtils: getUtilsHelper,
        getUIManager: getUIManagerHelper,
        getStateManager: getStateManagerHelper,
        getCommunication: getCommunicationHelper,
        getErrorHandler: getErrorHandlerHelper
    };
}
//# sourceMappingURL=di-helpers.js.map