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
    // 이벤트 리스너 설정
    function setupEventListeners() {
        try {
            console.log('Setting up event listeners...');
            setupInsertSoundsButton();
            setupBrowseFolderButton();
            setupRefreshButton();
            setupMagnetButton();
            setupFolderInput();
            setupDebugUI();
            console.log('Event listeners setup completed');
        }
        catch (e) {
            console.error('Event listeners setup failed:', e.message);
        }
    }
    // 효과음 삽입 버튼 이벤트
    function setupInsertSoundsButton() {
        var insertButton = document.getElementById("insert-sounds");
        if (insertButton) {
            insertButton.addEventListener("click", insertSounds);
            console.log("Event listener added to insert-sounds button");
        }
        else {
            console.warn("Button with ID 'insert-sounds' not found.");
        }
    }
    // 폴더 찾기 버튼 이벤트
    function setupBrowseFolderButton() {
        var browseButton = document.getElementById("browseFolder");
        if (browseButton) {
            browseButton.addEventListener("click", browseSoundFolder);
            window.JSCUtils.debugLog("Event listener added to browseFolder button");
        }
        else {
            console.error("Button with ID 'browseFolder' not found.");
        }
    }
    // 새로고침 버튼 이벤트
    function setupRefreshButton() {
        var refreshButton = document.getElementById("refreshSounds");
        if (refreshButton) {
            refreshButton.addEventListener("click", refreshSoundButtons);
            window.JSCUtils.debugLog("Event listener added to refreshSounds button");
        }
        else {
            console.error("Button with ID 'refreshSounds' not found.");
        }
    }
    // 마그넷 버튼 이벤트
    function setupMagnetButton() {
        var magnetButton = document.getElementById("magnetClips");
        if (magnetButton) {
            magnetButton.addEventListener("click", magnetClips);
            window.JSCUtils.debugLog("Event listener added to magnetClips button");
        }
        else {
            console.error("Button with ID 'magnetClips' not found.");
        }
    }
    // 폴더 입력 필드 이벤트
    function setupFolderInput() {
        var folderInput = document.getElementById("sound-folder");
        if (folderInput) {
            folderInput.addEventListener("change", function () {
                var inputPath = this.value.trim();
                window.JSCUtils.debugLog("Folder input changed: " + inputPath);
                if (inputPath && window.JSCUtils && window.JSCUtils.isValidPath(inputPath)) {
                    if (window.JSCStateManager) {
                        window.JSCStateManager.saveFolderPath(inputPath);
                        console.log("Valid path stored: " + inputPath);
                    }
                }
                else {
                    if (inputPath) {
                        console.warn("Invalid path entered: " + inputPath);
                        if (window.JSCUIManager) {
                            window.JSCUIManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        }
                        if (window.JSCStateManager) {
                            this.value = window.JSCStateManager.getCurrentFolderPath(); // 이전 유효한 경로로 복원
                        }
                    }
                    else {
                        if (window.JSCStateManager) {
                            window.JSCStateManager.clearFolderPath();
                        }
                        console.log("Path cleared");
                    }
                }
            });
            window.JSCUtils.debugLog("Event listener added to sound-folder input");
        }
        else {
            console.error("Input with ID 'sound-folder' not found.");
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
                window.JSCUIManager.showDebugInfo();
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
            var debugInfo, engineStatus, validation, settings;
            return __generator(this, function (_a) {
                debugInfo = "=== SoundEngine 테스트 ===\n";
                debugInfo += "\uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                try {
                    // 1. SoundEngine 존재 확인
                    if (!window.SoundEngine) {
                        debugInfo += "❌ SoundEngine이 로드되지 않았습니다\n";
                        window.JSCUIManager.updateStatus("SoundEngine이 로드되지 않았습니다", false);
                        window.lastDebugInfo = debugInfo;
                        window.JSCUIManager.toggleDebugButton(true);
                        return [2 /*return*/];
                    }
                    debugInfo += "✅ SoundEngine 로드됨\n";
                    engineStatus = window.SoundEngine.getEngineStatus();
                    debugInfo += "\uC5D4\uC9C4 \uC0C1\uD0DC: ".concat(engineStatus.isReady ? "준비완료" : "준비안됨", "\n");
                    if (!engineStatus.isReady) {
                        debugInfo += "\uB204\uB77D \uC758\uC874\uC131: ".concat(engineStatus.dependencies.join(', '), "\n");
                    }
                    // 3. 기본 모듈들 확인
                    debugInfo += "JSCStateManager: ".concat(window.JSCStateManager ? "✅" : "❌", "\n");
                    debugInfo += "ClipTimeCalculator: ".concat(window.ClipTimeCalculator ? "✅" : "❌", "\n");
                    debugInfo += "JSCCommunication: ".concat(window.JSCCommunication ? "✅" : "❌", "\n");
                    // 4. 상태 검증
                    if (window.JSCStateManager) {
                        validation = window.JSCStateManager.validateState();
                        debugInfo += "\uC0C1\uD0DC \uC720\uD6A8\uC131: ".concat(validation.isValid ? "✅" : "❌", "\n");
                        if (!validation.isValid) {
                            debugInfo += "\uC624\uB958: ".concat(validation.errors.join(', '), "\n");
                        }
                        settings = window.JSCStateManager.getSettings();
                        debugInfo += "\uD3F4\uB354 \uACBD\uB85C: ".concat(settings.folderPath || "설정되지 않음", "\n");
                        debugInfo += "\uC624\uB514\uC624 \uD2B8\uB799: ".concat(settings.audioTrack, "\n");
                    }
                    window.JSCUIManager.updateStatus("SoundEngine 테스트 완료", true);
                }
                catch (error) {
                    debugInfo += "\u274C \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958: ".concat(error.message, "\n");
                    window.JSCUIManager.updateStatus("SoundEngine 테스트 실패", false);
                }
                window.lastDebugInfo = debugInfo;
                window.JSCUIManager.toggleDebugButton(true);
                return [2 /*return*/];
            });
        });
    }
    // 효과음 삽입 처리 (새로운 SoundEngine 사용)
    function insertSounds() {
        return __awaiter(this, void 0, void 0, function () {
            var debugInfo, engineStatus, validation, settings, engineConfig, result, fileNames, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        debugInfo = "=== 효과음 삽입 디버그 ===\n";
                        debugInfo += "\uC2DC\uC791 \uC2DC\uAC04: ".concat(new Date().toISOString(), "\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        debugInfo += "1. JSCStateManager 확인...\n";
                        if (!window.JSCStateManager) {
                            debugInfo += "❌ JSCStateManager 없음\n";
                            console.error('JSCStateManager not available');
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ JSCStateManager 정상\n";
                        debugInfo += "2. SoundEngine 확인...\n";
                        // Check if SoundEngine is available
                        if (!window.SoundEngine) {
                            debugInfo += "❌ SoundEngine 모듈 없음\n";
                            window.JSCUIManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                            console.error('SoundEngine not available');
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ SoundEngine 정상\n";
                        debugInfo += "3. SoundEngine 상태 확인...\n";
                        engineStatus = window.SoundEngine.getEngineStatus();
                        debugInfo += "\uC5D4\uC9C4 \uC900\uBE44 \uC0C1\uD0DC: ".concat(engineStatus.isReady, "\n");
                        if (!engineStatus.isReady) {
                            debugInfo += "\u274C \uB204\uB77D \uC758\uC874\uC131: ".concat(engineStatus.dependencies.join(', '), "\n");
                            window.JSCUIManager.updateStatus("\uD544\uC694\uD55C \uBAA8\uB4C8\uC774 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4: ".concat(engineStatus.dependencies.join(', ')), false);
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ 엔진 상태 정상\n";
                        debugInfo += "4. 상태 검증...\n";
                        validation = window.JSCStateManager.validateState();
                        debugInfo += "\uC0C1\uD0DC \uC720\uD6A8\uC131: ".concat(validation.isValid, "\n");
                        if (!validation.isValid) {
                            debugInfo += "\u274C \uAC80\uC99D \uC624\uB958: ".concat(validation.errors.join(', '), "\n");
                            window.JSCUIManager.updateStatus(validation.errors[0], false);
                            window.lastDebugInfo = debugInfo;
                            return [2 /*return*/];
                        }
                        debugInfo += "✅ 상태 검증 통과\n";
                        settings = window.JSCStateManager.getSettings();
                        debugInfo += "\uC124\uC815 - \uD3F4\uB354: ".concat(settings.folderPath, "\n");
                        debugInfo += "\uC124\uC815 - \uC624\uB514\uC624 \uD2B8\uB799: ".concat(settings.audioTrack, "\n");
                        debugInfo += "5. UI 상태 업데이트...\n";
                        // UI 상태 업데이트
                        window.JSCUIManager.updateStatus("효과음 삽입 중...", true);
                        window.JSCUIManager.displaySoundList([]);
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
                        return [4 /*yield*/, window.SoundEngine.executeSoundInsertion(engineConfig)];
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
                            window.JSCUIManager.updateStatus(result.message, true);
                            // 삽입된 효과음 목록 표시 (있다면)
                            if (result.data && result.data.files) {
                                fileNames = Array.isArray(result.data.files)
                                    ? result.data.files.map(function (f) { return typeof f === 'string' ? f : f.name; })
                                    : [];
                                window.JSCUIManager.displaySoundList(fileNames);
                                debugInfo += "\uD45C\uC2DC\uB41C \uD30C\uC77C \uBAA9\uB85D: ".concat(fileNames.length, "\uAC1C\n");
                            }
                        }
                        else {
                            window.JSCUIManager.updateStatus(result.message, false);
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
                            window.JSCUtils.logInfo("\uD6A8\uACFC\uC74C \uC0BD\uC785 \uC644\uB8CC - \uC18C\uC694 \uC2DC\uAC04: ".concat(result.executionTime.toFixed(2), "ms"));
                        }
                        debugInfo += "✅ insertSounds() 함수 완료\n";
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        debugInfo += "\u274C \uC608\uC678 \uBC1C\uC0DD: ".concat(e_1.message, "\n");
                        debugInfo += "\uC2A4\uD0DD \uCD94\uC801:\n".concat(e_1.stack, "\n");
                        console.error("Sound insertion failed:", e_1.message);
                        window.JSCUIManager.updateStatus("효과음 삽입 중 오류가 발생했습니다.", false);
                        return [3 /*break*/, 4];
                    case 4:
                        // 디버그 정보 항상 표시
                        window.lastDebugInfo = debugInfo;
                        return [2 /*return*/];
                }
            });
        });
    }
    // 폴더 찾기 처리
    function browseSoundFolder() {
        if (window.JSCCommunication) {
            window.JSCCommunication.callExtendScript("browseSoundFolder()", function (result) {
                console.log("Browse folder result: " + result);
                if (result && result !== "undefined" && result !== "" &&
                    window.JSCUtils && window.JSCUtils.isValidPath(result)) {
                    if (window.JSCStateManager) {
                        window.JSCStateManager.saveFolderPath(result);
                        console.log("Valid path set: " + result);
                    }
                }
                else {
                    if (result && result !== "undefined" && result !== "") {
                        console.warn("Invalid path received from ExtendScript: " + result);
                        if (window.JSCUIManager) {
                            window.JSCUIManager.updateStatus("올바른 폴더를 선택해주세요.", false);
                        }
                    }
                    else {
                        console.log("No folder selected or empty result");
                    }
                }
            });
        }
    }
    // 새로고침 처리
    function refreshSoundButtons() {
        var currentPath = window.JSCStateManager.getCurrentFolderPath();
        window.JSCUtils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);
        if (currentPath && window.JSCUtils.isValidPath(currentPath)) {
            window.JSCUIManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
            window.JSCUIManager.updateStatus("'" + window.JSCUtils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...", true);
            var pathArg_1 = JSON.stringify(currentPath);
            window.JSCUtils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg_1);
            window.JSCCommunication.callExtendScript("getFilesForPathCS(" + pathArg_1 + ")", function (result) {
                window.JSCUtils.debugLog("refreshSoundButtons: evalScript callback result: " + result);
                // 디버그 정보 생성
                var debugInfo = "=== Refresh Sound Buttons Debug ===\n";
                debugInfo += "시간: " + new Date().toISOString() + "\n";
                debugInfo += "폴더 경로: " + currentPath + "\n";
                debugInfo += "JSX 결과: " + result + "\n";
                debugInfo += "결과 타입: " + typeof result + "\n";
                if (typeof result === "string" && result.indexOf("error:") === 0) {
                    debugInfo += "오류 발생: " + result.substring(6) + "\n";
                    window.JSCUIManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다: " + result.substring(6), false);
                }
                else if (result === "success") {
                    debugInfo += "성공적으로 완료됨\n";
                    debugInfo += "콜백 방식으로 파일 목록 가져오기 시도...\n";
                    // 콜백 방식으로 직접 파일 목록 가져오기
                    window.JSCCommunication.callExtendScript("getFilesForPathWithCallback(" + pathArg_1 + ")", function (callbackResult) {
                        debugInfo += "콜백 결과: " + callbackResult + "\n";
                        try {
                            var parsedResult = window.JSCUtils.safeJSONParse(callbackResult);
                            if (parsedResult && parsedResult.success && parsedResult.soundFiles) {
                                debugInfo += "파일 " + parsedResult.soundFiles.length + "개 발견\n";
                                window.JSCUIManager.updateSoundButtons(parsedResult.soundFiles, parsedResult.folderPath);
                                window.JSCUIManager.updateStatus("폴더 새로고침이 완료되었습니다. " + parsedResult.soundFiles.length + "개 파일 발견.", true);
                            }
                            else {
                                debugInfo += "파일 목록 처리 실패\n";
                                window.JSCUIManager.updateStatus("파일 목록을 가져올 수 없습니다.", false);
                            }
                        }
                        catch (parseError) {
                            debugInfo += "JSON 파싱 오류: " + parseError.message + "\n";
                            window.JSCUIManager.updateStatus("파일 목록 데이터 처리 중 오류가 발생했습니다.", false);
                        }
                        window.lastDebugInfo = debugInfo;
                        window.JSCUIManager.toggleDebugButton(true);
                    });
                }
                else {
                    debugInfo += "예상치 못한 결과: " + result + "\n";
                    window.JSCUIManager.updateStatus("폴더 새로고침 결과를 처리하는 중입니다...", true);
                }
                // 디버그 정보 저장
                window.lastDebugInfo = debugInfo;
                window.JSCUIManager.toggleDebugButton(true);
            });
        }
        else {
            if (currentPath && !window.JSCUtils.isValidPath(currentPath)) {
                console.warn("currentFolderPath is invalid, clearing it: " + currentPath);
                window.JSCStateManager.clearFolderPath();
                window.JSCUIManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
            }
            else {
                console.warn("currentFolderPath is empty or invalid. Aborting refresh.");
                window.JSCUIManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
            }
        }
    }
    // 클립 자동 정렬 처리 (새로운 SoundEngine 사용)
    function magnetClips() {
        return __awaiter(this, void 0, void 0, function () {
            var engineStatus, magnetStatus, result, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        window.JSCUtils.debugLog("magnetClips() called");
                        // Check if SoundEngine is available
                        if (!window.SoundEngine) {
                            window.JSCUIManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                            console.error('SoundEngine not available');
                            return [2 /*return*/];
                        }
                        engineStatus = window.SoundEngine.getEngineStatus();
                        if (!engineStatus.isReady) {
                            window.JSCUIManager.updateStatus("\uD544\uC694\uD55C \uBAA8\uB4C8\uC774 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4: ".concat(engineStatus.dependencies.join(', ')), false);
                            return [2 /*return*/];
                        }
                        // UI 상태 업데이트
                        window.JSCUIManager.updateStatus("클립 자동 정렬 중...", true);
                        window.JSCUIManager.resetDebugUI();
                        magnetStatus = document.getElementById("magnetStatus");
                        if (magnetStatus) {
                            magnetStatus.textContent = "처리 중...";
                            magnetStatus.style.color = "#007acc";
                        }
                        return [4 /*yield*/, window.SoundEngine.executeMagnetClips()];
                    case 1:
                        result = _a.sent();
                        // 결과 처리
                        if (result.success) {
                            window.JSCUIManager.updateStatus(result.message, true);
                            // 마그넷 상태 업데이트
                            if (result.data) {
                                window.JSCUIManager.updateMagnetStatus(true, result.data.clipsMoved || 0, result.data.gapsRemoved || 0);
                            }
                        }
                        else {
                            window.JSCUIManager.updateStatus(result.message, false);
                            window.JSCUIManager.updateMagnetStatus(false);
                        }
                        // 디버그 정보 표시
                        if (result.debug && window.JSCUtils.CONFIG.DEBUG_MODE) {
                            window.lastDebugInfo = result.debug;
                            window.JSCUIManager.toggleDebugButton(true);
                        }
                        // 실행 시간 로깅
                        if (result.executionTime) {
                            window.JSCUtils.logInfo("\uD074\uB9BD \uC790\uB3D9 \uC815\uB82C \uC644\uB8CC - \uC18C\uC694 \uC2DC\uAC04: ".concat(result.executionTime.toFixed(2), "ms"));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        console.error("Magnet clips failed:", e_2.message);
                        window.JSCUIManager.updateStatus("클립 자동 정렬 중 오류가 발생했습니다.", false);
                        window.JSCUIManager.updateMagnetStatus(false);
                        // 에러 정보를 디버그로 표시
                        if (window.JSCUtils.CONFIG.DEBUG_MODE) {
                            window.lastDebugInfo = "Error: ".concat(e_2.message, "\nStack: ").concat(e_2.stack);
                            window.JSCUIManager.toggleDebugButton(true);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    // 개별 효과음 버튼 클릭 처리
    function handleSoundFileButtonClick(event) {
        var target = event.target;
        var soundFsName = target.getAttribute("data-fsname");
        var soundDisplayName = target.textContent;
        if (soundFsName) {
            console.log("Replacing with sound file: " + soundFsName);
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);
            }
            if (window.JSCCommunication) {
                // 단계별 테스트: 가장 간단한 함수부터 시작
                console.log("Testing simplest ExtendScript function first...");
                window.JSCCommunication.callExtendScript("simpleTest()", function (simpleResult) {
                    console.log("Simple test result: " + simpleResult);
                    var debugInfo = "=== Sound File Button Click Debug ===\n";
                    debugInfo += "시간: " + new Date().toISOString() + "\n";
                    debugInfo += "파일 경로: " + soundFsName + "\n";
                    debugInfo += "파일명: " + soundDisplayName + "\n";
                    debugInfo += "\n--- 단순 테스트 결과 ---\n";
                    debugInfo += "simpleTest(): " + simpleResult + "\n";
                    if (simpleResult === "HELLO_FROM_EXTENDSCRIPT") {
                        debugInfo += "✓ ExtendScript 기본 실행 성공\n";
                        // 다음 단계: 중복 임포트 테스트
                        window.JSCCommunication.callExtendScript("testDuplicateImport(" + JSON.stringify(soundFsName) + ")", function (duplicateResult) {
                            debugInfo += "\n--- 중복 임포트 테스트 결과 ---\n";
                            debugInfo += duplicateResult + "\n";
                            // 기본 정보 테스트 (JSON 없이)
                            window.JSCCommunication.callExtendScript("basicInfo()", function (basicResult) {
                                debugInfo += "\n--- 기본 정보 테스트 결과 ---\n";
                                debugInfo += "basicInfo(): " + basicResult + "\n";
                                if (basicResult && basicResult.indexOf("ERROR:") !== 0) {
                                    debugInfo += "✓ 기본 정보 수집 성공\n";
                                    // 마지막 단계: 실제 클립 교체 시도
                                    debugInfo += "\n환경 테스트 통과, 클립 교체 시도...\n";
                                    window.JSCCommunication.callExtendScript("replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")", function (result) {
                                        console.log("replaceSelectedAudioClips call result: " + result);
                                        debugInfo += "\n--- 클립 교체 결과 ---\n";
                                        debugInfo += "원본 결과: " + result + "\n";
                                        // JSON 파싱 시도
                                        try {
                                            var parsedResult = window.JSCUtils.safeJSONParse(result);
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
                                                    window.JSCUIManager.updateStatus("클립 교체 완료: " + parsedResult.message, true);
                                                }
                                                else {
                                                    window.JSCUIManager.updateStatus("클립 교체 실패: " + parsedResult.message, false);
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
                                                    window.JSCUIManager.updateStatus("클립 교체 완료: " + message, true);
                                                }
                                                else if (result.indexOf("error:") === 0) {
                                                    var errorMessage = result.substring(6);
                                                    window.JSCUIManager.updateStatus("클립 교체 실패: " + errorMessage, false);
                                                }
                                                else {
                                                    window.JSCUIManager.updateStatus("클립 교체 결과: " + result, true);
                                                }
                                            }
                                        }
                                        // 디버그 정보 저장
                                        window.lastDebugInfo = debugInfo;
                                        window.JSCUIManager.toggleDebugButton(true);
                                    });
                                }
                                else {
                                    debugInfo += "✗ 기본 정보 수집 실패: " + basicResult + "\n";
                                    window.JSCUIManager.updateStatus("ExtendScript 기본 정보 수집 실패", false);
                                    window.lastDebugInfo = debugInfo;
                                    window.JSCUIManager.toggleDebugButton(true);
                                }
                            });
                        });
                    }
                    else {
                        debugInfo += "✗ ExtendScript 기본 실행 실패: " + simpleResult + "\n";
                        window.JSCUIManager.updateStatus("ExtendScript 실행 환경에 문제가 있습니다", false);
                        window.lastDebugInfo = debugInfo;
                        window.JSCUIManager.toggleDebugButton(true);
                    }
                });
            }
        }
        else {
            console.error("Sound file path (fsName) not found on button.");
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
            }
        }
    }
    // 공개 API
    return {
        setupEventListeners: setupEventListeners,
        handleSoundFileButtonClick: handleSoundFileButtonClick
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCEventManager = JSCEventManager;
}
//# sourceMappingURL=event-manager.js.map