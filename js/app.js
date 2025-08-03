/**
 * JSCEditHelper - Main Application
 * 모듈들을 초기화하고 애플리케이션을 시작하는 메인 파일
 */

var JSCApp = (function() {
    'use strict';
    
    // 디버그 UI 설정
    function setupDebugUI() {
        // 이미 존재하는지 확인
        if (document.getElementById("debug-button")) {
            return;
        }

        // 결과 영역에 디버그 버튼과 디버그 정보 영역 추가
        var resultSection = document.querySelector(".result-section");
        if (!resultSection) return;

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
        
        for (var i = 0; i < requiredModules.length; i++) {
            if (!window[requiredModules[i]]) {
                console.error('Required module not loaded: ' + requiredModules[i]);
                return false;
            }
        }
        return true;
    }
    
    // 애플리케이션 초기화
    function initialize() {
        try {
            // 의존성 확인
            if (!checkDependencies()) {
                console.error('JSCEditHelper initialization failed: Missing dependencies');
                return false;
            }
            
            console.log("JSCEditHelper initializing...");
            
            // 디버그 UI 설정
            setupDebugUI();
            
            // 통신 모듈 초기화
            var csInterface = window.JSCCommunication.initialize();
            
            // 테마 설정
            window.JSCUIManager.updateThemeWithAppSkinInfo(csInterface);
            
            // 상태 초기화
            window.JSCStateManager.initializeFolderPath();
            
            // 이벤트 리스너 설정
            window.JSCEventManager.setupEventListeners();
            
            console.log("JSCEditHelper initialized successfully");
            // 초기화 성공 플래그 설정
            JSCApp._initialized = true;
            return true;
        } catch (e) {
            console.error("JSCEditHelper initialization error:", e);
            return false;
        }
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
    if (!window.JSCApp || !window.JSCApp._initialized) {
        console.log('Backup initialization attempt...');
        startApp();
    }
});