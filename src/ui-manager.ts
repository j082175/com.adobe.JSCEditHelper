/**
 * JSCEditHelper - UI Manager
 * UI 상태 관리 및 업데이트를 담당하는 모듈
 */

/// <reference path="../types/cep.d.ts" />

interface SoundFile {
    name: string;
    fsName: string;
}

interface JSCUIManagerInterface {
    updateStatus(message: string, isSuccess?: boolean): void;
    updateMagnetStatus(isSuccess: boolean, clipsMoved?: number, gapsRemoved?: number): void;
    displaySoundList(soundList: string[]): void;
    updateSoundButtons(soundFiles: SoundFile[], currentFolderPath: string): void;
    updateFolderPath(path: string): void;
    toggleDebugButton(show: boolean): void;
    showDebugInfo(): void;
    resetDebugUI(): void;
    updateThemeWithAppSkinInfo(csInterface: any): void;
    getDIStatus(): { isDIAvailable: boolean; dependencies: string[] }; // Phase 2.1
}

const JSCUIManager = (function(): JSCUIManagerInterface {
    'use strict';
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    let eventService: any = null;
    
    try {
        diContainer = (window as any).DI;
        if (diContainer) {
            // DI에서 서비스 가져오기 시도
            utilsService = diContainer.getSafe('JSCUtils');
            eventService = diContainer.getSafe('JSCEventManager');
        }
    } catch (e) {
        // DI 사용 불가시 레거시 모드로 작동
    }
    
    // 유틸리티 서비스 가져오기 (DI 우선, 레거시 fallback)
    function getUtils(): any {
        return utilsService || window.JSCUtils || {
            getShortPath: (path: string) => path,
            isValidPath: (path: string) => !!path
        };
    }
    
    // 이벤트 서비스 가져오기 (DI 우선, 레거시 fallback)
    function getEventManager(): any {
        return eventService || window.JSCEventManager || null;
    }
    
    // 상태 메시지 업데이트
    function updateStatus(message: string, isSuccess?: boolean): void {
        const statusElement = document.getElementById("status-message");
        
        if (!statusElement) {
            console.error("Status element not found");
            return;
        }

        // 기존 클래스 제거
        statusElement.classList.remove("success", "error");

        // 성공/실패에 따른 클래스 추가
        if (isSuccess === true) {
            statusElement.classList.add("success");
        } else if (isSuccess === false) {
            statusElement.classList.add("error");

            // 오류 발생 시 디버그 버튼 표시 (디버그 정보가 있을 경우)
            if ((window as any).lastDebugInfo) {
                toggleDebugButton(true);
            }
        }

        statusElement.textContent = message;
    }
    
    // 마그넷 상태 업데이트
    function updateMagnetStatus(isSuccess: boolean, clipsMoved?: number, gapsRemoved?: number): void {
        const magnetStatus = document.getElementById("magnetStatus");
        if (!magnetStatus) return;
        
        if (isSuccess) {
            magnetStatus.textContent = "완료: " + (clipsMoved || 0) + "개 클립 이동, " + (gapsRemoved || 0) + "개 간격 제거";
            magnetStatus.style.color = "#28a745";
        } else {
            magnetStatus.textContent = "오류 발생";
            magnetStatus.style.color = "#dc3545";
        }
        
        // 3초 후 상태 메시지 지우기
        setTimeout(function() {
            magnetStatus.textContent = "";
        }, 3000);
    }
    
    // 효과음 목록 표시
    function displaySoundList(soundList: string[]): void {
        const listContainer = document.getElementById("sound-list");
        if (!listContainer) return;
        
        listContainer.innerHTML = "";

        if (!soundList || soundList.length === 0) {
            listContainer.innerHTML = "<p>삽입된 효과음이 없습니다.</p>";
            return;
        }

        for (let i = 0; i < soundList.length; i++) {
            const soundItem = document.createElement("div");
            soundItem.className = "sound-item";
            soundItem.textContent = (i + 1) + ". " + soundList[i];
            listContainer.appendChild(soundItem);
        }
    }
    
    // 개별 효과음 버튼에 미리보기 이벤트 추가
    function setupAudioPreviewEvent(button: HTMLElement, filePath: string): void {
        // 오른쪽 클릭으로 미리보기 재생/정지 토글
        button.addEventListener('contextmenu', async function(event: MouseEvent) {
            event.preventDefault(); // 기본 컨텍스트 메뉴 방지
            
            try {
                const audioPreview = (window as any).AudioPreviewManager;
                if (audioPreview) {
                    // 현재 재생 중인지 확인
                    if (audioPreview.isPlaying()) {
                        // 현재 버튼과 같은 버튼인지 확인
                        if (audioPreview.isCurrentButton(button)) {
                            // 같은 버튼이면 정지
                            audioPreview.stopCurrentPreviewImmediately();
                        } else {
                            // 다른 버튼이면 새로운 미리보기 재생 (기존 것은 자동으로 정지됨)
                            await audioPreview.playPreview(filePath, button);
                        }
                    } else {
                        // 정지 중이면 재생
                        await audioPreview.playPreview(filePath, button);
                    }
                } else {
                    updateStatus('오디오 미리보기 기능을 사용할 수 없습니다.', false);
                }
            } catch (error) {
                updateStatus(`미리보기 오류: ${(error as Error).message}`, false);
            }
        });
        
        // 미리보기 툴팁 업데이트
        button.title = `좌클릭: 효과음 삽입\n우클릭: 미리보기 재생/정지`;
    }

    // 개별 효과음 버튼 업데이트
    function updateSoundButtons(soundFiles: SoundFile[], currentFolderPath: string): void {
        const container = document.getElementById("individualSoundButtonsContainer");
        const folderPathSpan = document.getElementById("folderPathSpan");
        
        if (!container) return;
        
        container.innerHTML = ""; // 이전 버튼들 제거
        
        if (folderPathSpan && currentFolderPath) {
            const utils = getUtils();
            folderPathSpan.textContent = utils.getShortPath(currentFolderPath);
        }

        if (soundFiles && soundFiles.length > 0) {
            soundFiles.forEach(function(soundFile: SoundFile) {
                if (soundFile && soundFile.name && soundFile.fsName) {
                    const button = document.createElement("button");
                    button.textContent = soundFile.name;
                    button.setAttribute("data-fsname", soundFile.fsName);
                    
                    // 기존 클릭 이벤트 (효과음 삽입)
                    button.addEventListener("click", function(event: Event) {
                        // 이벤트는 나중에 event-manager에서 처리하도록 위임
                        const eventManager = getEventManager();
                        if (eventManager && eventManager.handleSoundFileButtonClick) {
                            eventManager.handleSoundFileButtonClick(event);
                        }
                    });
                    
                    // 미리보기 이벤트 추가
                    setupAudioPreviewEvent(button, soundFile.fsName);
                    
                    container.appendChild(button);
                }
            });
            updateStatus(soundFiles.length + "개의 효과음 파일을 폴더에서 로드했습니다. (우클릭으로 미리보기 가능)", true);
        } else {
            updateStatus("선택된 폴더에 오디오 파일이 없습니다.", false);
        }
    }
    
    // 폴더 경로 UI 업데이트
    function updateFolderPath(path: string): void {
        const folderInput = document.getElementById("sound-folder") as HTMLInputElement;
        const refreshButton = document.getElementById("refreshSounds") as HTMLButtonElement;
        
        if (folderInput) {
            folderInput.value = path || "";
        }
        
        if (refreshButton) {
            const utils = getUtils();
            refreshButton.disabled = !path || !utils.isValidPath(path);
        }
    }
    
    // 디버그 버튼 표시/숨김 설정
    function toggleDebugButton(show: boolean): void {
        const debugButton = document.getElementById("debug-button");
        if (debugButton) {
            debugButton.style.display = show ? "block" : "none";
        }
    }

    // 디버그 정보 표시
    function showDebugInfo(): void {
        const debugInfo = document.getElementById("debug-info");
        const closeButton = document.getElementById("close-debug-button");

        if (debugInfo && (window as any).lastDebugInfo) {
            debugInfo.textContent = (window as any).lastDebugInfo;
            debugInfo.style.display = "block";
            if (closeButton) {
                closeButton.style.display = "block";
            }
        }
    }
    
    // 디버그 UI 초기화
    function resetDebugUI(): void {
        (window as any).lastDebugInfo = null;
        toggleDebugButton(false);
        
        const debugInfo = document.getElementById("debug-info");
        const closeButton = document.getElementById("close-debug-button");
        
        if (debugInfo) debugInfo.style.display = "none";
        if (closeButton) closeButton.style.display = "none";
    }
    
    // Adobe 앱 테마 정보로 UI 업데이트
    function updateThemeWithAppSkinInfo(csInterface: any): void {
        try {
            if (!csInterface || !csInterface.hostEnvironment) {
                console.warn('CSInterface or hostEnvironment not available for theme update');
                return;
            }
            
            const appSkinInfo = csInterface.hostEnvironment.appSkinInfo;
            if (!appSkinInfo || !appSkinInfo.panelBackgroundColor) {
                console.warn('App skin info not available');
                return;
            }
            
            const panelBgColor = appSkinInfo.panelBackgroundColor.color;
            if (!panelBgColor) return;

            // 어두운 테마인지 확인
            const isDarkTheme = panelBgColor.red < 128;

            // 필요에 따라 테마 스타일 전환
            if (!isDarkTheme) {
                // 밝은 테마 스타일 적용
                document.body.classList.add("light-theme");
            }
            
            console.log('Theme updated successfully');
        } catch (e) {
            console.error('Theme update failed:', (e as Error).message);
        }
    }
    
    // DI 상태 확인 함수 (디버깅용) - Phase 2.1
    function getDIStatus(): { isDIAvailable: boolean; dependencies: string[] } {
        const dependencies: string[] = [];
        
        if (utilsService) dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils) dependencies.push('JSCUtils (Legacy)');
        
        if (eventService) dependencies.push('JSCEventManager (DI)');
        else if (window.JSCEventManager) dependencies.push('JSCEventManager (Legacy)');
        
        return {
            isDIAvailable: !!diContainer,
            dependencies: dependencies
        };
    }
    
    // 공개 API
    return {
        updateStatus: updateStatus,
        updateMagnetStatus: updateMagnetStatus,
        displaySoundList: displaySoundList,
        updateSoundButtons: updateSoundButtons,
        updateFolderPath: updateFolderPath,
        toggleDebugButton: toggleDebugButton,
        showDebugInfo: showDebugInfo,
        resetDebugUI: resetDebugUI,
        updateThemeWithAppSkinInfo: updateThemeWithAppSkinInfo,
        getDIStatus: getDIStatus // Phase 2.1
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCUIManager = JSCUIManager;
}