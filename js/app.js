"use strict";
/**
 * JSCEditHelper - Main Application
 * 모듈들을 초기화하고 애플리케이션을 시작하는 메인 파일
 */
var JSCApp = (function () {
    'use strict';
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
        var requiredModules = [
            'JSCUtils', 'JSCUIManager', 'JSCStateManager',
            'JSCCommunication', 'JSCEventManager'
        ];
        for (var _i = 0, requiredModules_1 = requiredModules; _i < requiredModules_1.length; _i++) {
            var moduleName = requiredModules_1[_i];
            if (!window[moduleName]) {
                console.error('Required module not loaded: ' + moduleName);
                return false;
            }
        }
        return true;
    }
    // DI 컨테이너 초기화 및 서비스 등록
    function initializeDependencyInjection() {
        try {
            console.log("Initializing Dependency Injection container...");
            // DI 컨테이너가 사용 가능한지 확인
            if (!window.DI) {
                console.error('DI container not available');
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
                    console.log("\u2713 Registered service: ".concat(service.key));
                }
                catch (error) {
                    console.warn("\u26A0 Failed to register service: ".concat(service.key), error);
                }
            }
            // 필수 의존성 검증
            var requiredServices = ['JSCUtils', 'JSCUIManager', 'JSCStateManager', 'JSCCommunication', 'JSCEventManager'];
            var validation = window.DI.validateDependencies(requiredServices);
            if (!validation.isValid) {
                console.error('DI validation failed. Missing services:', validation.missing);
                return false;
            }
            console.log("✓ DI container initialized successfully");
            return true;
        }
        catch (error) {
            console.error("DI initialization error:", error);
            return false;
        }
    }
    // 애플리케이션 초기화
    function initialize() {
        var _a, _b, _c, _d;
        try {
            // 의존성 확인
            if (!checkDependencies()) {
                console.error('JSCEditHelper initialization failed: Missing dependencies');
                return false;
            }
            console.log("JSCEditHelper initializing...");
            // DI 컨테이너 초기화 (Phase 1.1)
            if (!initializeDependencyInjection()) {
                console.warn('DI initialization failed, falling back to legacy mode');
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
            // 테마 설정
            uiManager_1.updateThemeWithAppSkinInfo(csInterface);
            // 상태 초기화
            stateManager_1.initializeFolderPath();
            // 이벤트 리스너 설정
            eventManager_1.setupEventListeners();
            // 폴더 경로가 설정되어 있으면 자동으로 효과음 목록 로드
            setTimeout(function () {
                var currentPath = stateManager_1.getCurrentFolderPath();
                if (currentPath && window.JSCUtils && window.JSCUtils.isValidPath(currentPath)) {
                    console.log("Auto-loading sound files from: " + currentPath);
                    uiManager_1.updateStatus("저장된 폴더에서 효과음 목록을 불러오는 중...", true);
                    // 자동 새로고침 실행
                    eventManager_1.refreshSoundButtons();
                }
            }, 500); // UI가 완전히 준비된 후 실행
            // 엔진 상태 확인 및 디버그 정보 표시
            checkEngineStatus();
            console.log("JSCEditHelper initialized successfully");
            // 초기화 성공 플래그 설정
            JSCApp._initialized = true;
            return true;
        }
        catch (e) {
            console.error("JSCEditHelper initialization error:", e);
            return false;
        }
    }
    // 엔진 상태 확인 함수
    function checkEngineStatus() {
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
        console.log(debugInfo);
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
    try {
        if (window.JSCApp) {
            console.log('Starting JSCEditHelper...');
            var success = window.JSCApp.initialize();
            if (!success) {
                console.error('App initialization failed');
                // 재시도
                setTimeout(function () {
                    console.log('Retrying initialization...');
                    window.JSCApp.initialize();
                }, 1000);
            }
        }
        else {
            console.error('JSCApp not available');
        }
    }
    catch (e) {
        console.error('App startup error:', e);
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
    // DOMContentLoaded에서 실패한 경우를 위한 백업
    if (!window.JSCApp || !window.JSCApp._initialized) {
        console.log('Backup initialization attempt...');
        startApp();
    }
});
//# sourceMappingURL=app.js.map