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
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var uiService = null;
    var stateService = null;
    var communicationService = null;
    var soundEngineService = null;
    var clipCalculatorService = null;
    function initializeDIDependencies() {
        try {
            diContainer = window.DI;
            if (diContainer) {
                // DI에서 서비스 가져오기 시도
                utilsService = diContainer.getSafe('JSCUtils');
                uiService = diContainer.getSafe('JSCUIManager');
                stateService = diContainer.getSafe('JSCStateManager');
                communicationService = diContainer.getSafe('JSCCommunication');
                soundEngineService = diContainer.getSafe('SoundEngine');
                clipCalculatorService = diContainer.getSafe('ClipTimeCalculator');
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
            if (!utilsService || !uiService || !stateService || !communicationService || !soundEngineService || !clipCalculatorService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils() {
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
        return utilsService || window.JSCUtils || fallback;
    }
    function getUIManager() {
        var utils = getUtils();
        return uiService || window.JSCUIManager || {
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
        return stateService || window.JSCStateManager || {
            saveFolderPath: function (_path) { console.log('Save folder path'); },
            getCurrentFolderPath: function () { return ''; },
            clearFolderPath: function () { console.log('Clear folder path'); },
            validateState: function () { return { isValid: true, errors: [] }; },
            getSettings: function () { return { folderPath: '', audioTrack: 1 }; }
        };
    }
    function getCommunication() {
        return communicationService || window.JSCCommunication || {
            callExtendScript: function (_script, callback) {
                callback('error: Communication service not available');
            }
        };
    }
    function getSoundEngine() {
        return soundEngineService || window.SoundEngine || {
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
                    if (!soundEngine || (!soundEngineService && !window.SoundEngine)) {
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
                    debugInfo += "ClipTimeCalculator: ".concat((clipCalculatorService || window.ClipTimeCalculator) ? "✅" : "❌", "\n");
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
    // 새로고침 처리
    function refreshSoundButtons() {
        var stateManager = getStateManager();
        var utils = getUtils();
        var uiManager = getUIManager();
        var communication = getCommunication();
        var currentPath = stateManager.getCurrentFolderPath();
        utils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);
        if (currentPath && utils.isValidPath(currentPath)) {
            uiManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
            uiManager.updateStatus("'" + utils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...", true);
            var pathArg_1 = JSON.stringify(currentPath);
            utils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg_1);
            communication.callExtendScript("getFilesForPathCS(" + pathArg_1 + ")", function (result) {
                utils.debugLog("refreshSoundButtons: evalScript callback result: " + result);
                // 디버그 정보 생성
                var debugInfo = "=== Refresh Sound Buttons Debug ===\n";
                debugInfo += "시간: " + new Date().toISOString() + "\n";
                debugInfo += "폴더 경로: " + currentPath + "\n";
                debugInfo += "JSX 결과: " + result + "\n";
                debugInfo += "결과 타입: " + typeof result + "\n";
                if (typeof result === "string" && result.indexOf("error:") === 0) {
                    debugInfo += "오류 발생: " + result.substring(6) + "\n";
                    uiManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다: " + result.substring(6), false);
                }
                else if (result === "success") {
                    debugInfo += "성공적으로 완료됨\n";
                    debugInfo += "콜백 방식으로 파일 목록 가져오기 시도...\n";
                    // 콜백 방식으로 직접 파일 목록 가져오기
                    communication.callExtendScript("getFilesForPathWithCallback(" + pathArg_1 + ")", function (callbackResult) {
                        debugInfo += "콜백 결과: " + callbackResult + "\n";
                        try {
                            var parsedResult = utils.safeJSONParse(callbackResult);
                            if (parsedResult && parsedResult.success && parsedResult.soundFiles) {
                                debugInfo += "파일 " + parsedResult.soundFiles.length + "개 발견\n";
                                uiManager.updateSoundButtons(parsedResult.soundFiles, parsedResult.folderPath);
                                uiManager.updateStatus("폴더 새로고침이 완료되었습니다. " + parsedResult.soundFiles.length + "개 파일 발견.", true);
                            }
                            else {
                                debugInfo += "파일 목록 처리 실패\n";
                                uiManager.updateStatus("파일 목록을 가져올 수 없습니다.", false);
                            }
                        }
                        catch (parseError) {
                            debugInfo += "JSON 파싱 오류: " + parseError.message + "\n";
                            uiManager.updateStatus("파일 목록 데이터 처리 중 오류가 발생했습니다.", false);
                        }
                        window.lastDebugInfo = debugInfo;
                        uiManager.toggleDebugButton(true);
                    });
                }
                else {
                    debugInfo += "예상치 못한 결과: " + result + "\n";
                    uiManager.updateStatus("폴더 새로고침 결과를 처리하는 중입니다...", true);
                }
                // 디버그 정보 저장
                window.lastDebugInfo = debugInfo;
                uiManager.toggleDebugButton(true);
            });
        }
        else {
            if (currentPath && !utils.isValidPath(currentPath)) {
                utils.logWarn("currentFolderPath is invalid, clearing it: " + currentPath);
                stateManager.clearFolderPath();
                uiManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
            }
            else {
                utils.logWarn("currentFolderPath is empty or invalid. Aborting refresh.");
                uiManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
            }
        }
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
    // 개별 효과음 버튼 클릭 처리
    function handleSoundFileButtonClick(event) {
        var utils = getUtils();
        var target = event.target;
        var soundFsName = target.getAttribute("data-fsname");
        var soundDisplayName = target.textContent;
        if (soundFsName) {
            utils.logDebug("Replacing with sound file: " + soundFsName);
            var uiManager_7 = getUIManager();
            var communication_1 = getCommunication();
            if (uiManager_7) {
                uiManager_7.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);
            }
            if (communication_1) {
                // 단계별 테스트: 가장 간단한 함수부터 시작
                utils.logDebug("Testing simplest ExtendScript function first...");
                communication_1.callExtendScript("simpleTest()", function (simpleResult) {
                    utils.logDebug("Simple test result: " + simpleResult);
                    var debugInfo = "=== Sound File Button Click Debug ===\n";
                    debugInfo += "시간: " + new Date().toISOString() + "\n";
                    debugInfo += "파일 경로: " + soundFsName + "\n";
                    debugInfo += "파일명: " + soundDisplayName + "\n";
                    debugInfo += "\n--- 단순 테스트 결과 ---\n";
                    debugInfo += "simpleTest(): " + simpleResult + "\n";
                    if (simpleResult === "HELLO_FROM_EXTENDSCRIPT") {
                        debugInfo += "✓ ExtendScript 기본 실행 성공\n";
                        // 다음 단계: 중복 임포트 테스트
                        communication_1.callExtendScript("testDuplicateImport(" + JSON.stringify(soundFsName) + ")", function (duplicateResult) {
                            debugInfo += "\n--- 중복 임포트 테스트 결과 ---\n";
                            debugInfo += duplicateResult + "\n";
                            // 기본 정보 테스트 (JSON 없이)
                            communication_1.callExtendScript("basicInfo()", function (basicResult) {
                                debugInfo += "\n--- 기본 정보 테스트 결과 ---\n";
                                debugInfo += "basicInfo(): " + basicResult + "\n";
                                if (basicResult && basicResult.indexOf("ERROR:") !== 0) {
                                    debugInfo += "✓ 기본 정보 수집 성공\n";
                                    // 마지막 단계: 실제 클립 교체 시도
                                    debugInfo += "\n환경 테스트 통과, 클립 교체 시도...\n";
                                    communication_1.callExtendScript("replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")", function (result) {
                                        utils.logDebug("replaceSelectedAudioClips call result: " + result);
                                        debugInfo += "\n--- 클립 교체 결과 ---\n";
                                        debugInfo += "원본 결과: " + result + "\n";
                                        // JSON 파싱 시도
                                        try {
                                            var parsedResult = utils.safeJSONParse(result);
                                            debugInfo += "JSON 파싱: SUCCESS\n";
                                            if (parsedResult) {
                                                debugInfo += "파싱된 결과:\n";
                                                debugInfo += "  - success: " + parsedResult.success + "\n";
                                                debugInfo += "  - message: " + parsedResult.message + "\n";
                                                if (parsedResult.data) {
                                                    debugInfo += "  - replacedCount: " + parsedResult.data.replacedCount + "\n";
                                                    debugInfo += "  - totalSelected: " + parsedResult.data.totalSelected + "\n";
                                                }
                                                // 상태 메시지 업데이트
                                                if (parsedResult.success) {
                                                    uiManager_7.updateStatus("클립 교체 완료: " + parsedResult.message, true);
                                                }
                                                else {
                                                    uiManager_7.updateStatus("클립 교체 실패: " + parsedResult.message, false);
                                                }
                                                // ExtendScript 디버그 정보 추가
                                                if (parsedResult.debug) {
                                                    debugInfo += "\n--- ExtendScript 디버그 정보 ---\n";
                                                    debugInfo += parsedResult.debug;
                                                }
                                            }
                                        }
                                        catch (parseError) {
                                            debugInfo += "JSON 파싱 실패: " + parseError.message + "\n";
                                            // 기존 문자열 처리 방식 사용
                                            if (typeof result === "string") {
                                                if (result.indexOf("success:") === 0) {
                                                    var message = result.substring(8);
                                                    uiManager_7.updateStatus("클립 교체 완료: " + message, true);
                                                }
                                                else if (result.indexOf("error:") === 0) {
                                                    var errorMessage = result.substring(6);
                                                    uiManager_7.updateStatus("클립 교체 실패: " + errorMessage, false);
                                                }
                                                else {
                                                    uiManager_7.updateStatus("클립 교체 결과: " + result, true);
                                                }
                                            }
                                        }
                                        // 디버그 정보 저장
                                        window.lastDebugInfo = debugInfo;
                                        uiManager_7.toggleDebugButton(true);
                                        // 효과음 삽입 완료 후 타임라인으로 포커스 이동
                                        setTimeout(function () {
                                            try {
                                                var focusDebug_1 = "\n--- 포커스 디버그 정보 ---\n";
                                                var currentElement = document.activeElement;
                                                focusDebug_1 += "시작 - 현재 활성 요소: " + (currentElement ? (currentElement.tagName + (currentElement.id ? "#" + currentElement.id : "") + (currentElement.textContent ? " (" + currentElement.textContent.substring(0, 20) + ")" : "")) : "없음") + "\n";
                                                // CEP 패널에서 포커스 제거
                                                if (document.activeElement && document.activeElement.blur) {
                                                    document.activeElement.blur();
                                                    focusDebug_1 += "현재 요소 blur 완료\n";
                                                }
                                                // 패널의 포커스를 완전히 제거 시도
                                                var bodyElement = document.body;
                                                if (bodyElement) {
                                                    bodyElement.focus();
                                                    bodyElement.blur();
                                                    // 추가: 모든 포커스 가능한 요소들을 blur
                                                    var focusableElements = document.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                                                    focusableElements.forEach(function (el) {
                                                        try {
                                                            el.blur();
                                                        }
                                                        catch (e) { /* ignore */ }
                                                    });
                                                    // 최종적으로 document에서 activeElement 제거 시도
                                                    try {
                                                        if (document.activeElement && document.activeElement.blur) {
                                                            document.activeElement.blur();
                                                        }
                                                        // 강제로 포커스를 제거하기 위해 임시 요소 생성 후 제거
                                                        var tempInput = document.createElement('input');
                                                        tempInput.style.position = 'absolute';
                                                        tempInput.style.left = '-9999px';
                                                        tempInput.style.opacity = '0';
                                                        document.body.appendChild(tempInput);
                                                        tempInput.focus();
                                                        tempInput.blur();
                                                        document.body.removeChild(tempInput);
                                                    }
                                                    catch (e) { /* ignore */ }
                                                    focusDebug_1 += "완전한 포커스 제거 시도 완료\n";
                                                }
                                                var finalElement = document.activeElement;
                                                focusDebug_1 += "blur 후 - 최종 활성 요소: " + (finalElement ? (finalElement.tagName + (finalElement.id ? "#" + finalElement.id : "") + (finalElement.textContent ? " (" + finalElement.textContent.substring(0, 20) + ")" : "")) : "없음") + "\n";
                                                // UI에 포커스 정보 표시
                                                uiManager_7.updateStatus("효과음 삽입 완료 - 포커스 상태 확인", true);
                                                // Adobe 앱으로 포커스 이동 (타임라인 활성화)
                                                var communication_2 = getCommunication();
                                                if (communication_2) {
                                                    // ExtendScript로 타임라인 포커스 명령 전송
                                                    communication_2.callExtendScript("focusTimeline();", function (focusResult) {
                                                        focusDebug_1 += "타임라인 포커스 이동 결과: " + focusResult + "\n";
                                                        // 최종 결과를 UI에 표시
                                                        var veryFinalElement = document.activeElement;
                                                        focusDebug_1 += "최종 - 활성 요소: " + (veryFinalElement ? (veryFinalElement.tagName + (veryFinalElement.id ? "#" + veryFinalElement.id : "")) : "없음") + "\n";
                                                        // 디버그 정보에 포커스 정보 추가
                                                        window.lastDebugInfo = (window.lastDebugInfo || "") + focusDebug_1;
                                                        var utils = getUtils();
                                                        utils.logDebug("포커스 디버그:", focusDebug_1);
                                                    });
                                                }
                                                else {
                                                    focusDebug_1 += "Communication 객체 없음\n";
                                                    window.lastDebugInfo = (window.lastDebugInfo || "") + focusDebug_1;
                                                    var utils_2 = getUtils();
                                                    utils_2.logDebug("포커스 디버그:", focusDebug_1);
                                                }
                                            }
                                            catch (focusError) {
                                                var utils_3 = getUtils();
                                                var uiManager_8 = getUIManager();
                                                var errorMsg = "포커스 이동 중 오류: " + focusError;
                                                uiManager_8.updateStatus(errorMsg, false);
                                                utils_3.logDebug(errorMsg);
                                            }
                                        }, 100); // 100ms 후 실행
                                    });
                                }
                                else {
                                    debugInfo += "✗ 기본 정보 수집 실패: " + basicResult + "\n";
                                    uiManager_7.updateStatus("ExtendScript 기본 정보 수집 실패", false);
                                    window.lastDebugInfo = debugInfo;
                                    uiManager_7.toggleDebugButton(true);
                                }
                            });
                        });
                    }
                    else {
                        debugInfo += "✗ ExtendScript 기본 실행 실패: " + simpleResult + "\n";
                        uiManager_7.updateStatus("ExtendScript 실행 환경에 문제가 있습니다", false);
                        window.lastDebugInfo = debugInfo;
                        uiManager_7.toggleDebugButton(true);
                    }
                });
            }
        }
        else {
            var utils_4 = getUtils();
            var uiManager = getUIManager();
            utils_4.logError("Sound file path (fsName) not found on button.");
            if (uiManager) {
                uiManager.updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
            }
        }
    }
    // DI 상태 확인 함수 (디버깅용)
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
        if (stateService)
            dependencies.push('JSCStateManager (DI)');
        else if (window.JSCStateManager)
            dependencies.push('JSCStateManager (Legacy)');
        if (communicationService)
            dependencies.push('JSCCommunication (DI)');
        else if (window.JSCCommunication)
            dependencies.push('JSCCommunication (Legacy)');
        if (soundEngineService)
            dependencies.push('SoundEngine (DI)');
        else if (window.SoundEngine)
            dependencies.push('SoundEngine (Legacy)');
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
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