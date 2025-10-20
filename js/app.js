"use strict";
/**
 * JSCEditHelper - Main Application
 * 모듈들을 초기화하고 애플리케이션을 시작하는 메인 파일
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var JSCApp = (function () {
    'use strict';
    // DIHelpers 사용 - 반복 코드 제거!
    var DIHelpers = window.DIHelpers;
    // 서비스 가져오기
    function getUtils() {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('App');
        }
        // Fallback
        var fallback = {
            debugLog: function (msg) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return console.log.apply(console, __spreadArray(['[App]', msg], args, false));
            },
            logDebug: function (msg) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return console.log.apply(console, __spreadArray(['[App]', msg], args, false));
            },
            logInfo: function (msg) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return console.info.apply(console, __spreadArray(['[App]', msg], args, false));
            },
            logWarn: function (msg) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return console.warn.apply(console, __spreadArray(['[App]', msg], args, false));
            },
            logError: function (msg) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return console.error.apply(console, __spreadArray(['[App]', msg], args, false));
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
            LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
            log: function (_level, _message) { },
            getDIStatus: function () { return ({ isDIAvailable: false, containerInfo: 'Fallback mode' }); }
        };
        return (window.JSCUtils || fallback);
    }
    // 디버그 UI 설정
    function setupDebugUI() {
        // 이미 존재하는지 확인
        if (document.getElementById("debug-button")) {
            return;
        }
        // 결과 영역에 디버그 버튼과 디버그 정보 영역 추가
        var resultSection = document.querySelector(".result-section");
        if (!resultSection)
            return;
        // 디버그 버튼 생성
        var debugButton = document.createElement("button");
        debugButton.id = "debug-button";
        debugButton.innerHTML = "디버그 정보 보기";
        debugButton.style.display = "none";
        debugButton.style.marginTop = "10px";
        debugButton.style.padding = "5px 10px";
        debugButton.style.backgroundColor = "#555";
        debugButton.style.color = "white";
        debugButton.style.border = "none";
        debugButton.style.borderRadius = "3px";
        debugButton.style.cursor = "pointer";
        // 디버그 정보 영역 생성
        var debugInfo = document.createElement("div");
        debugInfo.id = "debug-info";
        debugInfo.style.display = "none";
        debugInfo.style.marginTop = "10px";
        debugInfo.style.padding = "10px";
        debugInfo.style.backgroundColor = "#333";
        debugInfo.style.border = "1px solid #555";
        debugInfo.style.borderRadius = "3px";
        debugInfo.style.maxHeight = "150px";
        debugInfo.style.overflowY = "auto";
        debugInfo.style.whiteSpace = "pre-wrap";
        debugInfo.style.fontSize = "11px";
        debugInfo.style.fontFamily = "monospace";
        // 디버그 정보 닫기 버튼
        var closeDebugButton = document.createElement("button");
        closeDebugButton.id = "close-debug-button";
        closeDebugButton.innerHTML = "닫기";
        closeDebugButton.style.marginTop = "5px";
        closeDebugButton.style.padding = "3px 8px";
        closeDebugButton.style.backgroundColor = "#666";
        closeDebugButton.style.color = "white";
        closeDebugButton.style.border = "none";
        closeDebugButton.style.borderRadius = "3px";
        closeDebugButton.style.cursor = "pointer";
        closeDebugButton.style.display = "none";
        // 요소 추가
        resultSection.appendChild(debugButton);
        resultSection.appendChild(debugInfo);
        resultSection.appendChild(closeDebugButton);
    }
    // 핵심 모듈 의존성 확인 (단순화)
    function checkDependencies() {
        var utils = getUtils();
        var requiredModules = [
            'JSCUtils', 'JSCUIManager', 'JSCStateManager',
            'JSCCommunication', 'JSCEventManager'
        ];
        for (var _i = 0, requiredModules_1 = requiredModules; _i < requiredModules_1.length; _i++) {
            var moduleName = requiredModules_1[_i];
            if (!window[moduleName]) {
                utils.logError('Required module not loaded: ' + moduleName);
                return false;
            }
        }
        return true;
    }
    // DI 컨테이너 초기화 및 서비스 등록
    function initializeDependencyInjection() {
        var utils = getUtils();
        try {
            utils.logDebug("Initializing Dependency Injection container...");
            // DI 컨테이너가 사용 가능한지 확인
            if (!window.DI) {
                utils.logError('DI container not available');
                return false;
            }
            // 모든 서비스를 DI 컨테이너에 등록
            var services = [
                { key: 'JSCUtils', factory: function () { return window.JSCUtils; } },
                { key: 'JSCUIManager', factory: function () { return window.JSCUIManager; } },
                { key: 'JSCStateManager', factory: function () { return window.JSCStateManager; } },
                { key: 'JSCCommunication', factory: function () { return window.JSCCommunication; } },
                { key: 'JSCEventManager', factory: function () { return window.JSCEventManager; } },
                { key: 'JSCErrorHandler', factory: function () { return window.JSCErrorHandler; } },
                { key: 'SoundEngine', factory: function () { return window.SoundEngine; } },
                { key: 'AudioFileProcessor', factory: function () { return window.AudioFileProcessor; } },
                { key: 'ClipTimeCalculator', factory: function () { return window.ClipTimeCalculator; } },
                { key: 'TextProcessor', factory: function () { return window.TextProcessor; } }
            ];
            // 서비스 등록
            for (var _i = 0, services_1 = services; _i < services_1.length; _i++) {
                var service = services_1[_i];
                try {
                    window.DI.register(service.key, service.factory);
                    utils.logDebug("\u2713 Registered service: ".concat(service.key));
                }
                catch (error) {
                    utils.logWarn("\u26A0 Failed to register service: ".concat(service.key), error);
                }
            }
            // 필수 의존성 검증
            var requiredServices = ['JSCUtils', 'JSCUIManager', 'JSCStateManager', 'JSCCommunication', 'JSCEventManager'];
            var validation = window.DI.validateDependencies(requiredServices);
            if (!validation.isValid) {
                utils.logError('DI validation failed. Missing services:', validation.missing);
                return false;
            }
            utils.logDebug("✓ DI container initialized successfully");
            return true;
        }
        catch (error) {
            utils.logError("DI initialization error:", error);
            return false;
        }
    }
    // 애플리케이션 초기화
    function initialize() {
        var _a, _b, _c, _d;
        var utils = getUtils();
        try {
            // 의존성 확인
            if (!checkDependencies()) {
                utils.logError('JSCEditHelper initialization failed: Missing dependencies');
                return false;
            }
            utils.logDebug("JSCEditHelper initializing...");
            // DI 컨테이너 초기화 (Phase 1.1)
            if (!initializeDependencyInjection()) {
                utils.logWarn('DI initialization failed, falling back to legacy mode');
            }
            // 디버그 UI 설정
            setupDebugUI();
            // DI 서비스 가져오기 (DI 우선, fallback으로 window)
            var communication = ((_a = window.DI) === null || _a === void 0 ? void 0 : _a.get('JSCCommunication')) || window.JSCCommunication;
            var uiManager_1 = ((_b = window.DI) === null || _b === void 0 ? void 0 : _b.get('JSCUIManager')) || window.JSCUIManager;
            var stateManager_1 = ((_c = window.DI) === null || _c === void 0 ? void 0 : _c.get('JSCStateManager')) || window.JSCStateManager;
            var eventManager_1 = ((_d = window.DI) === null || _d === void 0 ? void 0 : _d.get('JSCEventManager')) || window.JSCEventManager;
            // 통신 모듈 초기화
            var csInterface = communication.initialize();
            // CSS 강제 체크 비활성화 (안정성 우선)
            utils.logDebug("✓ Skipping CSS check for stability");
            // 테마 설정
            uiManager_1.updateThemeWithAppSkinInfo(csInterface);
            // 상태 초기화
            stateManager_1.initializeFolderPath();
            // 이벤트 리스너 설정
            eventManager_1.setupEventListeners();
            // 안전한 워크스페이스 이벤트 리스너 설정
            setupSafeWorkspaceListener(csInterface, uiManager_1, stateManager_1, eventManager_1);
            // 안전한 복원 상태 체크 및 자동 로드
            setTimeout(function () {
                // 안전한 복원으로 인한 상태 복원 체크
                var safeRestorePath = localStorage.getItem('jscedithelper_safe_restore_path');
                if (safeRestorePath) {
                    utils.logDebug("🔄 Detected safe workspace restore, recovering path:", safeRestorePath);
                    localStorage.removeItem('jscedithelper_safe_restore_path'); // 일회성 사용 후 제거
                    // 안전하게 복원된 경로로 설정
                    stateManager_1.saveFolderPath(safeRestorePath);
                    uiManager_1.updateStatus("워크스페이스 변경 후 안전하게 복원되었습니다.", true);
                    // 효과음 목록 자동 로드
                    setTimeout(function () {
                        eventManager_1.refreshSoundButtons();
                    }, 200);
                }
                else {
                    // 기존 로직: 일반적인 앱 시작 시
                    var currentPath = stateManager_1.getCurrentFolderPath();
                    if (currentPath && window.JSCUtils && window.JSCUtils.isValidPath(currentPath)) {
                        utils.logDebug("Auto-loading sound files from: " + currentPath);
                        uiManager_1.updateStatus("저장된 폴더에서 효과음 목록을 불러오는 중...", true);
                        // 자동 새로고침 실행
                        eventManager_1.refreshSoundButtons();
                    }
                }
            }, 500); // UI가 완전히 준비된 후 실행
            // 엔진 상태 확인 및 디버그 정보 표시
            checkEngineStatus();
            utils.logDebug("JSCEditHelper initialized successfully");
            // 초기화 성공 플래그 설정
            JSCApp._initialized = true;
            return true;
        }
        catch (e) {
            utils.logError("JSCEditHelper initialization error:", e);
            return false;
        }
    }
    // 안전한 워크스페이스 이벤트 리스너 (Phase 1-3 통합)
    function setupSafeWorkspaceListener(csInterface, uiManager, stateManager, eventManager) {
        var utils = getUtils();
        try {
            utils.logDebug("🛡️ Setting up SAFE workspace change listener...");
            // 복원 실행 중인지 추적 (무한 루프 방지)
            var isRestoring_1 = false;
            var lastWorkspaceChange_1 = 0;
            csInterface.addEventListener("com.adobe.csxs.events.WorkspaceChanged", function () {
                var now = Date.now();
                // 너무 빈번한 호출 방지 (1초 내 중복 호출 무시)
                if (now - lastWorkspaceChange_1 < 1000) {
                    utils.logDebug("🛡️ Workspace change too frequent, ignoring...");
                    return;
                }
                lastWorkspaceChange_1 = now;
                utils.logDebug("🔄 Workspace changed detected - starting SAFE monitoring...");
                // 즉시 DOM 보호 시도
                var quickCheck = document.getElementById("content");
                if (!quickCheck || quickCheck.children.length === 0) {
                    utils.logDebug("🚨 DOM already compromised, immediate protection!");
                    window.location.reload();
                    return;
                }
                // Phase 1: 1초 대기로 단축 (UI 보호 우선)
                setTimeout(function () {
                    if (isRestoring_1) {
                        utils.logDebug("🛡️ Already restoring, skipping...");
                        return;
                    }
                    try {
                        // Phase 2: 비침입적 상태 체크
                        var healthCheck = performHealthCheck_1();
                        utils.logDebug("🔍 Health check result:", healthCheck);
                        if (healthCheck.isHealthy) {
                            utils.logDebug("✅ UI is healthy, no restoration needed");
                            return;
                        }
                        // Phase 3: 충돌 위험 체크
                        var conflictRisk = detectConflictRisk_1();
                        if (conflictRisk.hasRisk) {
                            utils.logDebug("⚠️ Conflict risk detected, skipping restoration:", conflictRisk.reason);
                            showSafetyMessage_1(uiManager, "워크스페이스 충돌 위험으로 자동 복원을 건너뜁니다.");
                            return;
                        }
                        // Phase 4: 공격적 복원 실행 (UI 보호 우선)
                        executeAggressiveRestoration_1(healthCheck, uiManager, stateManager, eventManager);
                    }
                    catch (error) {
                        utils.logError("🚨 Error during safe workspace handling:", error);
                        showSafetyMessage_1(uiManager, "워크스페이스 복원 중 오류가 발생했습니다.");
                    }
                }, 1000); // 1초로 단축 (UI 보호 우선)
            });
            // 헬스 체크 함수
            var performHealthCheck_1 = function () {
                var contentDiv = document.getElementById("content");
                var hasContent = contentDiv && contentDiv.children.length > 0;
                var hasButtons = document.querySelectorAll('button').length > 0;
                var hasCSS = window.getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)';
                return {
                    isHealthy: hasContent && hasButtons && hasCSS,
                    issues: {
                        missingContent: !hasContent,
                        missingButtons: !hasButtons,
                        missingCSS: !hasCSS
                    }
                };
            };
            // 충돌 위험 감지 함수
            var detectConflictRisk_1 = function () {
                // 다른 CEP 확장들이 복원 중인지 감지
                var otherExtensions = document.querySelectorAll('[id*="Premiere"], [id*="composer"], [class*="premiere"]');
                var recentErrors = performance.getEntriesByType ? performance.getEntriesByType('navigation').length > 1 : false;
                if (otherExtensions.length > 0) {
                    return { hasRisk: true, reason: "Other Premiere extensions detected" };
                }
                if (recentErrors) {
                    return { hasRisk: true, reason: "Recent navigation errors detected" };
                }
                return { hasRisk: false, reason: "Safe to proceed" };
            };
            // 공격적 복원 실행 함수 (UI 보호 우선)
            var executeAggressiveRestoration_1 = function (healthCheck, uiManager, stateManager, _eventManager) {
                isRestoring_1 = true;
                utils.logDebug("🔧 Executing SAFE restoration...");
                try {
                    // 문제가 있으면 즉시 새로고침 (UI 보호 우선)
                    if (!healthCheck.isHealthy) {
                        utils.logDebug("🚨 UI compromised, immediate reload to protect visibility!");
                        // 상태 저장
                        var currentPath = stateManager.getCurrentFolderPath();
                        if (currentPath) {
                            localStorage.setItem('jscedithelper_safe_restore_path', currentPath);
                            utils.logDebug("💾 Saved path for restoration:", currentPath);
                        }
                        // 즉시 새로고침
                        window.location.reload();
                        return;
                    }
                    uiManager.updateStatus("워크스페이스 상태가 복원되었습니다.", true);
                }
                catch (error) {
                    utils.logError("🚨 Safe restoration failed:", error);
                    showSafetyMessage_1(uiManager, "복원 실패: 수동으로 플러그인을 다시 열어주세요.");
                }
                finally {
                    // 복원 플래그 해제 (5초 후)
                    setTimeout(function () {
                        isRestoring_1 = false;
                    }, 5000);
                }
            };
            // 안전 메시지 표시 함수
            var showSafetyMessage_1 = function (uiManager, message) {
                try {
                    uiManager.updateStatus(message, false);
                }
                catch (e) {
                    utils.logDebug("Safety message:", message);
                }
            };
            utils.logDebug("✅ Safe workspace listener registered successfully");
        }
        catch (error) {
            utils.logError("🚨 Failed to setup safe workspace listener:", error);
        }
    }
    // 엔진 상태 확인 함수
    function checkEngineStatus() {
        var utils = getUtils();
        var debugInfo = "=== JSCEditHelper 엔진 상태 ===\n";
        debugInfo += "\uCD08\uAE30\uD654 \uC2DC\uAC04: ".concat(new Date().toISOString(), "\n\n");
        // DI 컨테이너 상태 확인
        debugInfo += "Dependency Injection:\n";
        if (window.DI) {
            debugInfo += "- DI Container: ✓ 활성화됨\n";
            try {
                var requiredServices = ['JSCUtils', 'JSCUIManager', 'JSCStateManager', 'JSCCommunication', 'JSCEventManager'];
                var validation = window.DI.validateDependencies(requiredServices);
                debugInfo += "- \uD544\uC218 \uC11C\uBE44\uC2A4: ".concat(validation.isValid ? "✓ 모두 등록됨" : "✗ 일부 누락", "\n");
                if (!validation.isValid) {
                    debugInfo += "- \uB204\uB77D\uB41C \uC11C\uBE44\uC2A4: ".concat(validation.missing.join(', '), "\n");
                }
            }
            catch (e) {
                debugInfo += "- DI \uAC80\uC99D \uC624\uB958: ".concat(e.message, "\n");
            }
        }
        else {
            debugInfo += "- DI Container: ✗ 비활성화됨 (레거시 모드)\n";
        }
        debugInfo += "\n";
        // 기본 모듈 확인
        debugInfo += "기본 모듈:\n";
        debugInfo += "- JSCUtils: ".concat(window.JSCUtils ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- JSCUIManager: ".concat(window.JSCUIManager ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- JSCStateManager: ".concat(window.JSCStateManager ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- JSCCommunication: ".concat(window.JSCCommunication ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- JSCEventManager: ".concat(window.JSCEventManager ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- JSCErrorHandler: ".concat(window.JSCErrorHandler ? "✓ 로드됨" : "✗ 없음", "\n\n");
        // TypeScript 엔진 확인
        debugInfo += "TypeScript 엔진:\n";
        debugInfo += "- AudioFileProcessor: ".concat(window.AudioFileProcessor ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- ClipTimeCalculator: ".concat(window.ClipTimeCalculator ? "✓ 로드됨" : "✗ 없음", "\n");
        debugInfo += "- SoundEngine: ".concat(window.SoundEngine ? "✓ 로드됨" : "✗ 없음", "\n\n");
        // SoundEngine 상세 상태
        if (window.SoundEngine) {
            try {
                var engineStatus = window.SoundEngine.getEngineStatus();
                debugInfo += "SoundEngine 상태:\n";
                debugInfo += "- \uC900\uBE44 \uC0C1\uD0DC: ".concat(engineStatus.isReady ? "✓ 준비됨" : "✗ 준비되지 않음", "\n");
                if (!engineStatus.isReady) {
                    debugInfo += "- \uB204\uB77D\uB41C \uC758\uC874\uC131: ".concat(engineStatus.dependencies.join(', '), "\n");
                }
            }
            catch (e) {
                debugInfo += "- SoundEngine \uC0C1\uD0DC \uD655\uC778 \uC624\uB958: ".concat(e.message, "\n");
            }
        }
        // 디버그 정보를 전역 변수에 저장하고 디버그 버튼 표시
        window.lastDebugInfo = debugInfo;
        if (window.JSCUIManager) {
            window.JSCUIManager.toggleDebugButton(true);
        }
        utils.logDebug(debugInfo);
    }
    // 공개 API
    return {
        initialize: initialize
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCApp = JSCApp;
}
// 애플리케이션 시작 - 여러 방법으로 시도
function startApp() {
    var utils = window.JSCUtils || { logDebug: console.log, logError: console.error };
    try {
        if (window.JSCApp) {
            utils.logDebug('Starting JSCEditHelper...');
            var success = window.JSCApp.initialize();
            if (!success) {
                utils.logError('App initialization failed');
                // 재시도
                setTimeout(function () {
                    utils.logDebug('Retrying initialization...');
                    if (window.JSCApp) {
                        window.JSCApp.initialize();
                    }
                }, 1000);
            }
        }
        else {
            utils.logError('JSCApp not available');
        }
    }
    catch (e) {
        utils.logError('App startup error:', e);
    }
}
// 여러 이벤트에서 초기화 시도
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
}
else {
    // 이미 로드된 경우 즉시 실행
    startApp();
}
// 백업으로 window.onload도 사용
window.addEventListener('load', function () {
    var utils = window.JSCUtils || { logDebug: console.log };
    // DOMContentLoaded에서 실패한 경우를 위한 백업
    if (!window.JSCApp || !window.JSCApp._initialized) {
        utils.logDebug('Backup initialization attempt...');
        startApp();
    }
});
//# sourceMappingURL=app.js.map