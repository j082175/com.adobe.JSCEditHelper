"use strict";
/**
 * JSCEditHelper - Event Manager
 * 사용자 이벤트 처리를 담당하는 모듈
 */
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
var JSCEventManager = (function () {
    'use strict';
    // DIHelpers 사용 - 반복 코드 제거!
    // di-helpers.ts에서 제공하는 공통 헬퍼 사용
    var DIHelpers = window.DIHelpers;
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    // DIHelpers가 로드되어 있으면 사용, 아니면 직접 fallback 사용
    function getUtils() {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('EventManager');
        }
        // Fallback (DIHelpers 로드 안됨)
        var fallback = {
            debugLog: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[EventManager]', msg);
            },
            logDebug: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[EventManager]', msg);
            },
            logInfo: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.info('[EventManager]', msg);
            },
            logWarn: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.warn('[EventManager]', msg);
            },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error('[EventManager]', msg);
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
        return (window.JSCUtils || fallback);
    }
    function getUIManager() {
        if (DIHelpers && DIHelpers.getUIManager) {
            return DIHelpers.getUIManager('EventManager');
        }
        // Fallback
        var utils = getUtils();
        return window.JSCUIManager || {
            updateStatus: function (msg, _success) { console.log('Status:', msg); },
            displaySoundList: function (_files) { console.log('Display sound list'); },
            resetDebugUI: function () { console.log('Reset debug UI'); },
            updateSoundButtons: function (_files, _path) { console.log('Update sound buttons'); },
            showDebugInfo: function () { console.log('Show debug info'); },
            toggleDebugButton: function (_show) { console.log('Toggle debug button'); },
            updateMagnetStatus: function (_success, _moved, _removed) {
                utils.logDebug('Update magnet status');
            }
        };
    }
    function getStateManager() {
        if (DIHelpers && DIHelpers.getStateManager) {
            return DIHelpers.getStateManager();
        }
        // Fallback
        return window.JSCStateManager || {
            saveFolderPath: function (_path) { console.log('Save folder path'); },
            getCurrentFolderPath: function () { return ''; },
            clearFolderPath: function () { console.log('Clear folder path'); },
            validateState: function () { return { isValid: true, errors: [] }; },
            getSettings: function () { return { folderPath: '', audioTrack: 1 }; }
        };
    }
    function getCommunication() {
        if (DIHelpers && DIHelpers.getCommunication) {
            return DIHelpers.getCommunication();
        }
        // Fallback
        return window.JSCCommunication || {
            callExtendScript: function (_script, callback) {
                callback('error: Communication service not available');
            },
            callExtendScriptAsync: function (_script) {
                return Promise.reject(new Error('Communication service not available'));
            }
        };
    }
    function getSoundEngine() {
        // No DI helper for SoundEngine yet, use direct window access
        return window.SoundEngine || {
            executeSoundInsertion: function (_config) {
                return Promise.resolve({ success: false, message: 'SoundEngine not available' });
            },
            executeMagnetClips: function () {
                return Promise.resolve({ success: false, message: 'SoundEngine not available' });
            },
            getEngineStatus: function () { return { isReady: false, dependencies: [] }; }
        };
    }
    // 이벤트 리스너 설정
    function setupEventListeners() {
        var utils = getUtils();
        try {
            utils.logDebug('Setting up event listeners...');
            setupInsertSoundsButton();
            setupBrowseFolderButton();
            setupRefreshButton();
            setupMagnetButton();
            setupFolderInput();
            setupDebugUI();
            setupCaptionEventListeners(); // 캡션-이미지 동기화 이벤트
            utils.logDebug('Event listeners setup completed');
        }
        catch (e) {
            utils.logError('Event listeners setup failed:', e.message);
        }
    }
    // 효과음 삽입 버튼 이벤트
    function setupInsertSoundsButton() {
        var utils = getUtils();
        var insertButton = document.getElementById("insert-sounds");
        if (insertButton) {
            insertButton.addEventListener("click", insertSounds);
            utils.logDebug("Event listener added to insert-sounds button");
        }
        else {
            utils.logWarn("Button with ID 'insert-sounds' not found.");
        }
    }
    // 폴더 찾기 버튼 이벤트
    function setupBrowseFolderButton() {
        var utils = getUtils();
        var browseButton = document.getElementById("browseFolder");
        if (browseButton) {
            browseButton.addEventListener("click", browseSoundFolder);
            utils.debugLog("Event listener added to browseFolder button");
        }
        else {
            utils.logError("Button with ID 'browseFolder' not found.");
        }
    }
    // 새로고침 버튼 이벤트
    function setupRefreshButton() {
        var utils = getUtils();
        var refreshButton = document.getElementById("refreshSounds");
        if (refreshButton) {
            refreshButton.addEventListener("click", refreshSoundButtons);
            utils.debugLog("Event listener added to refreshSounds button");
        }
        else {
            utils.logError("Button with ID 'refreshSounds' not found.");
        }
    }
    // 마그넷 버튼 이벤트
    function setupMagnetButton() {
        var utils = getUtils();
        var magnetButton = document.getElementById("magnetClips");
        if (magnetButton) {
            magnetButton.addEventListener("click", magnetClips);
            utils.debugLog("Event listener added to magnetClips button");
        }
        else {
            utils.logError("Button with ID 'magnetClips' not found.");
        }
    }
    // 폴더 입력 필드 이벤트
    function setupFolderInput() {
        var utils = getUtils();
        var folderInput = document.getElementById("sound-folder");
        if (folderInput) {
            folderInput.addEventListener("change", function () {
                var inputPath = this.value.trim();
                var utils = getUtils();
                var stateManager = getStateManager();
                utils.debugLog("Folder input changed: " + inputPath);
                if (inputPath && utils.isValidPath(inputPath)) {
                    stateManager.saveFolderPath(inputPath);
                    utils.logDebug("Valid path stored: " + inputPath);
                }
                else {
                    if (inputPath) {
                        utils.logWarn("Invalid path entered: " + inputPath);
                        var uiManager = getUIManager();
                        uiManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        this.value = stateManager.getCurrentFolderPath(); // 이전 유효한 경로로 복원
                    }
                    else {
                        stateManager.clearFolderPath();
                        utils.logDebug("Path cleared");
                    }
                }
            });
            utils.debugLog("Event listener added to sound-folder input");
        }
        else {
            utils.logError("Input with ID 'sound-folder' not found.");
        }
    }
    // 디버그 UI 이벤트
    function setupDebugUI() {
        setupDebugButton();
        setupCloseDebugButton();
        setupTestSoundEngineButton();
    }
    function setupDebugButton() {
        var debugButton = document.getElementById("debug-button");
        if (debugButton) {
            debugButton.addEventListener("click", function () {
                var uiManager = getUIManager();
                uiManager.showDebugInfo();
            });
        }
    }
    function setupCloseDebugButton() {
        var closeDebugButton = document.getElementById("close-debug-button");
        if (closeDebugButton) {
            closeDebugButton.addEventListener("click", function () {
                var debugInfo = document.getElementById("debug-info");
                if (debugInfo)
                    debugInfo.style.display = "none";
                this.style.display = "none";
            });
        }
    }
    function setupTestSoundEngineButton() {
        var testButton = document.getElementById("test-sound-engine");
        if (testButton) {
            testButton.addEventListener("click", testSoundEngine);
        }
    }
    // SoundEngine 테스트 함수
    function testSoundEngine() {
        return __awaiter(this, void 0, void 0, function () {
            var debugInfo, soundEngine, uiManager_1, engineStatus, stateManager, communication, validation, settings, uiManager_2, uiManager_3, uiManager;
            return __generator(this, function (_a) {
                debugInfo = "=== SoundEngine 테스트 ===\n";
                debugInfo += "\uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                try {
                    soundEngine = getSoundEngine();
                    if (!soundEngine || !window.SoundEngine) {
                        debugInfo += "❌ SoundEngine이 로드되지 않았습니다\n";
                        uiManager_1 = getUIManager();
                        uiManager_1.updateStatus("SoundEngine이 로드되지 않았습니다", false);
                        window.lastDebugInfo = debugInfo;
                        uiManager_1.toggleDebugButton(true);
                        return [2 /*return*/];
                    }
                    debugInfo += "✅ SoundEngine 로드됨\n";
                    engineStatus = soundEngine.getEngineStatus();
                    debugInfo += "\uC5D4\uC9C4 \uC0C1\uD0DC: ".concat(engineStatus.isReady ? "준비완료" : "준비안됨", "\n");
                    if (!engineStatus.isReady) {
                        debugInfo += "\uB204\uB77D \uC758\uC874\uC131: ".concat(engineStatus.dependencies.join(', '), "\n");
                    }
                    stateManager = getStateManager();
                    debugInfo += "JSCStateManager: ".concat(stateManager && stateManager !== getStateManager() ? "✅" : "❌", "\n");
                    debugInfo += "ClipTimeCalculator: ".concat(window.ClipTimeCalculator ? "✅" : "❌", "\n");
                    communication = getCommunication();
                    debugInfo += "JSCCommunication: ".concat(communication && communication !== getCommunication() ? "✅" : "❌", "\n");
                    // 4. 상태 검증
                    if (stateManager) {
                        validation = stateManager.validateState();
                        debugInfo += "\uC0C1\uD0DC \uC720\uD6A8\uC131: ".concat(validation.isValid ? "✅" : "❌", "\n");
                        if (!validation.isValid) {
                            debugInfo += "\uC624\uB958: ".concat(validation.errors.join(', '), "\n");
                        }
                        settings = stateManager.getSettings();
                        debugInfo += "\uD3F4\uB354 \uACBD\uB85C: ".concat(settings.folderPath || "설정되지 않음", "\n");
                        debugInfo += "\uC624\uB514\uC624 \uD2B8\uB799: ".concat(settings.audioTrack, "\n");
                    }
                    uiManager_2 = getUIManager();
                    uiManager_2.updateStatus("SoundEngine 테스트 완료", true);
                }
                catch (error) {
                    debugInfo += "\u274C \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958: ".concat(error.message, "\n");
                    uiManager_3 = getUIManager();
                    uiManager_3.updateStatus("SoundEngine 테스트 실패", false);
                }
                window.lastDebugInfo = debugInfo;
                uiManager = getUIManager();
                uiManager.toggleDebugButton(true);
                return [2 /*return*/];
            });
        });
    }
    // 효과음 삽입 처리 (새로운 SoundEngine 사용)
    function insertSounds() {
        return __awaiter(this, void 0, void 0, function () {
            var utils, debugInfo, stateManager, soundEngine, uiManager_4, engineStatus, uiManager_5, validation, uiManager_6, settings, uiManager, engineConfig, result, fileNames, utils_1, e_1, uiManager;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils = getUtils();
                        debugInfo = "=== 효과음 삽입 디버그 ===\n";
                        debugInfo += "\uC2DC\uC791 \uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        debugInfo += "1. JSCStateManager 확인...\n";
                        stateManager = getStateManager();
                        if (!stateManager) {
                            debugInfo += "❌ JSCStateManager 없음\n";
                            utils.logError('JSCStateManager not available');
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ JSCStateManager 정상\n";
                        debugInfo += "2. SoundEngine 확인...\n";
                        soundEngine = getSoundEngine();
                        if (!soundEngine) {
                            debugInfo += "❌ SoundEngine 모듈 없음\n";
                            uiManager_4 = getUIManager();
                            uiManager_4.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                            utils.logError('SoundEngine not available');
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ SoundEngine 정상\n";
                        debugInfo += "3. SoundEngine 상태 확인...\n";
                        engineStatus = soundEngine.getEngineStatus();
                        debugInfo += "\uC5D4\uC9C4 \uC900\uBE44 \uC0C1\uD0DC: ".concat(engineStatus.isReady, "\n");
                        if (!engineStatus.isReady) {
                            debugInfo += "\u274C \uB204\uB77D \uC758\uC874\uC131: ".concat(engineStatus.dependencies.join(', '), "\n");
                            uiManager_5 = getUIManager();
                            uiManager_5.updateStatus("\uD544\uC694\uD55C \uBAA8\uB4C8\uC774 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4: ".concat(engineStatus.dependencies.join(', ')), false);
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ 엔진 상태 정상\n";
                        debugInfo += "4. 상태 검증...\n";
                        validation = stateManager.validateState();
                        debugInfo += "\uC0C1\uD0DC \uC720\uD6A8\uC131: ".concat(validation.isValid, "\n");
                        if (!validation.isValid) {
                            debugInfo += "\u274C \uAC80\uC99D \uC624\uB958: ".concat(validation.errors.join(', '), "\n");
                            uiManager_6 = getUIManager();
                            uiManager_6.updateStatus(validation.errors[0], false);
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ 상태 검증 통과\n";
                        settings = stateManager.getSettings();
                        debugInfo += "\uC124\uC815 - \uD3F4\uB354: ".concat(settings.folderPath, "\n");
                        debugInfo += "\uC124\uC815 - \uC624\uB514\uC624 \uD2B8\uB799: ".concat(settings.audioTrack, "\n");
                        debugInfo += "5. UI 상태 업데이트...\n";
                        uiManager = getUIManager();
                        uiManager.updateStatus("효과음 삽입 중...", true);
                        uiManager.displaySoundList([]);
                        // window.JSCUIManager.resetDebugUI(); // 디버그 정보 유지를 위해 제거
                        debugInfo += "6. SoundEngine 설정 생성...\n";
                        engineConfig = {
                            folderPath: settings.folderPath.trim(),
                            audioTrack: settings.audioTrack,
                            filterByDefaultPrefix: true, // Default 필터링 활성화
                            maxInsertions: 100 // 최대 삽입 개수 제한
                        };
                        debugInfo += "\uC5D4\uC9C4 \uC124\uC815: ".concat(JSON.stringify(engineConfig), "\n");
                        debugInfo += "7. SoundEngine.executeSoundInsertion() 호출...\n";
                        return [4 /*yield*/, soundEngine.executeSoundInsertion(engineConfig)];
                    case 2:
                        result = _a.sent();
                        debugInfo += "8. 결과 처리...\n";
                        debugInfo += "\uACB0\uACFC \uC131\uACF5: ".concat(result.success, "\n");
                        debugInfo += "\uACB0\uACFC \uBA54\uC2DC\uC9C0: ".concat(result.message, "\n");
                        if (result.data) {
                            debugInfo += "\uACB0\uACFC \uB370\uC774\uD130: ".concat(JSON.stringify(result.data), "\n");
                        }
                        // 결과 처리
                        if (result.success) {
                            uiManager.updateStatus(result.message, true);
                            // 삽입된 효과음 목록 표시 (있다면)
                            if (result.data && result.data.files) {
                                fileNames = Array.isArray(result.data.files)
                                    ? result.data.files.map(function (f) { return typeof f === 'string' ? f : f.name; })
                                    : [];
                                uiManager.displaySoundList(fileNames);
                                debugInfo += "\uD45C\uC2DC\uB41C \uD30C\uC77C \uBAA9\uB85D: ".concat(fileNames.length, "\uAC1C\n");
                            }
                        }
                        else {
                            uiManager.updateStatus(result.message, false);
                        }
                        // SoundEngine의 디버그 정보도 추가
                        if (result.debug) {
                            debugInfo += "\n--- SoundEngine 내부 디버그 ---\n";
                            debugInfo += result.debug;
                        }
                        // ExtendScript 통신 디버그 로그 추가
                        if (result.debugLog) {
                            debugInfo += "\n--- ExtendScript 통신 로그 ---\n";
                            debugInfo += result.debugLog;
                        }
                        // 실행 시간 로깅
                        if (result.executionTime) {
                            debugInfo += "\uC2E4\uD589 \uC2DC\uAC04: ".concat(result.executionTime.toFixed(2), "ms\n");
                            utils_1 = getUtils();
                            utils_1.logInfo("\uD6A8\uACFC\uC74C \uC0BD\uC785 \uC644\uB8CC - \uC18C\uC694 \uC2DC\uAC04: ".concat(result.executionTime.toFixed(2), "ms"));
                        }
                        debugInfo += "✅ insertSounds() 함수 완료\n";
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        debugInfo += "\u274C \uC608\uC678 \uBC1C\uC0DD: ".concat(e_1.message, "\n");
                        debugInfo += "\uC2A4\uD0DD \uCD94\uC801:\n".concat(e_1.stack, "\n");
                        utils.logError("Sound insertion failed:", e_1.message);
                        uiManager = getUIManager();
                        uiManager.updateStatus("효과음 삽입 중 오류가 발생했습니다.", false);
                        return [3 /*break*/, 4];
                    case 4:
                        // 디버그 정보 항상 표시
                        window.lastDebugInfo = debugInfo;
                        return [2 /*return*/];
                }
            });
        });
    }
    // 폴더 찾기 처리 (async/await로 리팩토링)
    function browseSoundFolder() {
        return __awaiter(this, void 0, void 0, function () {
            var utils, stateManager, uiManager, communication, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils = getUtils();
                        stateManager = getStateManager();
                        uiManager = getUIManager();
                        communication = getCommunication();
                        if (!communication || !communication.callExtendScriptAsync) {
                            utils.logError("Communication service not available");
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, communication.callExtendScriptAsync("browseSoundFolder()")];
                    case 2:
                        result = _a.sent();
                        utils.logDebug("Browse folder result: " + result);
                        if (result && result !== "undefined" && result !== "" && utils.isValidPath(result)) {
                            stateManager.saveFolderPath(result);
                            utils.logDebug("Valid path set: " + result);
                            // 폴더 선택 성공 후 자동으로 효과음 라이브러리 새로고침
                            uiManager.updateStatus("폴더가 설정되었습니다. 효과음 목록을 불러오는 중...", true);
                            // 잠시 후 새로고침 실행 (UI 업데이트 완료 후)
                            setTimeout(function () {
                                refreshSoundButtons();
                            }, 100);
                        }
                        else {
                            if (result && result !== "undefined" && result !== "") {
                                utils.logWarn("Invalid path received from ExtendScript: " + result);
                                uiManager.updateStatus("올바른 폴더를 선택해주세요.", false);
                            }
                            else {
                                utils.logDebug("No folder selected or empty result");
                            }
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        utils.logError("Failed to browse folder:", error_1.message);
                        uiManager.updateStatus("폴더 선택 중 오류가 발생했습니다.", false);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // 새로고침 처리 (async/await로 리팩토링)
    function refreshSoundButtons() {
        return __awaiter(this, void 0, void 0, function () {
            var stateManager, utils, uiManager, communication, currentPath, debugInfo, pathArg, result, callbackResult, parsedResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stateManager = getStateManager();
                        utils = getUtils();
                        uiManager = getUIManager();
                        communication = getCommunication();
                        currentPath = stateManager.getCurrentFolderPath();
                        utils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);
                        // 경로 유효성 검증
                        if (!currentPath || !utils.isValidPath(currentPath)) {
                            if (currentPath) {
                                utils.logWarn("currentFolderPath is invalid, clearing it: " + currentPath);
                                stateManager.clearFolderPath();
                                uiManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
                            }
                            else {
                                utils.logWarn("currentFolderPath is empty or invalid. Aborting refresh.");
                                uiManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
                            }
                            return [2 /*return*/];
                        }
                        if (!communication || !communication.callExtendScriptAsync) {
                            utils.logError("Communication service not available");
                            return [2 /*return*/];
                        }
                        debugInfo = "=== Refresh Sound Buttons Debug ===\n";
                        debugInfo += "시간: " + new Date().toISOString() + "\n";
                        debugInfo += "폴더 경로: " + currentPath + "\n";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        uiManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
                        uiManager.updateStatus("'" + utils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...", true);
                        pathArg = JSON.stringify(currentPath);
                        utils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg);
                        return [4 /*yield*/, communication.callExtendScriptAsync("getFilesForPathCS(" + pathArg + ")")];
                    case 2:
                        result = _a.sent();
                        debugInfo += "JSX 결과: " + result + "\n";
                        debugInfo += "결과 타입: " + typeof result + "\n";
                        if (!(result === "success")) return [3 /*break*/, 4];
                        debugInfo += "성공적으로 완료됨\n";
                        debugInfo += "파일 목록 가져오기 시도...\n";
                        return [4 /*yield*/, communication.callExtendScriptAsync("getFilesForPathWithCallback(" + pathArg + ")")];
                    case 3:
                        callbackResult = _a.sent();
                        debugInfo += "콜백 결과: " + callbackResult + "\n";
                        parsedResult = utils.safeJSONParse(callbackResult);
                        if (parsedResult && parsedResult.success && parsedResult.soundFiles) {
                            debugInfo += "파일 " + parsedResult.soundFiles.length + "개 발견\n";
                            uiManager.updateSoundButtons(parsedResult.soundFiles, parsedResult.folderPath);
                            uiManager.updateStatus("폴더 새로고침이 완료되었습니다. " + parsedResult.soundFiles.length + "개 파일 발견.", true);
                        }
                        else {
                            debugInfo += "파일 목록 처리 실패\n";
                            uiManager.updateStatus("파일 목록을 가져올 수 없습니다.", false);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        debugInfo += "예상치 못한 결과: " + result + "\n";
                        uiManager.updateStatus("폴더 새로고침 결과를 처리하는 중입니다...", true);
                        _a.label = 5;
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        error_2 = _a.sent();
                        debugInfo += "오류 발생: " + error_2.message + "\n";
                        utils.logError("Failed to refresh sound buttons:", error_2.message);
                        uiManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다: " + error_2.message, false);
                        return [3 /*break*/, 8];
                    case 7:
                        // 디버그 정보 저장
                        window.lastDebugInfo = debugInfo;
                        uiManager.toggleDebugButton(true);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    // 클립 자동 정렬 처리 (새로운 SoundEngine 사용)
    function magnetClips() {
        return __awaiter(this, void 0, void 0, function () {
            var utils, uiManager, soundEngine, engineStatus, magnetStatus, result, e_2, utils, uiManager;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        utils = getUtils();
                        uiManager = getUIManager();
                        soundEngine = getSoundEngine();
                        utils.debugLog("magnetClips() called");
                        // Check if SoundEngine is available
                        if (!soundEngine) {
                            uiManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                            utils.logError('SoundEngine not available');
                            return [2 /*return*/];
                        }
                        engineStatus = soundEngine.getEngineStatus();
                        if (!engineStatus.isReady) {
                            uiManager.updateStatus("\uD544\uC694\uD55C \uBAA8\uB4C8\uC774 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4: ".concat(engineStatus.dependencies.join(', ')), false);
                            return [2 /*return*/];
                        }
                        // UI 상태 업데이트
                        uiManager.updateStatus("클립 자동 정렬 중...", true);
                        uiManager.resetDebugUI();
                        magnetStatus = document.getElementById("magnetStatus");
                        if (magnetStatus) {
                            magnetStatus.textContent = "처리 중...";
                            magnetStatus.style.color = "#007acc";
                        }
                        return [4 /*yield*/, soundEngine.executeMagnetClips()];
                    case 1:
                        result = _a.sent();
                        // 결과 처리
                        if (result.success) {
                            uiManager.updateStatus(result.message, true);
                            // 마그넷 상태 업데이트
                            if (result.data) {
                                uiManager.updateMagnetStatus(true, result.data.clipsMoved || 0, result.data.gapsRemoved || 0);
                            }
                        }
                        else {
                            uiManager.updateStatus(result.message, false);
                            uiManager.updateMagnetStatus(false);
                        }
                        // 디버그 정보 표시
                        if (result.debug && utils.CONFIG.DEBUG_MODE) {
                            window.lastDebugInfo = result.debug;
                            uiManager.toggleDebugButton(true);
                        }
                        // 실행 시간 로깅
                        if (result.executionTime) {
                            utils.logInfo("\uD074\uB9BD \uC790\uB3D9 \uC815\uB82C \uC644\uB8CC - \uC18C\uC694 \uC2DC\uAC04: ".concat(result.executionTime.toFixed(2), "ms"));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        utils = getUtils();
                        uiManager = getUIManager();
                        utils.logError("Magnet clips failed:", e_2.message);
                        uiManager.updateStatus("클립 자동 정렬 중 오류가 발생했습니다.", false);
                        uiManager.updateMagnetStatus(false);
                        // 에러 정보를 디버그로 표시
                        if (utils.CONFIG.DEBUG_MODE) {
                            window.lastDebugInfo = "Error: ".concat(e_2.message, "\nStack: ").concat(e_2.stack);
                            uiManager.toggleDebugButton(true);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    // 포커스 제거 헬퍼 함수
    function removeFocusFromPanel() {
        var focusDebug = "\n--- 포커스 디버그 정보 ---\n";
        try {
            var currentElement = document.activeElement;
            focusDebug += "시작 - 현재 활성 요소: " + (currentElement ? currentElement.tagName : "없음") + "\n";
            // CEP 패널에서 포커스 제거
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
                focusDebug += "현재 요소 blur 완료\n";
            }
            // 모든 포커스 가능한 요소들을 blur
            var focusableElements = document.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach(function (el) {
                try {
                    el.blur();
                }
                catch (e) { /* ignore */ }
            });
            // 강제로 포커스 제거를 위한 임시 요소
            var tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.style.opacity = '0';
            document.body.appendChild(tempInput);
            tempInput.focus();
            tempInput.blur();
            document.body.removeChild(tempInput);
            focusDebug += "완전한 포커스 제거 시도 완료\n";
        }
        catch (e) {
            focusDebug += "포커스 제거 중 오류: " + e.message + "\n";
        }
        return focusDebug;
    }
    // 개별 효과음 버튼 클릭 처리 (async/await로 완전히 리팩토링)
    function handleSoundFileButtonClick(event) {
        return __awaiter(this, void 0, void 0, function () {
            var utils, uiManager, communication, target, soundFsName, soundDisplayName, debugInfo, simpleResult, duplicateResult, basicResult, result, parsedResult, message, errorMessage, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils = getUtils();
                        uiManager = getUIManager();
                        communication = getCommunication();
                        target = event.target;
                        soundFsName = target.getAttribute("data-fsname");
                        soundDisplayName = target.textContent;
                        // Early validation
                        if (!soundFsName) {
                            utils.logError("Sound file path (fsName) not found on button.");
                            uiManager.updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
                            return [2 /*return*/];
                        }
                        if (!communication || !communication.callExtendScriptAsync) {
                            utils.logError("Communication service or async method not available");
                            uiManager.updateStatus("통신 서비스를 사용할 수 없습니다.", false);
                            return [2 /*return*/];
                        }
                        utils.logDebug("Replacing with sound file: " + soundFsName);
                        uiManager.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);
                        debugInfo = "=== Sound File Button Click Debug ===\n";
                        debugInfo += "시간: " + new Date().toISOString() + "\n";
                        debugInfo += "파일 경로: " + soundFsName + "\n";
                        debugInfo += "파일명: " + soundDisplayName + "\n";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        // Step 1: 가장 간단한 ExtendScript 테스트
                        utils.logDebug("Testing simplest ExtendScript function first...");
                        debugInfo += "\n--- 단순 테스트 결과 ---\n";
                        return [4 /*yield*/, communication.callExtendScriptAsync("simpleTest()")];
                    case 2:
                        simpleResult = _a.sent();
                        utils.logDebug("Simple test result: " + simpleResult);
                        debugInfo += "simpleTest(): " + simpleResult + "\n";
                        if (simpleResult !== "HELLO_FROM_EXTENDSCRIPT") {
                            debugInfo += "✗ ExtendScript 기본 실행 실패: " + simpleResult + "\n";
                            uiManager.updateStatus("ExtendScript 실행 환경에 문제가 있습니다", false);
                            window.lastDebugInfo = debugInfo;
                            uiManager.toggleDebugButton(true);
                            return [2 /*return*/];
                        }
                        debugInfo += "✓ ExtendScript 기본 실행 성공\n";
                        // Step 2: 중복 임포트 테스트
                        debugInfo += "\n--- 중복 임포트 테스트 결과 ---\n";
                        return [4 /*yield*/, communication.callExtendScriptAsync("testDuplicateImport(" + JSON.stringify(soundFsName) + ")")];
                    case 3:
                        duplicateResult = _a.sent();
                        debugInfo += duplicateResult + "\n";
                        // Step 3: 기본 정보 테스트
                        debugInfo += "\n--- 기본 정보 테스트 결과 ---\n";
                        return [4 /*yield*/, communication.callExtendScriptAsync("basicInfo()")];
                    case 4:
                        basicResult = _a.sent();
                        debugInfo += "basicInfo(): " + basicResult + "\n";
                        if (!basicResult || basicResult.indexOf("ERROR:") === 0) {
                            debugInfo += "✗ 기본 정보 수집 실패: " + basicResult + "\n";
                            uiManager.updateStatus("ExtendScript 기본 정보 수집 실패", false);
                            window.lastDebugInfo = debugInfo;
                            uiManager.toggleDebugButton(true);
                            return [2 /*return*/];
                        }
                        debugInfo += "✓ 기본 정보 수집 성공\n";
                        // Step 4: 실제 클립 교체
                        debugInfo += "\n환경 테스트 통과, 클립 교체 시도...\n";
                        return [4 /*yield*/, communication.callExtendScriptAsync("replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")")];
                    case 5:
                        result = _a.sent();
                        utils.logDebug("replaceSelectedAudioClips call result: " + result);
                        debugInfo += "\n--- 클립 교체 결과 ---\n";
                        debugInfo += "원본 결과: " + result + "\n";
                        parsedResult = utils.safeJSONParse(result);
                        if (parsedResult) {
                            debugInfo += "JSON 파싱: SUCCESS\n";
                            debugInfo += "파싱된 결과:\n";
                            debugInfo += "  - success: " + parsedResult.success + "\n";
                            debugInfo += "  - message: " + parsedResult.message + "\n";
                            if (parsedResult.data) {
                                debugInfo += "  - replacedCount: " + parsedResult.data.replacedCount + "\n";
                                debugInfo += "  - totalSelected: " + parsedResult.data.totalSelected + "\n";
                            }
                            // 상태 메시지 업데이트
                            if (parsedResult.success) {
                                uiManager.updateStatus("클립 교체 완료: " + parsedResult.message, true);
                            }
                            else {
                                uiManager.updateStatus("클립 교체 실패: " + parsedResult.message, false);
                            }
                            // ExtendScript 디버그 정보 추가
                            if (parsedResult.debug) {
                                debugInfo += "\n--- ExtendScript 디버그 정보 ---\n";
                                debugInfo += parsedResult.debug;
                            }
                        }
                        else {
                            debugInfo += "JSON 파싱 실패, 문자열로 처리\n";
                            // 기존 문자열 처리 방식 사용
                            if (typeof result === "string") {
                                if (result.indexOf("success:") === 0) {
                                    message = result.substring(8);
                                    uiManager.updateStatus("클립 교체 완료: " + message, true);
                                }
                                else if (result.indexOf("error:") === 0) {
                                    errorMessage = result.substring(6);
                                    uiManager.updateStatus("클립 교체 실패: " + errorMessage, false);
                                }
                                else {
                                    uiManager.updateStatus("클립 교체 결과: " + result, true);
                                }
                            }
                        }
                        // 디버그 정보 저장
                        window.lastDebugInfo = debugInfo;
                        uiManager.toggleDebugButton(true);
                        // 포커스 처리를 비동기로 처리
                        return [4 /*yield*/, handleFocusRemovalAfterInsertion(debugInfo)];
                    case 6:
                        // 포커스 처리를 비동기로 처리
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        debugInfo += "\n\n오류 발생: " + error_3.message + "\n";
                        debugInfo += "Stack trace: " + error_3.stack + "\n";
                        utils.logError("Sound file button click failed:", error_3.message);
                        uiManager.updateStatus("클립 교체 중 오류가 발생했습니다: " + error_3.message, false);
                        window.lastDebugInfo = debugInfo;
                        uiManager.toggleDebugButton(true);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    // 포커스 제거 및 타임라인 활성화 처리 (헬퍼 함수)
    function handleFocusRemovalAfterInsertion(debugInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            var utils, uiManager, communication, focusDebug, finalElement, fullFocusDebug, focusResult, veryFinalElement, focusError_1, focusError_2, errorMsg;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        utils = getUtils();
                                        uiManager = getUIManager();
                                        communication = getCommunication();
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 8, , 9]);
                                        focusDebug = removeFocusFromPanel();
                                        finalElement = document.activeElement;
                                        fullFocusDebug = focusDebug;
                                        fullFocusDebug += "blur 후 - 최종 활성 요소: " +
                                            (finalElement ? (finalElement.tagName +
                                                (finalElement.id ? "#" + finalElement.id : "") +
                                                (finalElement.textContent ? " (" + finalElement.textContent.substring(0, 20) + ")" : "")) : "없음") + "\n";
                                        // UI에 포커스 정보 표시
                                        uiManager.updateStatus("효과음 삽입 완료 - 포커스 상태 확인", true);
                                        if (!(communication && communication.callExtendScriptAsync)) return [3 /*break*/, 6];
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, communication.callExtendScriptAsync("focusTimeline();")];
                                    case 3:
                                        focusResult = _a.sent();
                                        fullFocusDebug += "타임라인 포커스 이동 결과: " + focusResult + "\n";
                                        veryFinalElement = document.activeElement;
                                        fullFocusDebug += "최종 - 활성 요소: " +
                                            (veryFinalElement ? (veryFinalElement.tagName + (veryFinalElement.id ? "#" + veryFinalElement.id : "")) : "없음") + "\n";
                                        return [3 /*break*/, 5];
                                    case 4:
                                        focusError_1 = _a.sent();
                                        fullFocusDebug += "타임라인 포커스 이동 실패: " + focusError_1.message + "\n";
                                        return [3 /*break*/, 5];
                                    case 5: return [3 /*break*/, 7];
                                    case 6:
                                        fullFocusDebug += "Communication 객체 없음\n";
                                        _a.label = 7;
                                    case 7:
                                        // 디버그 정보에 포커스 정보 추가
                                        window.lastDebugInfo = (window.lastDebugInfo || debugInfo) + fullFocusDebug;
                                        utils.logDebug("포커스 디버그:", fullFocusDebug);
                                        return [3 /*break*/, 9];
                                    case 8:
                                        focusError_2 = _a.sent();
                                        errorMsg = "포커스 이동 중 오류: " + focusError_2.message;
                                        uiManager.updateStatus(errorMsg, false);
                                        utils.logDebug(errorMsg);
                                        return [3 /*break*/, 9];
                                    case 9:
                                        resolve();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 100);
                    })];
            });
        });
    }
    // ===== 캡션-이미지 동기화 기능 =====
    /**
     * 캡션-이미지 동기화 이벤트 리스너 설정
     */
    function setupCaptionEventListeners() {
        var utils = getUtils();
        utils.logDebug('Setting up caption-image sync event listeners...');
        // 위치 확인 버튼
        var testButton = document.getElementById('test-sync-method');
        if (testButton) {
            testButton.addEventListener('click', testSyncMethod);
            utils.logDebug('Event listener added to test-sync-method button');
        }
        // 이미지 붙여넣기 버튼
        var pasteButton = document.getElementById('paste-image');
        if (pasteButton) {
            pasteButton.addEventListener('click', pasteImageFromClipboard);
            utils.logDebug('Event listener added to paste-image button');
        }
        // 이미지 찾기 버튼
        var browseButton = document.getElementById('browse-images');
        if (browseButton) {
            browseButton.addEventListener('click', browseImagesForSync);
            utils.logDebug('Event listener added to browse-images button');
        }
        // 동기화 시작 버튼
        var syncButton = document.getElementById('sync-caption-images');
        if (syncButton) {
            syncButton.addEventListener('click', startCaptionImageSync);
            utils.logDebug('Event listener added to sync-caption-images button');
        }
        // 이미지 큐 비우기 버튼
        var clearQueueButton = document.getElementById('clear-image-queue');
        if (clearQueueButton) {
            clearQueueButton.addEventListener('click', clearImageQueue);
            utils.logDebug('Event listener added to clear-image-queue button');
        }
    }
    /**
     * 선택한 동기화 방법 테스트
     */
    function testSyncMethod() {
        var _a;
        var utils = getUtils();
        var communication = getCommunication();
        var resultDiv = document.getElementById('sync-test-result');
        // 선택된 방법 확인
        var selectedMethod = (_a = document.querySelector('input[name="sync-method"]:checked')) === null || _a === void 0 ? void 0 : _a.value;
        if (!selectedMethod) {
            if (resultDiv)
                resultDiv.textContent = '동기화 방법을 선택하세요';
            return;
        }
        if (resultDiv)
            resultDiv.textContent = '확인 중...';
        var scriptCall = '';
        if (selectedMethod === 'selection') {
            scriptCall = 'getSelectedClipsForImageSync()';
        }
        else if (selectedMethod === 'markers') {
            scriptCall = 'getMarkersForImageSync()';
        }
        else {
            if (resultDiv)
                resultDiv.textContent = '수동 입력 모드는 테스트할 수 없습니다';
            return;
        }
        utils.logDebug('Testing sync method:', selectedMethod);
        communication.callExtendScript(scriptCall, function (result) {
            try {
                utils.logDebug('Raw result from ExtendScript:', result);
                var data = JSON.parse(result);
                if (data.success) {
                    var count = data.selectedItems ? data.selectedItems.length : data.markers ? data.markers.length : 0;
                    if (resultDiv)
                        resultDiv.textContent = "\u2713 ".concat(data.message, " (").concat(count, "\uAC1C \uC704\uCE58)");
                    utils.logInfo('Sync test successful:', data.message);
                }
                else {
                    if (resultDiv)
                        resultDiv.textContent = "\u2717 ".concat(data.message);
                    utils.logWarn('Sync test failed:', data.message);
                }
            }
            catch (e) {
                if (resultDiv)
                    resultDiv.textContent = "\u2717 \uACB0\uACFC \uD30C\uC2F1 \uC2E4\uD328: ".concat(result);
                utils.logError('Failed to parse sync test result:', result);
                utils.logError('Parse error:', e.message);
            }
        });
    }
    /**
     * 클립보드에서 이미지 붙여넣기 (CEP 환경에서 차단됨)
     *
     * CEP의 보안 정책으로 인해 navigator.clipboard.read() 권한이 거부됩니다.
     * 테스트 결과: NotAllowedError - Read permission denied.
     *
     * 대안: "📁 이미지 선택" 버튼 사용
     */
    function pasteImageFromClipboard() {
        return __awaiter(this, void 0, void 0, function () {
            var resultDiv;
            return __generator(this, function (_a) {
                resultDiv = document.getElementById('sync-test-result');
                if (resultDiv) {
                    resultDiv.textContent = '✗ CEP 보안 정책으로 클립보드 읽기가 차단됩니다. "이미지 선택" 버튼을 사용하세요.';
                }
                return [2 /*return*/];
            });
        });
    }
    /**
     * 이미지 파일 찾기
     */
    function browseImagesForSync() {
        var utils = getUtils();
        var communication = getCommunication();
        var resultDiv = document.getElementById('sync-test-result');
        if (resultDiv)
            resultDiv.textContent = '이미지 선택 중...';
        // JSX에서 파일 선택 다이얼로그 열기
        var script = "\n            var files = File.openDialog(\"\uC774\uBBF8\uC9C0 \uD30C\uC77C \uC120\uD0DD\", \"Image Files:*.png;*.jpg;*.jpeg\", true);\n            if (files) {\n                var result = [];\n                if (files instanceof Array) {\n                    for (var i = 0; i < files.length; i++) {\n                        result.push(files[i].fsName);\n                    }\n                } else {\n                    result.push(files.fsName);\n                }\n                JSON.stringify({ success: true, files: result });\n            } else {\n                JSON.stringify({ success: false, message: \"\uCDE8\uC18C\uB428\" });\n            }\n        ";
        communication.callExtendScript(script, function (result) {
            try {
                var data = JSON.parse(result);
                if (data.success && data.files) {
                    data.files.forEach(function (filePath) {
                        var _a;
                        var fileName = ((_a = filePath.split('\\').pop()) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || 'image.png';
                        // 파일 경로를 큐에 추가 (실제로는 base64로 변환 필요)
                        addImageToQueue(filePath, fileName);
                    });
                    if (resultDiv)
                        resultDiv.textContent = "\u2713 ".concat(data.files.length, "\uAC1C \uC774\uBBF8\uC9C0 \uCD94\uAC00\uB428");
                }
                else {
                    if (resultDiv)
                        resultDiv.textContent = '이미지 선택 취소됨';
                }
            }
            catch (e) {
                if (resultDiv)
                    resultDiv.textContent = '✗ 이미지 선택 실패';
                utils.logError('Failed to browse images:', e.message);
            }
        });
    }
    /**
     * 이미지를 큐에 추가
     */
    function addImageToQueue(imageDataOrPath, fileName) {
        var queueDiv = document.getElementById('image-queue');
        if (!queueDiv)
            return;
        var imageItem = document.createElement('div');
        imageItem.className = 'image-queue-item';
        imageItem.innerHTML = "\n            <span>".concat(fileName, "</span>\n            <button class=\"btn-remove\" onclick=\"this.parentElement.remove()\">\u2715</button>\n        ");
        imageItem.dataset.imageData = imageDataOrPath;
        imageItem.dataset.fileName = fileName;
        queueDiv.appendChild(imageItem);
        // 동기화 버튼 활성화
        var syncButton = document.getElementById('sync-caption-images');
        if (syncButton) {
            syncButton.disabled = false;
        }
    }
    /**
     * 이미지 큐 비우기
     */
    function clearImageQueue() {
        var utils = getUtils();
        var queueDiv = document.getElementById('image-queue');
        if (!queueDiv) {
            utils.logWarn('Image queue element not found');
            return;
        }
        var imageCount = queueDiv.querySelectorAll('.image-queue-item').length;
        if (imageCount === 0) {
            utils.logInfo('Image queue is already empty');
            return;
        }
        // 큐 비우기
        queueDiv.innerHTML = '';
        // 동기화 버튼 비활성화
        var syncButton = document.getElementById('sync-caption-images');
        if (syncButton) {
            syncButton.disabled = true;
        }
        utils.logInfo("Image queue cleared: ".concat(imageCount, " images removed"));
        // 결과 메시지 표시
        var resultDiv = document.getElementById('sync-test-result');
        if (resultDiv) {
            resultDiv.textContent = "\u2713 ".concat(imageCount, "\uAC1C \uC774\uBBF8\uC9C0 \uC81C\uAC70\uB428");
        }
    }
    /**
     * 캡션-이미지 동기화 시작
     */
    function startCaptionImageSync() {
        return __awaiter(this, void 0, void 0, function () {
            var utils, communication, resultDiv, debugInfo, queueDiv, imageItems, selectedMethod, captionGroup, targetTrack, scriptCall;
            var _this = this;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                utils = getUtils();
                communication = getCommunication();
                resultDiv = document.getElementById('sync-test-result');
                debugInfo = "=== 캡션-이미지 동기화 디버그 ===\n";
                debugInfo += "\uC2DC\uC791 \uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                queueDiv = document.getElementById('image-queue');
                imageItems = queueDiv === null || queueDiv === void 0 ? void 0 : queueDiv.querySelectorAll('.image-queue-item');
                if (!imageItems || imageItems.length === 0) {
                    if (resultDiv)
                        resultDiv.textContent = '✗ 이미지를 먼저 추가하세요';
                    debugInfo += "ERROR: 이미지가 선택되지 않음\n";
                    window.lastDebugInfo = debugInfo;
                    return [2 /*return*/];
                }
                selectedMethod = (_a = document.querySelector('input[name="sync-method"]:checked')) === null || _a === void 0 ? void 0 : _a.value;
                captionGroup = parseInt(((_b = document.getElementById('caption-group')) === null || _b === void 0 ? void 0 : _b.value) || '1');
                targetTrack = parseInt(((_c = document.getElementById('target-video-track')) === null || _c === void 0 ? void 0 : _c.value) || '0');
                debugInfo += "\uB3D9\uAE30\uD654 \uBC29\uBC95: ".concat(selectedMethod, "\n");
                debugInfo += "\uCEA1\uC158 \uADF8\uB8F9\uD654: ".concat(captionGroup, "\n");
                debugInfo += "\uB300\uC0C1 \uBE44\uB514\uC624 \uD2B8\uB799: V".concat(targetTrack + 1, "\n");
                debugInfo += "\uC774\uBBF8\uC9C0 \uAC1C\uC218: ".concat(imageItems.length, "\n\n");
                if (resultDiv)
                    resultDiv.textContent = '동기화 중...';
                utils.logInfo('Starting caption-image sync:', { method: selectedMethod, group: captionGroup, track: targetTrack });
                scriptCall = '';
                if (selectedMethod === 'selection') {
                    scriptCall = 'getSelectedClipsForImageSync()';
                    debugInfo += "위치 정보: 선택된 클립 기반\n";
                }
                else if (selectedMethod === 'markers') {
                    scriptCall = 'getMarkersForImageSync()';
                    debugInfo += "위치 정보: 마커 기반\n";
                }
                else {
                    if (resultDiv)
                        resultDiv.textContent = '✗ 수동 입력 모드는 아직 지원되지 않습니다';
                    debugInfo += "ERROR: 수동 입력 모드는 지원되지 않음\n";
                    window.lastDebugInfo = debugInfo;
                    return [2 /*return*/];
                }
                communication.callExtendScript(scriptCall, function (positionResult) { return __awaiter(_this, void 0, void 0, function () {
                    var positionData, positions, successCount_1, syncDebugMsg, _loop_1, i, e_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, , 6]);
                                debugInfo += "\nJSX \uD638\uCD9C \uACB0\uACFC: ".concat(positionResult.substring(0, 100), "...\n");
                                positionData = JSON.parse(positionResult);
                                if (!positionData.success) {
                                    if (resultDiv)
                                        resultDiv.textContent = "\u2717 ".concat(positionData.message);
                                    debugInfo += "ERROR: ".concat(positionData.message, "\n");
                                    window.lastDebugInfo = debugInfo;
                                    return [2 /*return*/];
                                }
                                positions = positionData.selectedItems || positionData.markers || [];
                                if (positions.length === 0) {
                                    if (resultDiv)
                                        resultDiv.textContent = '✗ 위치 정보를 찾을 수 없습니다';
                                    debugInfo += "ERROR: 위치 정보를 찾을 수 없음\n";
                                    window.lastDebugInfo = debugInfo;
                                    return [2 /*return*/];
                                }
                                successCount_1 = 0;
                                debugInfo += "\n\uCD1D \uC704\uCE58: ".concat(positions.length, "\uAC1C\n");
                                debugInfo += "\uB8E8\uD504 \uBC18\uBCF5 \uD69F\uC218: ".concat(imageItems.length, "\uBC88\n\n");
                                syncDebugMsg = "\uCD1D \uC774\uBBF8\uC9C0: ".concat(imageItems.length, ", \uCD1D \uC704\uCE58: ").concat(positions.length, ", \uADF8\uB8F9\uD654: ").concat(captionGroup);
                                utils.logInfo(syncDebugMsg);
                                console.log("[SYNC] ".concat(syncDebugMsg));
                                _loop_1 = function (i) {
                                    var imageItem, imageData, positionIndex, position, isFilePath, insertScript, escapedPath, tempPath;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                debugInfo += "\n===== \uB8E8\uD504 ".concat(i + 1, "/").concat(imageItems.length, " =====\n");
                                                imageItem = imageItems[i];
                                                imageData = imageItem.dataset.imageData || '';
                                                positionIndex = i * captionGroup;
                                                position = positions[positionIndex];
                                                debugInfo += "\uC774\uBBF8\uC9C0 \uC778\uB371\uC2A4: ".concat(i, "\n");
                                                debugInfo += "\uC704\uCE58 \uC778\uB371\uC2A4: ".concat(positionIndex, " (\uADF8\uB8F9\uD654=").concat(captionGroup, ")\n");
                                                debugInfo += "\uC774\uBBF8\uC9C0: ".concat(imageData.substring(0, 80), "...\n");
                                                debugInfo += "\uC704\uCE58: ".concat(position ? position.start + 's ~ ' + position.end + 's' : 'undefined', "\n");
                                                if (!position) {
                                                    debugInfo += "ERROR: \uC704\uCE58 \uC815\uBCF4\uAC00 \uC5C6\uC74C (\uC778\uB371\uC2A4 ".concat(positionIndex, ")\n");
                                                    utils.logWarn("[".concat(i, "] \uC704\uCE58 \uC815\uBCF4\uAC00 \uC5C6\uC74C (\uADF8\uB8F9 \uC778\uB371\uC2A4: ").concat(i * captionGroup, ")"));
                                                    return [2 /*return*/, "continue"];
                                                }
                                                isFilePath = imageData.includes('\\') || imageData.includes('/');
                                                debugInfo += "\uD30C\uC77C \uACBD\uB85C \uC5EC\uBD80: ".concat(isFilePath, "\n");
                                                insertScript = '';
                                                if (isFilePath) {
                                                    escapedPath = imageData.replace(/\\/g, '\\\\');
                                                    debugInfo += "\uC774\uC2A4\uCF00\uC774\uD504\uB41C \uACBD\uB85C: ".concat(escapedPath, "\n");
                                                    insertScript = "insertImageAtTime(\"".concat(escapedPath, "\", ").concat(targetTrack, ", ").concat(position.start, ", ").concat(position.end, ")");
                                                }
                                                else {
                                                    tempPath = "C:\\\\temp\\\\caption_sync_".concat(Date.now(), "_").concat(i, ".png");
                                                    debugInfo += "\uC784\uC2DC \uD30C\uC77C \uACBD\uB85C: ".concat(tempPath, "\n");
                                                    insertScript = "\n                            var savedPath = saveBase64ImageToFile(\"".concat(imageData, "\", \"").concat(tempPath, "\");\n                            if (savedPath) {\n                                insertImageAtTime(savedPath, ").concat(targetTrack, ", ").concat(position.start, ", ").concat(position.end, ");\n                            } else {\n                                JSCEditHelperJSON.stringify({ success: false, message: \"\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC2E4\uD328\" });\n                            }\n                        ");
                                                }
                                                debugInfo += "JSX \uC2E4\uD589: ".concat(insertScript.substring(0, 100), "...\n");
                                                return [4 /*yield*/, new Promise(function (resolve) {
                                                        communication.callExtendScript(insertScript, function (insertResult) {
                                                            debugInfo += "JSX \uACB0\uACFC: ".concat(insertResult.substring(0, 150), "...\n");
                                                            try {
                                                                var result = JSON.parse(insertResult);
                                                                if (result.success) {
                                                                    successCount_1++;
                                                                    debugInfo += "\u2713 \uC131\uACF5! (\uCD1D ".concat(successCount_1, "\uAC1C \uC0BD\uC785\uB428)\n");
                                                                    utils.logInfo("[".concat(i, "] \u2713 \uC774\uBBF8\uC9C0 \uC0BD\uC785 \uC131\uACF5! (\uCD1D ").concat(successCount_1, "\uAC1C)"));
                                                                }
                                                                else {
                                                                    debugInfo += "\u2717 \uC2E4\uD328: ".concat(result.message, "\n");
                                                                    utils.logWarn("[".concat(i, "] \u2717 \uC774\uBBF8\uC9C0 \uC0BD\uC785 \uC2E4\uD328: ").concat(result.message));
                                                                }
                                                                // JSX의 디버그 로그 추가
                                                                if (result.debug) {
                                                                    debugInfo += "\n--- JSX 디버그 로그 ---\n";
                                                                    debugInfo += result.debug;
                                                                    debugInfo += "--- JSX 디버그 로그 끝 ---\n\n";
                                                                }
                                                            }
                                                            catch (e) {
                                                                debugInfo += "\u2717 JSON \uD30C\uC2F1 \uC2E4\uD328: ".concat(e.message, "\n");
                                                                debugInfo += "\uC6D0\uBCF8 \uC751\uB2F5: ".concat(insertResult, "\n");
                                                                utils.logError("[".concat(i, "] JSON \uD30C\uC2F1 \uC2E4\uD328:"), e.message);
                                                            }
                                                            resolve();
                                                        });
                                                    })];
                                            case 1:
                                                _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                };
                                i = 0;
                                _a.label = 1;
                            case 1:
                                if (!(i < imageItems.length && i < positions.length)) return [3 /*break*/, 4];
                                return [5 /*yield**/, _loop_1(i)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3:
                                i++;
                                return [3 /*break*/, 1];
                            case 4:
                                debugInfo += "\n===== \uB3D9\uAE30\uD654 \uC644\uB8CC =====\n";
                                debugInfo += "\uCD1D ".concat(successCount_1, "\uAC1C \uC774\uBBF8\uC9C0 \uC0BD\uC785\uB428\n");
                                debugInfo += "\uC885\uB8CC \uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                                if (resultDiv) {
                                    resultDiv.textContent = "\u2713 ".concat(successCount_1, "\uAC1C \uC774\uBBF8\uC9C0 \uB3D9\uAE30\uD654 \uC644\uB8CC");
                                }
                                utils.logInfo("Caption-image sync completed: ".concat(successCount_1, " images inserted"));
                                // 디버그 정보 저장
                                window.lastDebugInfo = debugInfo;
                                return [3 /*break*/, 6];
                            case 5:
                                e_3 = _a.sent();
                                debugInfo += "\nERROR: ".concat(e_3.message, "\n");
                                debugInfo += "Stack: ".concat(e_3.stack, "\n");
                                window.lastDebugInfo = debugInfo;
                                if (resultDiv)
                                    resultDiv.textContent = '✗ 동기화 실패';
                                utils.logError('Failed to sync caption-images:', e_3.message);
                                return [3 /*break*/, 6];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    }
    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        var dependencies = [];
        // DIHelpers 상태 확인
        if (DIHelpers) {
            dependencies.push('DIHelpers (Available)');
        }
        else {
            dependencies.push('DIHelpers (Not loaded)');
        }
        // 서비스 availability 체크
        if (window.JSCUtils)
            dependencies.push('JSCUtils (Available)');
        else
            dependencies.push('JSCUtils (Missing)');
        if (window.JSCUIManager)
            dependencies.push('JSCUIManager (Available)');
        else
            dependencies.push('JSCUIManager (Missing)');
        if (window.JSCStateManager)
            dependencies.push('JSCStateManager (Available)');
        else
            dependencies.push('JSCStateManager (Missing)');
        if (window.JSCCommunication)
            dependencies.push('JSCCommunication (Available)');
        else
            dependencies.push('JSCCommunication (Missing)');
        if (window.SoundEngine)
            dependencies.push('SoundEngine (Available)');
        else
            dependencies.push('SoundEngine (Missing)');
        return {
            isDIAvailable: !!DIHelpers,
            containerInfo: DIHelpers ? 'DIHelpers active' : 'Fallback mode',
            dependencies: dependencies
        };
    }
    // 공개 API
    return {
        setupEventListeners: setupEventListeners,
        handleSoundFileButtonClick: handleSoundFileButtonClick,
        refreshSoundButtons: refreshSoundButtons, // 자동 새로고침을 위해 공개
        getDIStatus: getDIStatus // DI 패턴 적용
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCEventManager = JSCEventManager;
}
//# sourceMappingURL=event-manager.js.map