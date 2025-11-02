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
    // 이미지 파일명 고유성을 위한 카운터
    var imageCounter = 0;
    // 이미지 매핑 배열 (고급 모드용)
    var imageMappings = [];
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
        // Paste 이벤트 리스너 (Ctrl+V 감지)
        // 사용자가 이미지를 복사하고 패널에서 Ctrl+V를 누르면 자동으로 이미지 큐에 추가됨
        document.addEventListener('paste', handlePasteEvent);
        utils.logDebug('Global paste event listener added');
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
        // 드래그 앤 드롭 이벤트 (패널)
        var imageSummary = document.getElementById('image-summary');
        if (imageSummary) {
            setupDragAndDrop(imageSummary);
            utils.logDebug('Drag and drop setup for image-summary');
        }
        // 드래그 앤 드롭 이벤트 (모달)
        var modalDropZone = document.getElementById('modal-drop-zone');
        if (modalDropZone) {
            setupDragAndDrop(modalDropZone);
            utils.logDebug('Drag and drop setup for modal-drop-zone');
        }
    }
    /**
     * 패널 요약 정보 업데이트
     */
    function updateImageSummary() {
        var countText = document.getElementById('image-count-text');
        var openModalBtn = document.getElementById('open-image-modal');
        var previewDiv = document.getElementById('image-preview-thumbnails');
        if (!countText || !openModalBtn || !previewDiv)
            return;
        if (imageMappings.length === 0) {
            countText.textContent = '이미지가 없습니다';
            openModalBtn.disabled = true;
            previewDiv.innerHTML = '';
        }
        else {
            countText.textContent = "\uC774\uBBF8\uC9C0 ".concat(imageMappings.length, "\uAC1C");
            openModalBtn.disabled = false;
            // 미리보기 썸네일 렌더링 (모든 이미지)
            previewDiv.innerHTML = '';
            imageMappings.forEach(function (mapping) {
                // 래퍼 생성
                var wrapper = document.createElement('div');
                wrapper.className = 'preview-thumbnail-wrapper';
                wrapper.draggable = true;
                wrapper.dataset.imageId = mapping.id;
                // 썸네일 이미지
                var img = document.createElement('img');
                img.className = 'preview-thumbnail';
                img.src = "data:image/png;base64,".concat(mapping.thumbnail);
                img.alt = mapping.fileName;
                img.title = mapping.fileName;
                // 삭제 버튼
                var removeBtn = document.createElement('div');
                removeBtn.className = 'preview-remove-btn';
                removeBtn.textContent = '✕';
                removeBtn.title = "".concat(mapping.fileName, " \uC0AD\uC81C");
                removeBtn.dataset.imageId = mapping.id;
                removeBtn.addEventListener('click', handleRemoveImage);
                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                // 캡션 개수 표시 (항상)
                var captionCount = document.createElement('div');
                captionCount.className = 'preview-caption-count';
                captionCount.textContent = String(mapping.captionCount || 1);
                captionCount.title = '캡션 개수 (클릭하여 변경)';
                captionCount.dataset.imageId = mapping.id;
                captionCount.addEventListener('click', handlePreviewCaptionClick);
                wrapper.appendChild(captionCount);
                // 드래그 앤 드롭 이벤트 추가
                wrapper.addEventListener('dragstart', handlePreviewDragStart);
                wrapper.addEventListener('dragover', handlePreviewDragOver);
                wrapper.addEventListener('drop', handlePreviewDrop);
                wrapper.addEventListener('dragend', handlePreviewDragEnd);
                previewDiv.appendChild(wrapper);
            });
        }
    }
    /**
     * 특정 인덱스부터 캡션 범위 업데이트 (DOM 텍스트만 변경)
     * @param startIndex 업데이트 시작 인덱스
     */
    function updateCaptionRanges(startIndex) {
        var queueDiv = document.getElementById('image-queue');
        if (!queueDiv)
            return;
        // 시작 인덱스까지의 누적 캡션 개수 계산
        var cumulativeCaptionIndex = 1;
        for (var i = 0; i < startIndex; i++) {
            cumulativeCaptionIndex += imageMappings[i].captionCount;
        }
        // startIndex부터 끝까지 캡션 범위 텍스트만 업데이트
        for (var i = startIndex; i < imageMappings.length; i++) {
            var mapping = imageMappings[i];
            var captionStart = cumulativeCaptionIndex;
            var captionEnd = cumulativeCaptionIndex + mapping.captionCount - 1;
            // DOM 요소 찾아서 텍스트만 업데이트
            var captionPreview = document.getElementById("caption-preview-".concat(mapping.id));
            if (captionPreview) {
                captionPreview.textContent = "\uCEA1\uC158 ".concat(captionStart, "-").concat(captionEnd, " \uBC94\uC704");
            }
            cumulativeCaptionIndex += mapping.captionCount;
        }
    }
    /**
     * 단일 이미지를 DOM에 추가 (성능 최적화용)
     * @param mapping 추가할 이미지 매핑
     * @param index imageMappings 배열에서의 인덱스
     */
    function addSingleImageToDOM(mapping, index) {
        var queueDiv = document.getElementById('image-queue');
        if (!queueDiv)
            return;
        // 빈 상태 메시지 제거
        if (imageMappings.length === 1) {
            queueDiv.innerHTML = '';
        }
        // 이전 이미지들의 captionCount 합산하여 현재 이미지의 시작 캡션 계산
        var cumulativeCaptionIndex = 1;
        for (var i = 0; i < index; i++) {
            cumulativeCaptionIndex += imageMappings[i].captionCount;
        }
        var captionStart = cumulativeCaptionIndex;
        var captionEnd = cumulativeCaptionIndex + mapping.captionCount - 1;
        // DOM 요소 생성
        var itemDiv = document.createElement('div');
        itemDiv.className = 'image-queue-item-advanced';
        itemDiv.draggable = true;
        itemDiv.dataset.imageId = mapping.id;
        itemDiv.innerHTML = "\n            <div class=\"drag-handle\" title=\"\uB4DC\uB798\uADF8\uD558\uC5EC \uC21C\uC11C \uBCC0\uACBD\">\u22EE</div>\n            <img class=\"image-thumbnail\" src=\"data:image/png;base64,".concat(mapping.thumbnail, "\" alt=\"").concat(mapping.fileName, "\">\n            <div class=\"image-info\">\n                <div class=\"image-info-header\">\n                    <span class=\"image-filename\" title=\"").concat(mapping.fileName, "\">").concat(mapping.fileName, "</span>\n                    <button class=\"image-remove-btn\" data-image-id=\"").concat(mapping.id, "\">\u2715</button>\n                </div>\n                <div class=\"caption-range\">\n                    <label>\uCEA1\uC158 \uAC1C\uC218:</label>\n                    <div class=\"caption-range-inputs\">\n                        <select data-image-id=\"").concat(mapping.id, "\" class=\"caption-count-input select-modern\" style=\"width: 80px;\">\n                            ").concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) {
            return "<option value=\"".concat(n, "\" ").concat(n === mapping.captionCount ? 'selected' : '', ">").concat(n, "\uAC1C</option>");
        }).join(''), "\n                        </select>\n                    </div>\n                </div>\n                <div class=\"caption-preview\" id=\"caption-preview-").concat(mapping.id, "\">\n                    \uCEA1\uC158 ").concat(captionStart, "-").concat(captionEnd, " \uBC94\uC704\n                </div>\n            </div>\n        ");
        queueDiv.appendChild(itemDiv);
        // 드래그 이벤트 추가
        itemDiv.addEventListener('dragstart', handleDragStart);
        itemDiv.addEventListener('dragover', handleDragOver);
        itemDiv.addEventListener('drop', handleDrop);
        itemDiv.addEventListener('dragend', handleDragEnd);
        // 제거 버튼 이벤트 추가
        var removeBtn = itemDiv.querySelector('.image-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', handleRemoveImage);
        }
        // 캡션 개수 입력 이벤트 추가
        var countInput = itemDiv.querySelector('.caption-count-input');
        if (countInput) {
            countInput.addEventListener('change', handleCaptionCountChange);
        }
    }
    /**
     * 이미지 큐 렌더링 (모달 내부 - 기본 모드 vs 고급 모드)
     */
    function renderImageQueue() {
        var queueDiv = document.getElementById('image-queue');
        if (!queueDiv)
            return;
        queueDiv.innerHTML = '';
        // 패널 요약 정보 업데이트
        updateImageSummary();
        if (imageMappings.length === 0) {
            queueDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">이미지를 추가하세요</div>';
            return;
        }
        // 자동 캡션 범위 계산을 위한 누적 카운터
        var cumulativeCaptionIndex = 1;
        imageMappings.forEach(function (mapping) {
            // 이 이미지의 캡션 범위 계산
            var captionStart = cumulativeCaptionIndex;
            var captionEnd = cumulativeCaptionIndex + mapping.captionCount - 1;
            // 다음 이미지를 위해 누적 카운터 업데이트
            cumulativeCaptionIndex += mapping.captionCount;
            // 썸네일 + 캡션 개수 입력
            var itemDiv = document.createElement('div');
            itemDiv.className = 'image-queue-item-advanced';
            itemDiv.draggable = true;
            itemDiv.dataset.imageId = mapping.id;
            itemDiv.innerHTML = "\n                <div class=\"drag-handle\" title=\"\uB4DC\uB798\uADF8\uD558\uC5EC \uC21C\uC11C \uBCC0\uACBD\">\u22EE</div>\n                <img class=\"image-thumbnail\" src=\"data:image/png;base64,".concat(mapping.thumbnail, "\" alt=\"").concat(mapping.fileName, "\">\n                <div class=\"image-info\">\n                    <div class=\"image-info-header\">\n                        <span class=\"image-filename\" title=\"").concat(mapping.fileName, "\">").concat(mapping.fileName, "</span>\n                        <button class=\"image-remove-btn\" data-image-id=\"").concat(mapping.id, "\">\u2715</button>\n                    </div>\n                    <div class=\"caption-range\">\n                        <label>\uCEA1\uC158 \uAC1C\uC218:</label>\n                        <div class=\"caption-range-inputs\">\n                            <select data-image-id=\"").concat(mapping.id, "\" class=\"caption-count-input select-modern\" style=\"width: 80px;\">\n                                ").concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) {
                return "<option value=\"".concat(n, "\" ").concat(n === mapping.captionCount ? 'selected' : '', ">").concat(n, "\uAC1C</option>");
            }).join(''), "\n                            </select>\n                        </div>\n                    </div>\n                    <div class=\"caption-preview\" id=\"caption-preview-").concat(mapping.id, "\">\n                        \uCEA1\uC158 ").concat(captionStart, "-").concat(captionEnd, " \uBC94\uC704\n                    </div>\n                </div>\n            ");
            queueDiv.appendChild(itemDiv);
            // 드래그 이벤트 추가
            itemDiv.addEventListener('dragstart', handleDragStart);
            itemDiv.addEventListener('dragover', handleDragOver);
            itemDiv.addEventListener('drop', handleDrop);
            itemDiv.addEventListener('dragend', handleDragEnd);
        });
        // 제거 버튼 이벤트 추가
        queueDiv.querySelectorAll('.image-remove-btn').forEach(function (btn) {
            btn.addEventListener('click', handleRemoveImage);
        });
        // 캡션 개수 입력 이벤트 추가
        queueDiv.querySelectorAll('.caption-count-input').forEach(function (input) {
            input.addEventListener('change', handleCaptionCountChange);
        });
        // 동기화 버튼 상태 업데이트
        var syncButton = document.getElementById('sync-caption-images');
        if (syncButton) {
            syncButton.disabled = imageMappings.length === 0;
        }
    }
    /**
     * 드래그 앤 드롭 핸들러
     */
    var draggedElement = null;
    function handleDragStart(e) {
        var target = e.currentTarget;
        draggedElement = target;
        target.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            // 내부 드래그임을 표시 (외부 파일 드래그와 구분)
            e.dataTransfer.setData('text/plain', 'internal-reorder');
        }
    }
    function handleDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }
    function handleDrop(e) {
        var _a, _b;
        e.preventDefault();
        var target = e.currentTarget;
        if (draggedElement && draggedElement !== target) {
            var draggedId_1 = draggedElement.dataset.imageId;
            var targetId_1 = target.dataset.imageId;
            if (draggedId_1 && targetId_1) {
                // imageMappings 배열에서 순서 변경
                var draggedIndex = imageMappings.findIndex(function (m) { return m.id === draggedId_1; });
                var targetIndex = imageMappings.findIndex(function (m) { return m.id === targetId_1; });
                if (draggedIndex !== -1 && targetIndex !== -1) {
                    var draggedItem = imageMappings.splice(draggedIndex, 1)[0];
                    imageMappings.splice(targetIndex, 0, draggedItem);
                    // 성능 최적화: 전체 재렌더링 대신 DOM 요소만 이동
                    var queueDiv = document.getElementById('image-queue');
                    if (queueDiv) {
                        // DOM에서 드래그된 요소를 타겟 위치로 이동
                        if (draggedIndex < targetIndex) {
                            // 아래로 이동: target 다음에 삽입
                            (_a = target.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(draggedElement, target.nextSibling);
                        }
                        else {
                            // 위로 이동: target 앞에 삽입
                            (_b = target.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(draggedElement, target);
                        }
                        // 영향받는 이미지들의 캡션 범위만 업데이트
                        var minIndex = Math.min(draggedIndex, targetIndex);
                        updateCaptionRanges(minIndex);
                    }
                }
            }
        }
    }
    function handleDragEnd(e) {
        var target = e.currentTarget;
        target.classList.remove('dragging');
        draggedElement = null;
    }
    /**
     * 이미지 제거 핸들러
     */
    function handleRemoveImage(e) {
        var utils = getUtils();
        var button = e.currentTarget;
        var imageId = button.dataset.imageId;
        if (imageId) {
            var index = imageMappings.findIndex(function (m) { return m.id === imageId; });
            if (index !== -1) {
                var removed = imageMappings.splice(index, 1)[0];
                utils.logInfo("\uC774\uBBF8\uC9C0 \uC81C\uAC70\uB428: ".concat(removed.fileName));
                // 성능 최적화: 전체 재렌더링 대신 해당 요소만 삭제
                var queueDiv = document.getElementById('image-queue');
                var previewDiv = document.getElementById('image-preview-thumbnails');
                // 큐에서 DOM 요소 삭제
                if (queueDiv) {
                    var queueElement = queueDiv.querySelector("[data-image-id=\"".concat(imageId, "\"]"));
                    if (queueElement) {
                        queueElement.remove();
                    }
                    // 빈 상태 메시지 표시
                    if (imageMappings.length === 0) {
                        queueDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">이미지를 추가하세요</div>';
                    }
                    else {
                        // 삭제된 위치 이후의 캡션 범위 업데이트
                        updateCaptionRanges(index);
                    }
                }
                // 미리보기에서 DOM 요소 삭제
                if (previewDiv) {
                    var previewElement = previewDiv.querySelector("[data-image-id=\"".concat(imageId, "\"]"));
                    if (previewElement) {
                        previewElement.remove();
                    }
                }
                // 요약 정보 업데이트
                updateImageSummary();
                // 동기화 버튼 상태 업데이트
                var syncButton = document.getElementById('sync-caption-images');
                if (syncButton) {
                    syncButton.disabled = imageMappings.length === 0;
                }
            }
        }
    }
    /**
     * 미리보기 드래그 앤 드롭 핸들러 (순서 변경)
     */
    var previewDraggedElement = null;
    function handlePreviewDragStart(e) {
        var target = e.currentTarget;
        previewDraggedElement = target;
        target.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'internal-reorder');
        }
    }
    function handlePreviewDragOver(e) {
        e.preventDefault();
        var target = e.currentTarget;
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        if (previewDraggedElement && previewDraggedElement !== target) {
            target.classList.add('drag-over-preview');
        }
    }
    function handlePreviewDrop(e) {
        var _a, _b, _c, _d;
        e.preventDefault();
        var target = e.currentTarget;
        target.classList.remove('drag-over-preview');
        if (previewDraggedElement && previewDraggedElement !== target) {
            var draggedId_2 = previewDraggedElement.dataset.imageId;
            var targetId_2 = target.dataset.imageId;
            if (draggedId_2 && targetId_2) {
                var draggedIndex = imageMappings.findIndex(function (m) { return m.id === draggedId_2; });
                var targetIndex = imageMappings.findIndex(function (m) { return m.id === targetId_2; });
                if (draggedIndex !== -1 && targetIndex !== -1) {
                    var draggedItem = imageMappings.splice(draggedIndex, 1)[0];
                    imageMappings.splice(targetIndex, 0, draggedItem);
                    // 성능 최적화: 전체 재렌더링 대신 DOM 요소만 이동
                    var previewDiv = document.getElementById('image-preview-thumbnails');
                    var queueDiv = document.getElementById('image-queue');
                    if (previewDiv && queueDiv) {
                        // 미리보기 패널: DOM 요소 이동
                        if (draggedIndex < targetIndex) {
                            (_a = target.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(previewDraggedElement, target.nextSibling);
                        }
                        else {
                            (_b = target.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(previewDraggedElement, target);
                        }
                        // 큐 패널: 해당하는 DOM 요소도 이동
                        var queueDraggedElement = queueDiv.querySelector("[data-image-id=\"".concat(draggedId_2, "\"]"));
                        var queueTargetElement = queueDiv.querySelector("[data-image-id=\"".concat(targetId_2, "\"]"));
                        if (queueDraggedElement && queueTargetElement) {
                            if (draggedIndex < targetIndex) {
                                (_c = queueTargetElement.parentNode) === null || _c === void 0 ? void 0 : _c.insertBefore(queueDraggedElement, queueTargetElement.nextSibling);
                            }
                            else {
                                (_d = queueTargetElement.parentNode) === null || _d === void 0 ? void 0 : _d.insertBefore(queueDraggedElement, queueTargetElement);
                            }
                        }
                        // 영향받는 이미지들의 캡션 범위만 업데이트
                        var minIndex = Math.min(draggedIndex, targetIndex);
                        updateCaptionRanges(minIndex);
                    }
                }
            }
        }
    }
    function handlePreviewDragEnd(e) {
        var target = e.currentTarget;
        target.classList.remove('dragging');
        // 모든 drag-over 스타일 제거
        document.querySelectorAll('.drag-over-preview').forEach(function (el) {
            el.classList.remove('drag-over-preview');
        });
        previewDraggedElement = null;
    }
    /**
     * 미리보기 캡션 개수 클릭 핸들러 (드롭다운으로 변경)
     */
    function handlePreviewCaptionClick(e) {
        e.stopPropagation();
        var captionDiv = e.currentTarget;
        var imageId = captionDiv.dataset.imageId;
        var currentValue = parseInt(captionDiv.textContent || '1', 10);
        // 드롭다운으로 교체
        var select = document.createElement('select');
        select.className = 'preview-caption-select select-modern';
        select.dataset.imageId = imageId || '';
        // 옵션 추가 (1~10)
        for (var i = 1; i <= 10; i++) {
            var option = document.createElement('option');
            option.value = String(i);
            option.textContent = "".concat(i, "\uAC1C");
            if (i === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        }
        // 부모에서 캡션 div 제거하고 select 추가
        var wrapper = captionDiv.parentElement;
        if (wrapper) {
            wrapper.removeChild(captionDiv);
            wrapper.appendChild(select);
            // 클릭 이벤트 전파 방지 (부모 이미지의 클릭 애니메이션 방지)
            select.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            // mousedown 이벤트 전파 방지
            select.addEventListener('mousedown', function (e) {
                e.stopPropagation();
            });
            select.focus();
            // 드롭다운 자동으로 열기
            setTimeout(function () {
                var event = new MouseEvent('mousedown', {
                    bubbles: false, // 부모로 전파되지 않도록
                    cancelable: true,
                    view: window
                });
                select.dispatchEvent(event);
            }, 10);
            // 선택 변경 시 즉시 저장
            var saveValue = function () {
                var newValue = parseInt(select.value, 10);
                if (imageId && newValue > 0) {
                    var index = imageMappings.findIndex(function (m) { return m.id === imageId; });
                    if (index !== -1) {
                        imageMappings[index].captionCount = newValue;
                        updateImageSummary();
                        updateCaptionRanges(index);
                    }
                }
            };
            select.addEventListener('change', saveValue);
            select.addEventListener('blur', function () {
                // blur 시 원래 div로 복원
                updateImageSummary();
            });
        }
    }
    /**
     * 캡션 개수 변경 핸들러
     */
    function handleCaptionCountChange(e) {
        var input = e.currentTarget;
        var imageId = input.dataset.imageId;
        var value = parseInt(input.value, 10);
        if (imageId && value > 0) {
            var index = imageMappings.findIndex(function (m) { return m.id === imageId; });
            if (index !== -1) {
                var mapping = imageMappings[index];
                mapping.captionCount = value;
                // 성능 최적화: 전체 재렌더링 대신 영향받는 캡션 범위만 업데이트
                updateCaptionRanges(index);
            }
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
     * Base64 이미지를 프로젝트 폴더에 파일로 저장 (Node.js fs 사용 - 매우 빠름!)
     * @param base64Data Base64 인코딩된 이미지 데이터
     * @param fileName 파일명
     * @returns 저장된 파일의 전체 경로를 반환하는 Promise
     */
    function saveBase64ToProjectFolder(base64Data, fileName) {
        var utils = getUtils();
        var communication = getCommunication();
        return new Promise(function (resolve) {
            try {
                utils.logInfo('=== saveBase64ToProjectFolder (Node.js) 시작 ===');
                utils.logInfo("\uD30C\uC77C\uBA85: ".concat(fileName));
                utils.logInfo("base64Data \uAE38\uC774: ".concat(base64Data ? base64Data.length : 'undefined'));
                if (!base64Data) {
                    utils.logError('base64Data가 없습니다!');
                    resolve(null);
                    return;
                }
                // 먼저 JSX에서 프로젝트 경로를 가져옴
                communication.callExtendScript('getProjectPath()', function (response) {
                    try {
                        var projectInfo = JSON.parse(response);
                        if (!projectInfo.success) {
                            utils.logError("\uD504\uB85C\uC81D\uD2B8 \uACBD\uB85C \uAC00\uC838\uC624\uAE30 \uC2E4\uD328: ".concat(projectInfo.message));
                            resolve(null);
                            return;
                        }
                        var projectPath = projectInfo.path;
                        utils.logInfo("\uD504\uB85C\uC81D\uD2B8 \uACBD\uB85C: ".concat(projectPath));
                        // Node.js fs 모듈 사용 (CEP 내장)
                        var fs = window.require('fs');
                        var path = window.require('path');
                        // 프로젝트 폴더에서 디렉토리 부분만 추출 (.prproj 파일 제거)
                        var projectDir = path.dirname(projectPath);
                        utils.logInfo("\uD504\uB85C\uC81D\uD2B8 \uB514\uB809\uD1A0\uB9AC: ".concat(projectDir));
                        // caption-images 폴더 경로
                        var targetDir = path.join(projectDir, 'caption-images');
                        utils.logInfo("\uC800\uC7A5 \uD3F4\uB354: ".concat(targetDir));
                        // 폴더 생성 (없으면)
                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                            utils.logInfo("\uD3F4\uB354 \uC0DD\uC131\uB428: ".concat(targetDir));
                        }
                        // 파일 경로
                        var filePath = path.join(targetDir, fileName);
                        utils.logInfo("\uD30C\uC77C \uACBD\uB85C: ".concat(filePath));
                        // Base64를 Buffer로 변환 (빠름!)
                        var buffer = Buffer.from(base64Data, 'base64');
                        utils.logInfo("Buffer \uC0DD\uC131\uB428: ".concat(buffer.length, " bytes"));
                        // 파일 쓰기 (매우 빠름!)
                        fs.writeFileSync(filePath, buffer);
                        utils.logInfo("\u2713 \uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC131\uACF5: ".concat(filePath));
                        // 파일 존재 확인
                        if (fs.existsSync(filePath)) {
                            var stats = fs.statSync(filePath);
                            utils.logInfo("\uD30C\uC77C \uD06C\uAE30 \uD655\uC778: ".concat(stats.size, " bytes"));
                            resolve(filePath);
                        }
                        else {
                            utils.logError('파일이 생성되지 않음');
                            resolve(null);
                        }
                    }
                    catch (e) {
                        utils.logError('Base64 저장 중 예외 발생');
                        utils.logError("\uC608\uC678 \uD0C0\uC785: ".concat(typeof e));
                        if (e instanceof Error) {
                            utils.logError("Error \uBA54\uC2DC\uC9C0: ".concat(e.message));
                            utils.logError("Error \uC2A4\uD0DD: ".concat(e.stack || 'no stack'));
                        }
                        resolve(null);
                    }
                });
            }
            catch (e) {
                utils.logError('saveBase64ToProjectFolder 외부 예외 발생');
                if (e instanceof Error) {
                    utils.logError("Error \uBA54\uC2DC\uC9C0: ".concat(e.message));
                    utils.logError("Error \uC2A4\uD0DD: ".concat(e.stack || 'no stack'));
                }
                resolve(null);
            }
        });
    }
    /**
     * 드래그 앤 드롭 설정
     */
    function setupDragAndDrop(dropZone) {
        var _this = this;
        var utils = getUtils();
        dropZone.addEventListener('dragenter', function (e) {
            var _a;
            // 내부 요소 드래그인지 확인 (text/plain 타입이 있으면 내부 드래그)
            if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.types.includes('text/plain')) {
                return; // 내부 요소 드래그는 처리하지 않음
            }
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragover', function (e) {
            var _a;
            // 내부 요소 드래그인지 확인 (text/plain 타입이 있으면 내부 드래그)
            if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.types.includes('text/plain')) {
                return; // 내부 요소 드래그는 처리하지 않음
            }
            e.preventDefault();
            e.stopPropagation();
        });
        dropZone.addEventListener('dragleave', function (e) {
            var _a;
            // 내부 요소 드래그인지 확인 (text/plain 타입이 있으면 내부 드래그)
            if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.types.includes('text/plain')) {
                return; // 내부 요소 드래그는 처리하지 않음
            }
            e.preventDefault();
            e.stopPropagation();
            // 자식 요소로의 이동은 무시
            if (e.target === dropZone) {
                dropZone.classList.remove('drag-over');
            }
        });
        dropZone.addEventListener('drop', function (e) { return __awaiter(_this, void 0, void 0, function () {
            var dragData, files, _loop_1, i;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        dragData = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
                        if (dragData === 'internal-reorder') {
                            return [2 /*return*/]; // 내부 요소 드래그는 처리하지 않음
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        dropZone.classList.remove('drag-over');
                        files = (_b = e.dataTransfer) === null || _b === void 0 ? void 0 : _b.files;
                        if (!files || files.length === 0) {
                            utils.logWarn('드롭된 파일이 없습니다');
                            return [2 /*return*/];
                        }
                        utils.logInfo("".concat(files.length, "\uAC1C \uD30C\uC77C \uB4DC\uB86D\uB428"));
                        _loop_1 = function (i) {
                            var file, base64, originalName, savedPath, e_3;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        file = files[i];
                                        // 이미지 파일인지 확인
                                        if (!file.type.startsWith('image/')) {
                                            utils.logWarn("\uC774\uBBF8\uC9C0\uAC00 \uC544\uB2CC \uD30C\uC77C \uBB34\uC2DC: ".concat(file.name, " (").concat(file.type, ")"));
                                            return [2 /*return*/, "continue"];
                                        }
                                        utils.logInfo("\uC774\uBBF8\uC9C0 \uD30C\uC77C \uCC98\uB9AC \uC911: ".concat(file.name, " (").concat(file.type, ")"));
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 7, , 8]);
                                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                var reader = new FileReader();
                                                reader.onloadend = function () {
                                                    var resultStr = reader.result;
                                                    if (!resultStr) {
                                                        reject(new Error('빈 결과'));
                                                        return;
                                                    }
                                                    var parts = resultStr.split(',');
                                                    var base64Data = parts[1];
                                                    if (!base64Data) {
                                                        reject(new Error('Base64 추출 실패'));
                                                        return;
                                                    }
                                                    resolve(base64Data);
                                                };
                                                reader.onerror = function () { return reject(reader.error); };
                                                reader.readAsDataURL(file);
                                            })];
                                    case 2:
                                        base64 = _d.sent();
                                        originalName = file.name;
                                        return [4 /*yield*/, saveBase64ToProjectFolder(base64, originalName)];
                                    case 3:
                                        savedPath = _d.sent();
                                        if (!savedPath) return [3 /*break*/, 5];
                                        // 큐에 추가
                                        return [4 /*yield*/, addImageToQueue(savedPath, originalName, base64)];
                                    case 4:
                                        // 큐에 추가
                                        _d.sent();
                                        utils.logInfo("\uC774\uBBF8\uC9C0 \uCD94\uAC00 \uC131\uACF5: ".concat(originalName));
                                        return [3 /*break*/, 6];
                                    case 5:
                                        utils.logError("\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC2E4\uD328: ".concat(originalName));
                                        _d.label = 6;
                                    case 6: return [3 /*break*/, 8];
                                    case 7:
                                        e_3 = _d.sent();
                                        utils.logError("\uD30C\uC77C \uCC98\uB9AC \uC911 \uC624\uB958: ".concat(file.name), e_3);
                                        return [3 /*break*/, 8];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(i < files.length)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    }
    /**
     * Paste 이벤트 핸들러 (Ctrl+V)
     * navigator.clipboard.read()와 달리 paste 이벤트는 작동할 수 있음!
     */
    function handlePasteEvent(event) {
        var _this = this;
        var utils = getUtils();
        var resultDiv = document.getElementById('sync-test-result');
        try {
            utils.logInfo('Paste 이벤트 감지됨');
            // 클립보드 데이터 확인
            var clipboardData = event.clipboardData;
            if (!clipboardData) {
                utils.logWarn('clipboardData가 없습니다');
                return;
            }
            utils.logInfo("\uD074\uB9BD\uBCF4\uB4DC \uC544\uC774\uD15C \uC218: ".concat(clipboardData.items.length));
            utils.logInfo("\uD074\uB9BD\uBCF4\uB4DC \uD0C0\uC785: ".concat(clipboardData.types.join(', ')));
            // 이미지 찾기
            var imageFound = false;
            var _loop_2 = function (i) {
                var item = clipboardData.items[i];
                utils.logInfo("\uC544\uC774\uD15C[".concat(i, "]: kind=").concat(item.kind, ", type=").concat(item.type));
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    var file_1 = item.getAsFile();
                    if (file_1) {
                        utils.logInfo("\u2713 \uC774\uBBF8\uC9C0 \uD30C\uC77C \uBC1C\uACAC: ".concat(file_1.name, ", \uD06C\uAE30: ").concat(file_1.size, " bytes, \uD0C0\uC785: ").concat(file_1.type));
                        // FileReader로 Base64 변환
                        var reader_1 = new FileReader();
                        reader_1.onloadend = function () { return __awaiter(_this, void 0, void 0, function () {
                            var resultStr, parts, base64, extension, fileName, savedPath, e_4;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 5, , 6]);
                                        utils.logInfo('FileReader.onloadend 시작');
                                        utils.logInfo("reader.result \uD0C0\uC785: ".concat(typeof reader_1.result));
                                        utils.logInfo("reader.result \uAE38\uC774: ".concat(reader_1.result ? reader_1.result.length : 'null'));
                                        utils.logInfo("reader.result \uC0D8\uD50C: ".concat(reader_1.result ? reader_1.result.substring(0, 100) : 'null'));
                                        resultStr = reader_1.result;
                                        if (!resultStr) {
                                            utils.logError('reader.result가 비어있습니다');
                                            if (resultDiv)
                                                resultDiv.textContent = '✗ 이미지 읽기 실패 (빈 결과)';
                                            return [2 /*return*/];
                                        }
                                        parts = resultStr.split(',');
                                        utils.logInfo("split \uACB0\uACFC \uAC1C\uC218: ".concat(parts.length));
                                        base64 = parts[1];
                                        if (!base64) {
                                            utils.logError('Base64 데이터를 추출할 수 없습니다');
                                            if (resultDiv)
                                                resultDiv.textContent = '✗ Base64 추출 실패';
                                            return [2 /*return*/];
                                        }
                                        utils.logInfo("Base64 \uAE38\uC774: ".concat(base64.length));
                                        // 고유한 파일명 생성 (순서대로 번호 매기기)
                                        // 클립보드 이미지는 file.name이 항상 "image.png"로 같으므로 항상 고유 이름 생성
                                        imageCounter++;
                                        extension = 'png';
                                        if (file_1.type === 'image/jpeg' || file_1.type === 'image/jpg') {
                                            extension = 'jpg';
                                        }
                                        else if (file_1.type === 'image/png') {
                                            extension = 'png';
                                        }
                                        else if (file_1.type === 'image/gif') {
                                            extension = 'gif';
                                        }
                                        else if (file_1.type === 'image/webp') {
                                            extension = 'webp';
                                        }
                                        fileName = "image-".concat(imageCounter, ".").concat(extension);
                                        utils.logInfo("\uC6D0\uBCF8 \uD30C\uC77C\uBA85: ".concat(file_1.name, ", MIME: ").concat(file_1.type, ", \uC0DD\uC131\uB41C \uD30C\uC77C\uBA85: ").concat(fileName));
                                        // 로딩 표시
                                        if (resultDiv) {
                                            resultDiv.textContent = "\u23F3 \uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC911... (".concat(fileName, ")");
                                        }
                                        // Base64를 프로젝트 폴더에 파일로 저장 (비동기)
                                        utils.logInfo('saveBase64ToProjectFolder 호출 직전');
                                        return [4 /*yield*/, saveBase64ToProjectFolder(base64, fileName)];
                                    case 1:
                                        savedPath = _a.sent();
                                        utils.logInfo("saveBase64ToProjectFolder \uC644\uB8CC, \uACB0\uACFC: ".concat(savedPath));
                                        if (!savedPath) return [3 /*break*/, 3];
                                        // 저장된 파일 경로와 Base64 썸네일을 큐에 추가
                                        return [4 /*yield*/, addImageToQueue(savedPath, fileName, base64)];
                                    case 2:
                                        // 저장된 파일 경로와 Base64 썸네일을 큐에 추가
                                        _a.sent();
                                        if (resultDiv) {
                                            resultDiv.textContent = "\u2713 \uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC644\uB8CC: ".concat(fileName);
                                        }
                                        utils.logInfo("\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uBC0F \uD050\uC5D0 \uCD94\uAC00\uB428: ".concat(savedPath));
                                        return [3 /*break*/, 4];
                                    case 3:
                                        if (resultDiv) {
                                            resultDiv.textContent = "\u2717 \uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC2E4\uD328: ".concat(fileName);
                                        }
                                        utils.logError("\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC2E4\uD328: ".concat(fileName));
                                        _a.label = 4;
                                    case 4: return [3 /*break*/, 6];
                                    case 5:
                                        e_4 = _a.sent();
                                        utils.logError('FileReader.onloadend 예외:', e_4);
                                        utils.logError('예외 타입:', typeof e_4);
                                        utils.logError('예외 문자열:', String(e_4));
                                        if (e_4 instanceof Error) {
                                            utils.logError('예외 메시지:', e_4.message);
                                            utils.logError('예외 스택:', e_4.stack);
                                        }
                                        return [3 /*break*/, 6];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); };
                        reader_1.onerror = function () {
                            utils.logError('FileReader 오류:', reader_1.error);
                            if (resultDiv) {
                                resultDiv.textContent = '✗ 이미지 읽기 실패';
                            }
                        };
                        reader_1.readAsDataURL(file_1);
                        imageFound = true;
                        event.preventDefault(); // 기본 붙여넣기 동작 방지
                        return "break";
                    }
                }
            };
            for (var i = 0; i < clipboardData.items.length; i++) {
                var state_1 = _loop_2(i);
                if (state_1 === "break")
                    break;
            }
            if (!imageFound) {
                utils.logInfo('클립보드에 이미지가 없습니다 (텍스트나 다른 형식)');
            }
        }
        catch (error) {
            var err = error;
            utils.logError('Paste 이벤트 오류:', err.message);
            if (resultDiv) {
                resultDiv.textContent = "\u2717 \uBD99\uC5EC\uB123\uAE30 \uC624\uB958: ".concat(err.message);
            }
        }
    }
    /**
     * 이미지 파일 찾기
     */
    function browseImagesForSync() {
        var _this = this;
        var utils = getUtils();
        var communication = getCommunication();
        var resultDiv = document.getElementById('sync-test-result');
        if (resultDiv)
            resultDiv.textContent = '이미지 선택 중...';
        // JSX에서 파일 선택 다이얼로그 열기
        var script = "\n            var files = File.openDialog(\"\uC774\uBBF8\uC9C0 \uD30C\uC77C \uC120\uD0DD\", \"Image Files:*.png;*.jpg;*.jpeg\", true);\n            if (files) {\n                var result = [];\n                if (files instanceof Array) {\n                    for (var i = 0; i < files.length; i++) {\n                        result.push(files[i].fsName);\n                    }\n                } else {\n                    result.push(files.fsName);\n                }\n                JSON.stringify({ success: true, files: result });\n            } else {\n                JSON.stringify({ success: false, message: \"\uCDE8\uC18C\uB428\" });\n            }\n        ";
        communication.callExtendScript(script, function (result) { return __awaiter(_this, void 0, void 0, function () {
            var data, addPromises, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        data = JSON.parse(result);
                        if (!(data.success && data.files)) return [3 /*break*/, 2];
                        addPromises = data.files.map(function (filePath) {
                            var _a;
                            var fileName = ((_a = filePath.split('\\').pop()) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || 'image.png';
                            return addImageToQueue(filePath, fileName);
                        });
                        return [4 /*yield*/, Promise.all(addPromises)];
                    case 1:
                        _a.sent();
                        if (resultDiv)
                            resultDiv.textContent = "\u2713 ".concat(data.files.length, "\uAC1C \uC774\uBBF8\uC9C0 \uCD94\uAC00\uB428");
                        return [3 /*break*/, 3];
                    case 2:
                        if (resultDiv)
                            resultDiv.textContent = '이미지 선택 취소됨';
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        e_5 = _a.sent();
                        if (resultDiv)
                            resultDiv.textContent = '✗ 이미지 선택 실패';
                        utils.logError('Failed to browse images:', e_5.message);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    }
    /**
     * 이미지를 리사이즈하여 썸네일 생성 (성능 최적화)
     * @param source 이미지 파일 경로 또는 Base64 문자열
     * @param maxSize 최대 크기 (기본 160px)
     * @returns Base64 썸네일 또는 빈 문자열
     */
    function createThumbnail(source, maxSize) {
        if (maxSize === void 0) { maxSize = 160; }
        return new Promise(function (resolve) {
            try {
                var base64_1;
                // source가 파일 경로인지 Base64인지 판단
                if (source.includes(':') && (source.includes('\\') || source.includes('/'))) {
                    // 파일 경로
                    var fs = window.require('fs');
                    var fileData = fs.readFileSync(source);
                    base64_1 = fileData.toString('base64');
                }
                else {
                    // 이미 Base64
                    base64_1 = source;
                }
                // 임시 Image 객체 생성
                var img_1 = new Image();
                img_1.src = "data:image/png;base64,".concat(base64_1);
                img_1.onload = function () {
                    // Canvas 생성
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(base64_1); // 실패 시 원본 반환
                        return;
                    }
                    // 비율 유지하며 리사이즈
                    var width = img_1.width;
                    var height = img_1.height;
                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    // 이미지 그리기
                    ctx.drawImage(img_1, 0, 0, width, height);
                    // Base64로 변환 (JPEG, 품질 80%)
                    var resizedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                    resolve(resizedBase64);
                };
                img_1.onerror = function () {
                    resolve(base64_1); // 실패 시 원본 반환
                };
            }
            catch (e) {
                resolve(''); // 에러 시 빈 문자열
            }
        });
    }
    /**
     * 이미지를 큐에 추가
     */
    /**
     * 이미지를 큐에 추가 (썸네일 생성 포함)
     * @param filePath 저장된 파일 경로
     * @param fileName 파일명
     * @param thumbnailBase64 썸네일 Base64 (선택, 없으면 filePath에서 읽음)
     */
    function addImageToQueue(filePath, fileName, thumbnailBase64) {
        return __awaiter(this, void 0, void 0, function () {
            var utils, id, thumbnail, e_6, mapping, syncButton;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils = getUtils();
                        id = "img-".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 9));
                        thumbnail = '';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!thumbnailBase64) return [3 /*break*/, 3];
                        return [4 /*yield*/, createThumbnail(thumbnailBase64, 160)];
                    case 2:
                        // Base64가 제공된 경우 리사이즈
                        thumbnail = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, createThumbnail(filePath, 160)];
                    case 4:
                        // 파일 경로에서 리사이즈된 썸네일 생성
                        thumbnail = _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_6 = _a.sent();
                        utils.logError("\uC378\uB124\uC77C \uC0DD\uC131 \uC2E4\uD328: ".concat(e_6.message));
                        thumbnail = ''; // 실패 시 빈 문자열
                        return [3 /*break*/, 7];
                    case 7:
                        mapping = {
                            id: id,
                            filePath: filePath,
                            fileName: fileName,
                            thumbnail: thumbnail,
                            captionCount: 1 // 기본값: 캡션 1개
                        };
                        imageMappings.push(mapping);
                        utils.logInfo("\uC774\uBBF8\uC9C0 \uCD94\uAC00\uB428: ".concat(fileName, " (ID: ").concat(id, ")"));
                        // 성능 최적화: 전체 재렌더링 대신 새 이미지만 추가
                        addSingleImageToDOM(mapping, imageMappings.length - 1);
                        updateImageSummary();
                        syncButton = document.getElementById('sync-caption-images');
                        if (syncButton) {
                            syncButton.disabled = false;
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**
     * 이미지 큐 비우기
     */
    function clearImageQueue() {
        var utils = getUtils();
        var imageCount = imageMappings.length;
        if (imageCount === 0) {
            utils.logInfo('Image queue is already empty');
            return;
        }
        // imageMappings 비우기
        imageMappings = [];
        // 큐 다시 렌더링
        renderImageQueue();
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
            var utils, communication, resultDiv, debugInfo, selectedMethod, targetTrack, scriptCall;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                utils = getUtils();
                communication = getCommunication();
                resultDiv = document.getElementById('sync-test-result');
                debugInfo = "=== 캡션-이미지 동기화 디버그 ===\n";
                debugInfo += "\uC2DC\uC791 \uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                // imageMappings 배열 사용 (DOM 대신)
                if (!imageMappings || imageMappings.length === 0) {
                    if (resultDiv)
                        resultDiv.textContent = '✗ 이미지를 먼저 추가하세요';
                    debugInfo += "ERROR: 이미지가 선택되지 않음\n";
                    window.lastDebugInfo = debugInfo;
                    return [2 /*return*/];
                }
                selectedMethod = (_a = document.querySelector('input[name="sync-method"]:checked')) === null || _a === void 0 ? void 0 : _a.value;
                targetTrack = parseInt(((_b = document.getElementById('target-video-track')) === null || _b === void 0 ? void 0 : _b.value) || '0');
                debugInfo += "\uB3D9\uAE30\uD654 \uBC29\uBC95: ".concat(selectedMethod, "\n");
                debugInfo += "\uB300\uC0C1 \uBE44\uB514\uC624 \uD2B8\uB799: V".concat(targetTrack + 1, "\n");
                debugInfo += "\uC774\uBBF8\uC9C0 \uAC1C\uC218: ".concat(imageMappings.length, "\n\n");
                if (resultDiv)
                    resultDiv.textContent = '동기화 중...';
                utils.logInfo('Starting caption-image sync:', { method: selectedMethod, track: targetTrack });
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
                    var positionData, positions, successCount_1, syncDebugMsg, cumulativeCaptionIndex, _loop_3, i, e_7;
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
                                debugInfo += "\uB8E8\uD504 \uBC18\uBCF5 \uD69F\uC218: ".concat(imageMappings.length, "\uBC88\n\n");
                                syncDebugMsg = "\uCD1D \uC774\uBBF8\uC9C0: ".concat(imageMappings.length, ", \uCD1D \uC704\uCE58: ").concat(positions.length);
                                utils.logInfo(syncDebugMsg);
                                console.log("[SYNC] ".concat(syncDebugMsg));
                                cumulativeCaptionIndex = 0;
                                _loop_3 = function (i) {
                                    var mapping, imagePath, firstPositionIndex, lastPositionIndex, captionStart, captionEnd, firstPosition, lastPosition, startTime, endTime, escapedPath, insertScript;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                debugInfo += "\n===== \uB8E8\uD504 ".concat(i + 1, "/").concat(imageMappings.length, " =====\n");
                                                mapping = imageMappings[i];
                                                imagePath = mapping.filePath;
                                                firstPositionIndex = cumulativeCaptionIndex;
                                                lastPositionIndex = cumulativeCaptionIndex + mapping.captionCount - 1;
                                                captionStart = cumulativeCaptionIndex + 1;
                                                captionEnd = cumulativeCaptionIndex + mapping.captionCount;
                                                debugInfo += "\uCEA1\uC158 \uAC1C\uC218: ".concat(mapping.captionCount, "\uAC1C (\uBC94\uC704: ").concat(captionStart, "-").concat(captionEnd, ")\n");
                                                // 다음 이미지를 위해 누적 카운터 업데이트
                                                cumulativeCaptionIndex += mapping.captionCount;
                                                firstPosition = positions[firstPositionIndex];
                                                lastPosition = positions[lastPositionIndex];
                                                debugInfo += "\uC774\uBBF8\uC9C0 \uC778\uB371\uC2A4: ".concat(i, "\n");
                                                debugInfo += "\uCCAB \uCEA1\uC158 \uC778\uB371\uC2A4: ".concat(firstPositionIndex, "\n");
                                                debugInfo += "\uB9C8\uC9C0\uB9C9 \uCEA1\uC158 \uC778\uB371\uC2A4: ".concat(lastPositionIndex, "\n");
                                                debugInfo += "\uC774\uBBF8\uC9C0 \uD30C\uC77C: ".concat(mapping.fileName, "\n");
                                                if (!firstPosition || !lastPosition) {
                                                    debugInfo += "ERROR: \uC704\uCE58 \uC815\uBCF4\uAC00 \uC5C6\uC74C (\uCCAB \uCEA1\uC158: ".concat(firstPositionIndex, ", \uB9C8\uC9C0\uB9C9 \uCEA1\uC158: ").concat(lastPositionIndex, ")\n");
                                                    utils.logWarn("[".concat(i, "] \uC704\uCE58 \uC815\uBCF4\uAC00 \uC5C6\uC74C (\uCCAB \uCEA1\uC158: ").concat(firstPositionIndex, ", \uB9C8\uC9C0\uB9C9 \uCEA1\uC158: ").concat(lastPositionIndex, ")"));
                                                    return [2 /*return*/, "continue"];
                                                }
                                                startTime = firstPosition.start;
                                                endTime = lastPosition.end;
                                                debugInfo += "\uC704\uCE58: ".concat(startTime, "s ~ ").concat(endTime, "s (\uAE38\uC774: ").concat((endTime - startTime).toFixed(2), "s)\n");
                                                // 파일 경로 처리
                                                debugInfo += "\uD30C\uC77C \uACBD\uB85C: ".concat(imagePath, "\n");
                                                escapedPath = imagePath.replace(/\\/g, '\\\\');
                                                debugInfo += "\uC774\uC2A4\uCF00\uC774\uD504\uB41C \uACBD\uB85C: ".concat(escapedPath, "\n");
                                                insertScript = "insertImageAtTime(\"".concat(escapedPath, "\", ").concat(targetTrack, ", ").concat(startTime, ", ").concat(endTime, ")");
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
                                if (!(i < imageMappings.length)) return [3 /*break*/, 4];
                                return [5 /*yield**/, _loop_3(i)];
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
                                e_7 = _a.sent();
                                debugInfo += "\nERROR: ".concat(e_7.message, "\n");
                                debugInfo += "Stack: ".concat(e_7.stack, "\n");
                                window.lastDebugInfo = debugInfo;
                                if (resultDiv)
                                    resultDiv.textContent = '✗ 동기화 실패';
                                utils.logError('Failed to sync caption-images:', e_7.message);
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