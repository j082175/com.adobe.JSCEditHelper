"use strict";
/**
 * JSCEditHelper - Communication Module
 * CEP와 ExtendScript 간의 통신을 담당하는 모듈
 */
/// <reference path="../types/cep.d.ts" />
var JSCCommunication = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var uiService = null;
    var errorService = null;
    var stateService = null;
    try {
        diContainer = window.DI;
        if (diContainer) {
            // DI에서 서비스 가져오기 시도
            utilsService = diContainer.getSafe('JSCUtils');
            uiService = diContainer.getSafe('JSCUIManager');
            errorService = diContainer.getSafe('JSCErrorHandler');
            stateService = diContainer.getSafe('JSCStateManager');
        }
    }
    catch (e) {
        // DI 사용 불가시 레거시 모드로 작동
    }
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils() {
        var fallback = {
            debugLog: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[Communication]', msg);
            },
            logDebug: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[Communication]', msg);
            },
            logInfo: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.info('[Communication]', msg);
            },
            logWarn: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.warn('[Communication]', msg);
            },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error('[Communication]', msg);
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
            updateStatus: function (msg, success) { return console.log("Status: ".concat(msg, " (").concat(success, ")")); },
            toggleDebugButton: function (_show) { },
            displaySoundList: function (list) { return console.log('Sound list:', list); },
            updateMagnetStatus: function (success, _moved, _removed) { return console.log("Magnet: ".concat(success)); },
            updateFolderPath: function (_path) { },
            updateSoundButtons: function (_files, _path) { }
        };
    }
    function getErrorHandler() {
        return errorService || window.JSCErrorHandler || {
            handleCommunicationError: function (type, msg, data) { return console.error("[".concat(type, "] ").concat(msg), data); },
            handleError: function (error) { return console.error('Error:', error); },
            createError: function (type, code, msg, data) { return ({ type: type, code: code, msg: msg, data: data }); },
            ERROR_TYPES: { COMMUNICATION: 'COMMUNICATION' }
        };
    }
    function getStateManager() {
        return stateService || window.JSCStateManager || {
            setCurrentFolderPath: function (_path) { /* no-op */ return true; }
        };
    }
    var csInterface = null;
    // CSInterface 초기화
    function initialize() {
        var utils = getUtils();
        try {
            if (typeof CSInterface === 'undefined') {
                throw new Error('CSInterface not available - CEP environment required');
            }
            csInterface = new CSInterface();
            setupEventListeners();
            utils.logDebug('Communication module initialized successfully');
            return csInterface;
        }
        catch (e) {
            utils.logError('Communication module initialization failed:', e.message);
            return null;
        }
    }
    // 이벤트 리스너 설정
    function setupEventListeners() {
        if (!csInterface)
            return;
        // SoundEvent 리스너
        csInterface.addEventListener("com.adobe.soundInserter.events.SoundEvent", handleSoundEvent);
        // FileListEvent 리스너  
        csInterface.addEventListener("com.adobe.soundInserter.events.FileListEvent", handleFileListEvent);
    }
    // SoundEvent 처리
    function handleSoundEvent(event) {
        var utils = getUtils();
        var uiManager = getUIManager();
        var errorHandler = getErrorHandler();
        try {
            var data = event.data;
            utils.logDebug("Received event data type: " + typeof data);
            // Handle non-string data
            if (typeof data !== "string") {
                utils.logWarn("Received non-string data, attempting conversion");
                try {
                    data = JSON.stringify(data);
                    utils.logDebug("Converted non-string data to JSON");
                }
                catch (e) {
                    errorHandler.handleCommunicationError('JSX_ERROR', "데이터 처리 오류: 서버에서 잘못된 형식의 데이터를 받았습니다.", { originalError: e.message });
                    return;
                }
            }
            // [object Object] 오류 검사
            if (data === "[object Object]") {
                errorHandler.handleCommunicationError('JSX_ERROR', "데이터 처리 오류: 서버 응답 형식에 문제가 있습니다.", { receivedData: data });
                return;
            }
            // Try parsing JSON
            var resultData = utils.safeJSONParse(data);
            if (!resultData) {
                utils.logWarn("Failed to parse data as JSON, treating as string");
                uiManager.updateStatus(data, false);
                return;
            }
            // Save debug info
            if (resultData.debug) {
                window.lastDebugInfo = resultData.debug;
                uiManager.toggleDebugButton(true);
            }
            if (resultData.soundList && Array.isArray(resultData.soundList)) {
                uiManager.displaySoundList(resultData.soundList);
            }
            if (resultData.message) {
                uiManager.updateStatus(resultData.message, resultData.success);
            }
            // 마그넷 기능 결과 처리
            if (resultData.clipsMoved !== undefined || resultData.gapsRemoved !== undefined) {
                uiManager.updateMagnetStatus(resultData.success || false, resultData.clipsMoved, resultData.gapsRemoved);
            }
        }
        catch (e) {
            errorHandler.handleError(errorHandler.createError(errorHandler.ERROR_TYPES.COMMUNICATION, 'EVENT_ERROR', "처리 중 오류가 발생했습니다. 다시 시도해주세요.", { originalError: e.message, stack: e.stack }));
        }
    }
    // FileListEvent 처리
    function handleFileListEvent(event) {
        var utils = getUtils();
        var uiManager = getUIManager();
        var stateManager = getStateManager();
        utils.debugLog("handleFileListEvent received event. Type: " + event.type);
        try {
            var eventDataString = event.data;
            utils.debugLog("handleFileListEvent: eventDataString (type: " + typeof eventDataString + "): " + eventDataString);
            var parsedData = void 0;
            if (typeof eventDataString === "string") {
                if (eventDataString.trim() === "") {
                    utils.logError("handleFileListEvent: Received empty string data.");
                    uiManager.updateStatus("폴더에서 데이터를 가져오는 데 실패했습니다.", false);
                    return;
                }
                var parsed = utils.safeJSONParse(eventDataString);
                if (!parsed) {
                    utils.logError("handleFileListEvent: JSON parsing error for data: " + eventDataString);
                    uiManager.updateStatus("폴더 데이터 처리 중 오류가 발생했습니다.", false);
                    return;
                }
                parsedData = parsed;
            }
            else if (typeof eventDataString === "object" && eventDataString !== null) {
                parsedData = eventDataString;
                utils.debugLog("handleFileListEvent: Received data as object (no parsing needed)");
            }
            else {
                utils.logError("handleFileListEvent: Unknown data type received: " + typeof eventDataString);
                uiManager.updateStatus("예상치 못한 데이터 형식을 받았습니다.", false);
                return;
            }
            if (!parsedData || !parsedData.soundFiles) {
                utils.logError("handleFileListEvent: Invalid data structure (soundFiles missing). Parsed data:", parsedData);
                uiManager.updateStatus("폴더 데이터를 올바르게 읽을 수 없습니다.", false);
                return;
            }
            var soundFiles = parsedData.soundFiles;
            var folderPathFromEvent = parsedData.folderPath;
            utils.debugLog("handleFileListEvent: soundFiles count: " + soundFiles.length + " folderPathFromEvent: " + folderPathFromEvent);
            // 폴더 경로 업데이트
            if (folderPathFromEvent && utils.isValidPath(folderPathFromEvent)) {
                if (stateManager && stateManager.setCurrentFolderPath) {
                    stateManager.setCurrentFolderPath(folderPathFromEvent);
                }
                utils.saveToStorage(utils.CONFIG.SOUND_FOLDER_KEY, folderPathFromEvent);
                uiManager.updateFolderPath(folderPathFromEvent);
            }
            // 사운드 버튼 업데이트
            uiManager.updateSoundButtons(soundFiles, folderPathFromEvent);
        }
        catch (e) {
            utils.logError("handleFileListEvent: CRITICAL ERROR during event processing:", e);
            uiManager.updateStatus("폴더 정보를 처리하는 중 오류가 발생했습니다.", false);
        }
    }
    // ExtendScript 함수 호출
    function callExtendScript(scriptCode, callback) {
        var utils = getUtils();
        if (!csInterface) {
            utils.logError("CSInterface not initialized");
            return;
        }
        utils.debugLog("Executing JSX code: " + scriptCode);
        csInterface.evalScript(scriptCode, callback || function (result) {
            utils.debugLog("JSX result: " + result);
        });
    }
    // Promise 기반 ExtendScript 호출 (callback hell 제거용)
    function callExtendScriptAsync(scriptCode) {
        return new Promise(function (resolve, reject) {
            var utils = getUtils();
            if (!csInterface) {
                var error = "CSInterface not initialized";
                utils.logError(error);
                reject(new Error(error));
                return;
            }
            utils.debugLog("Executing JSX code (async): " + scriptCode);
            csInterface.evalScript(scriptCode, function (result) {
                utils.debugLog("JSX result (async): " + result);
                // 에러 체크
                if (typeof result === 'string' && result.indexOf('error:') === 0) {
                    reject(new Error(result.substring(6)));
                }
                else if (typeof result === 'string' && result.indexOf('ERROR:') === 0) {
                    reject(new Error(result.substring(6)));
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    // DI 상태 확인 함수 (디버깅용) - Phase 2.3
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
        if (errorService)
            dependencies.push('JSCErrorHandler (DI)');
        else if (window.JSCErrorHandler)
            dependencies.push('JSCErrorHandler (Legacy)');
        if (stateService)
            dependencies.push('JSCStateManager (DI)');
        else if (window.JSCStateManager)
            dependencies.push('JSCStateManager (Legacy)');
        return {
            isDIAvailable: !!diContainer,
            dependencies: dependencies
        };
    }
    // 공개 API
    return {
        initialize: initialize,
        callExtendScript: callExtendScript,
        callExtendScriptAsync: callExtendScriptAsync, // Promise 기반 (callback hell 제거용)
        getCSInterface: function () { return csInterface; },
        getDIStatus: getDIStatus // Phase 2.3
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCCommunication = JSCCommunication;
}
//# sourceMappingURL=communication.js.map