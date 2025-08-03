/**
 * JSCEditHelper - Event Manager
 * 사용자 이벤트 처리를 담당하는 모듈
 */

interface JSCEventManagerInterface {
    setupEventListeners(): void;
    handleSoundFileButtonClick(event: Event): void;
}

const JSCEventManager = (function(): JSCEventManagerInterface {
    'use strict';
    
    // 이벤트 리스너 설정
    function setupEventListeners(): void {
        try {
            console.log('Setting up event listeners...');
            setupInsertSoundsButton();
            setupBrowseFolderButton();
            setupRefreshButton();
            setupMagnetButton();
            setupFolderInput();
            setupDebugUI();
            console.log('Event listeners setup completed');
        } catch (e) {
            console.error('Event listeners setup failed:', (e as Error).message);
        }
    }
    
    // 효과음 삽입 버튼 이벤트
    function setupInsertSoundsButton(): void {
        const insertButton = document.getElementById("insert-sounds");
        if (insertButton) {
            insertButton.addEventListener("click", insertSounds);
            console.log("Event listener added to insert-sounds button");
        } else {
            console.warn("Button with ID 'insert-sounds' not found.");
        }
    }
    
    // 폴더 찾기 버튼 이벤트
    function setupBrowseFolderButton(): void {
        const browseButton = document.getElementById("browseFolder");
        if (browseButton) {
            browseButton.addEventListener("click", browseSoundFolder);
            window.JSCUtils.debugLog("Event listener added to browseFolder button");
        } else {
            console.error("Button with ID 'browseFolder' not found.");
        }
    }
    
    // 새로고침 버튼 이벤트
    function setupRefreshButton(): void {
        const refreshButton = document.getElementById("refreshSounds");
        if (refreshButton) {
            refreshButton.addEventListener("click", refreshSoundButtons);
            window.JSCUtils.debugLog("Event listener added to refreshSounds button");
        } else {
            console.error("Button with ID 'refreshSounds' not found.");
        }
    }
    
    // 마그넷 버튼 이벤트
    function setupMagnetButton(): void {
        const magnetButton = document.getElementById("magnetClips");
        if (magnetButton) {
            magnetButton.addEventListener("click", magnetClips);
            window.JSCUtils.debugLog("Event listener added to magnetClips button");
        } else {
            console.error("Button with ID 'magnetClips' not found.");
        }
    }
    
    // 폴더 입력 필드 이벤트
    function setupFolderInput(): void {
        const folderInput = document.getElementById("sound-folder") as HTMLInputElement;
        if (folderInput) {
            folderInput.addEventListener("change", function(this: HTMLInputElement) {
                const inputPath = this.value.trim();
                window.JSCUtils.debugLog("Folder input changed: " + inputPath);
                
                if (inputPath && window.JSCUtils && window.JSCUtils.isValidPath(inputPath)) {
                    if (window.JSCStateManager) {
                        window.JSCStateManager.saveFolderPath(inputPath);
                        console.log("Valid path stored: " + inputPath);
                    }
                } else {
                    if (inputPath) {
                        console.warn("Invalid path entered: " + inputPath);
                        if (window.JSCUIManager) {
                            window.JSCUIManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        }
                        if (window.JSCStateManager) {
                            this.value = window.JSCStateManager.getCurrentFolderPath(); // 이전 유효한 경로로 복원
                        }
                    } else {
                        if (window.JSCStateManager) {
                            window.JSCStateManager.clearFolderPath();
                        }
                        console.log("Path cleared");
                    }
                }
            });
            window.JSCUtils.debugLog("Event listener added to sound-folder input");
        } else {
            console.error("Input with ID 'sound-folder' not found.");
        }
    }
    
    // 디버그 UI 이벤트
    function setupDebugUI(): void {
        setupDebugButton();
        setupCloseDebugButton();
    }
    
    function setupDebugButton(): void {
        const debugButton = document.getElementById("debug-button");
        if (debugButton) {
            debugButton.addEventListener("click", function() {
                window.JSCUIManager.showDebugInfo();
            });
        }
    }
    
    function setupCloseDebugButton(): void {
        const closeDebugButton = document.getElementById("close-debug-button");
        if (closeDebugButton) {
            closeDebugButton.addEventListener("click", function(this: HTMLElement) {
                const debugInfo = document.getElementById("debug-info");
                if (debugInfo) debugInfo.style.display = "none";
                this.style.display = "none";
            });
        }
    }
    
    // 효과음 삽입 처리
    function insertSounds(): void {
        try {
            if (!window.JSCStateManager) {
                console.error('JSCStateManager not available');
                return;
            }
            
            // 간단한 상태 검증
            const validation = window.JSCStateManager.validateState();
            if (!validation.isValid) {
                if (window.JSCUIManager) {
                    window.JSCUIManager.updateStatus(validation.errors[0], false);
                }
                return;
            }
            
            const settings = window.JSCStateManager.getSettings();
        
            // Update status message
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("효과음 삽입 중...", true);
                
                // Reset UI state
                window.JSCUIManager.displaySoundList([]);
                window.JSCUIManager.resetDebugUI();
            }
        
            // Clean folder path
            let cleanFolderPath = settings.folderPath.trim();
            if (cleanFolderPath.indexOf('"') !== -1 || cleanFolderPath.indexOf("'") !== -1) {
                cleanFolderPath = cleanFolderPath.replace(/["']/g, "");
            }
            
            const jsxCode = "insertSoundsBetweenClips(" + 
                         JSON.stringify(cleanFolderPath) + ", " + 
                         JSON.stringify(settings.audioTrack) + ")";
            
            if (window.JSCCommunication) {
                window.JSCCommunication.callExtendScript(jsxCode, function(result: string) {
                    console.log("Sound insertion result: " + result);
                    if (result === "false") {
                        console.log("Sound insertion failed - check the event listener for details");
                    }
                });
            }
        } catch (e) {
            console.error("Sound insertion failed:", (e as Error).message);
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("효과음 삽입 중 오류가 발생했습니다.", false);
            }
        }
    }
    
    // 폴더 찾기 처리
    function browseSoundFolder(): void {
        if (window.JSCCommunication) {
            window.JSCCommunication.callExtendScript("browseSoundFolder()", function(result: string) {
                console.log("Browse folder result: " + result);
                
                if (result && result !== "undefined" && result !== "" && 
                    window.JSCUtils && window.JSCUtils.isValidPath(result)) {
                    if (window.JSCStateManager) {
                        window.JSCStateManager.saveFolderPath(result);
                        console.log("Valid path set: " + result);
                    }
                } else {
                    if (result && result !== "undefined" && result !== "") {
                        console.warn("Invalid path received from ExtendScript: " + result);
                        if (window.JSCUIManager) {
                            window.JSCUIManager.updateStatus("올바른 폴더를 선택해주세요.", false);
                        }
                    } else {
                        console.log("No folder selected or empty result");
                    }
                }
            });
        }
    }
    
    // 새로고침 처리
    function refreshSoundButtons(): void {
        const currentPath = window.JSCStateManager.getCurrentFolderPath();
        window.JSCUtils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);
        
        if (currentPath && window.JSCUtils.isValidPath(currentPath)) {
            window.JSCUIManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
            window.JSCUIManager.updateStatus(
                "'" + window.JSCUtils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...",
                true
            );
            
            const pathArg = JSON.stringify(currentPath);
            window.JSCUtils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg);
            
            window.JSCCommunication.callExtendScript(
                "getFilesForPathCS(" + pathArg + ")",
                function(result: string) {
                    window.JSCUtils.debugLog("refreshSoundButtons: evalScript callback result: " + result);
                    if (typeof result === "string" && result.indexOf("error:") === 0) {
                        window.JSCUIManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다.", false);
                    }
                }
            );
        } else {
            if (currentPath && !window.JSCUtils.isValidPath(currentPath)) {
                console.warn("currentFolderPath is invalid, clearing it: " + currentPath);
                window.JSCStateManager.clearFolderPath();
                window.JSCUIManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
            } else {
                console.warn("currentFolderPath is empty or invalid. Aborting refresh.");
                window.JSCUIManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
            }
        }
    }
    
    // 클립 자동 정렬 처리
    function magnetClips(): void {
        window.JSCUtils.debugLog("magnetClips() called");
        
        window.JSCUIManager.updateStatus("클립 자동 정렬 중...", true);
        
        const magnetStatus = document.getElementById("magnetStatus");
        if (magnetStatus) {
            magnetStatus.textContent = "처리 중...";
            magnetStatus.style.color = "#007acc";
        }
        
        window.JSCUIManager.resetDebugUI();
        
        window.JSCCommunication.callExtendScript("magnetClipsInSequence()", function(result: string) {
            window.JSCUtils.debugLog("magnetClipsInSequence result: " + result);
            
            if (result === "true") {
                window.JSCUtils.debugLog("클립 자동 정렬 성공");
            } else {
                window.JSCUtils.debugLog("클립 자동 정렬 실패 또는 오류 발생");
            }
        });
    }
    
    // 개별 효과음 버튼 클릭 처리
    function handleSoundFileButtonClick(event: Event): void {
        const target = event.target as HTMLElement;
        const soundFsName = target.getAttribute("data-fsname");
        const soundDisplayName = target.textContent;

        if (soundFsName) {
            console.log("Replacing with sound file: " + soundFsName);
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);
            }
            
            if (window.JSCCommunication) {
                window.JSCCommunication.callExtendScript(
                    "replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")",
                    function(result: string) {
                        console.log("replaceSelectedAudioClips call result: " + result);
                    }
                );
            }
        } else {
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