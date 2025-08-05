/**
 * JSCEditHelper - Main Application
 * 모듈들을 초기화하고 애플리케이션을 시작하는 메인 파일
 */

interface JSCAppInterface {
    initialize(): boolean;
    _initialized?: boolean;
}

const JSCApp = (function(): JSCAppInterface {
    'use strict';
    
    // 디버그 UI 설정
    function setupDebugUI(): void {
        // 이미 존재하는지 확인
        if (document.getElementById("debug-button")) {
            return;
        }

        // 결과 영역에 디버그 버튼과 디버그 정보 영역 추가
        const resultSection = document.querySelector(".result-section");
        if (!resultSection) return;

        // 디버그 버튼 생성
        const debugButton = document.createElement("button");
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
        const debugInfo = document.createElement("div");
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
        const closeDebugButton = document.createElement("button");
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
    function checkDependencies(): boolean {
        const requiredModules = [
            'JSCUtils', 'JSCUIManager', 'JSCStateManager', 
            'JSCCommunication', 'JSCEventManager'
        ];
        
        for (const moduleName of requiredModules) {
            if (!(window as any)[moduleName]) {
                console.error('Required module not loaded: ' + moduleName);
                return false;
            }
        }
        return true;
    }
    
    // DI 컨테이너 초기화 및 서비스 등록
    function initializeDependencyInjection(): boolean {
        try {
            console.log("Initializing Dependency Injection container...");
            
            // DI 컨테이너가 사용 가능한지 확인
            if (!(window as any).DI) {
                console.error('DI container not available');
                return false;
            }
            
            // 모든 서비스를 DI 컨테이너에 등록
            const services = [
                { key: 'JSCUtils', factory: () => (window as any).JSCUtils },
                { key: 'JSCUIManager', factory: () => (window as any).JSCUIManager },
                { key: 'JSCStateManager', factory: () => (window as any).JSCStateManager },
                { key: 'JSCCommunication', factory: () => (window as any).JSCCommunication },
                { key: 'JSCEventManager', factory: () => (window as any).JSCEventManager },
                { key: 'JSCErrorHandler', factory: () => (window as any).JSCErrorHandler },
                { key: 'SoundEngine', factory: () => (window as any).SoundEngine },
                { key: 'AudioFileProcessor', factory: () => (window as any).AudioFileProcessor },
                { key: 'ClipTimeCalculator', factory: () => (window as any).ClipTimeCalculator },
                { key: 'TextProcessor', factory: () => (window as any).TextProcessor }
            ];
            
            // 서비스 등록
            for (const service of services) {
                try {
                    (window as any).DI.register(service.key, service.factory);
                    console.log(`✓ Registered service: ${service.key}`);
                } catch (error) {
                    console.warn(`⚠ Failed to register service: ${service.key}`, error);
                }
            }
            
            // 필수 의존성 검증
            const requiredServices = ['JSCUtils', 'JSCUIManager', 'JSCStateManager', 'JSCCommunication', 'JSCEventManager'];
            const validation = (window as any).DI.validateDependencies(requiredServices);
            
            if (!validation.isValid) {
                console.error('DI validation failed. Missing services:', validation.missing);
                return false;
            }
            
            console.log("✓ DI container initialized successfully");
            return true;            
        } catch (error) {
            console.error("DI initialization error:", error);
            return false;
        }
    }
    
    // 애플리케이션 초기화
    function initialize(): boolean {
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
            const communication = (window as any).DI?.get('JSCCommunication') || (window as any).JSCCommunication;
            const uiManager = (window as any).DI?.get('JSCUIManager') || (window as any).JSCUIManager;
            const stateManager = (window as any).DI?.get('JSCStateManager') || (window as any).JSCStateManager;
            const eventManager = (window as any).DI?.get('JSCEventManager') || (window as any).JSCEventManager;
            
            // 통신 모듈 초기화
            const csInterface = communication.initialize();
            
            // 테마 설정
            uiManager.updateThemeWithAppSkinInfo(csInterface);
            
            // 상태 초기화
            stateManager.initializeFolderPath();
            
            // 이벤트 리스너 설정
            eventManager.setupEventListeners();
            
            // 엔진 상태 확인 및 디버그 정보 표시
            checkEngineStatus();
            
            console.log("JSCEditHelper initialized successfully");
            // 초기화 성공 플래그 설정
            (JSCApp as any)._initialized = true;
            return true;
        } catch (e) {
            console.error("JSCEditHelper initialization error:", e);
            return false;
        }
    }
    
    // 엔진 상태 확인 함수
    function checkEngineStatus(): void {
        let debugInfo = "=== JSCEditHelper 엔진 상태 ===\n";
        debugInfo += `초기화 시간: ${new Date().toISOString()}\n\n`;
        
        // DI 컨테이너 상태 확인
        debugInfo += "Dependency Injection:\n";
        if ((window as any).DI) {
            debugInfo += "- DI Container: ✓ 활성화됨\n";
            try {
                const requiredServices = ['JSCUtils', 'JSCUIManager', 'JSCStateManager', 'JSCCommunication', 'JSCEventManager'];
                const validation = (window as any).DI.validateDependencies(requiredServices);
                debugInfo += `- 필수 서비스: ${validation.isValid ? "✓ 모두 등록됨" : "✗ 일부 누락"}\n`;
                if (!validation.isValid) {
                    debugInfo += `- 누락된 서비스: ${validation.missing.join(', ')}\n`;
                }
            } catch (e) {
                debugInfo += `- DI 검증 오류: ${(e as Error).message}\n`;
            }
        } else {
            debugInfo += "- DI Container: ✗ 비활성화됨 (레거시 모드)\n";
        }
        debugInfo += "\n";
        
        // 기본 모듈 확인
        debugInfo += "기본 모듈:\n";
        debugInfo += `- JSCUtils: ${(window as any).JSCUtils ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- JSCUIManager: ${(window as any).JSCUIManager ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- JSCStateManager: ${(window as any).JSCStateManager ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- JSCCommunication: ${(window as any).JSCCommunication ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- JSCEventManager: ${(window as any).JSCEventManager ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- JSCErrorHandler: ${(window as any).JSCErrorHandler ? "✓ 로드됨" : "✗ 없음"}\n\n`;
        
        // TypeScript 엔진 확인
        debugInfo += "TypeScript 엔진:\n";
        debugInfo += `- AudioFileProcessor: ${(window as any).AudioFileProcessor ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- ClipTimeCalculator: ${(window as any).ClipTimeCalculator ? "✓ 로드됨" : "✗ 없음"}\n`;
        debugInfo += `- SoundEngine: ${(window as any).SoundEngine ? "✓ 로드됨" : "✗ 없음"}\n\n`;
        
        // SoundEngine 상세 상태
        if ((window as any).SoundEngine) {
            try {
                const engineStatus = (window as any).SoundEngine.getEngineStatus();
                debugInfo += "SoundEngine 상태:\n";
                debugInfo += `- 준비 상태: ${engineStatus.isReady ? "✓ 준비됨" : "✗ 준비되지 않음"}\n`;
                if (!engineStatus.isReady) {
                    debugInfo += `- 누락된 의존성: ${engineStatus.dependencies.join(', ')}\n`;
                }
            } catch (e) {
                debugInfo += `- SoundEngine 상태 확인 오류: ${(e as Error).message}\n`;
            }
        }
        
        // 디버그 정보를 전역 변수에 저장하고 디버그 버튼 표시
        (window as any).lastDebugInfo = debugInfo;
        if ((window as any).JSCUIManager) {
            (window as any).JSCUIManager.toggleDebugButton(true);
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
function startApp(): void {
    try {
        if (window.JSCApp) {
            console.log('Starting JSCEditHelper...');
            const success = window.JSCApp.initialize();
            if (!success) {
                console.error('App initialization failed');
                // 재시도
                setTimeout(function() {
                    console.log('Retrying initialization...');
                    window.JSCApp.initialize();
                }, 1000);
            }
        } else {
            console.error('JSCApp not available');
        }
    } catch (e) {
        console.error('App startup error:', e);
    }
}

// 여러 이벤트에서 초기화 시도
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    // 이미 로드된 경우 즉시 실행
    startApp();
}

// 백업으로 window.onload도 사용
window.addEventListener('load', function() {
    // DOMContentLoaded에서 실패한 경우를 위한 백업
    if (!window.JSCApp || !(window.JSCApp as any)._initialized) {
        console.log('Backup initialization attempt...');
        startApp();
    }
});