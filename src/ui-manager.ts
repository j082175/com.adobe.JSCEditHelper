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

    // DIHelpers 사용 - 반복 코드 제거!
    const DIHelpers = (window as any).DIHelpers;

    // 유틸리티 서비스 가져오기
    function getUtils(): JSCUtilsInterface {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('UIManager');
        }
        // Fallback
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[UIManager]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[UIManager]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[UIManager]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[UIManager]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[UIManager]', msg),
            isValidPath: (path: string) => !!path,
            getShortPath: (path: string) => path,
            safeJSONParse: (str: string) => {
                try { return JSON.parse(str); }
                catch(e) { return null; }
            },
            saveToStorage: (key: string, value: string) => { localStorage.setItem(key, value); return true; },
            loadFromStorage: (key: string) => localStorage.getItem(key),
            removeFromStorage: (key: string) => { localStorage.removeItem(key); return true; },
            CONFIG: {
                DEBUG_MODE: false,
                SOUND_FOLDER_KEY: 'soundInserter_folder',
                APP_NAME: 'JSCEditHelper',
                VERSION: '1.0.0'
            },
            LOG_LEVELS: {} as any,
            log: () => {},
            getDIStatus: () => ({ isDIAvailable: false, containerInfo: 'Fallback mode' })
        };
        return (window.JSCUtils || fallback) as JSCUtilsInterface;
    }

    // 이벤트 서비스 가져오기
    function getEventManager(): any {
        return window.JSCEventManager || null;
    }
    
    // 상태 메시지 업데이트
    function updateStatus(message: string, isSuccess?: boolean): void {
        const utils = getUtils();
        const statusElement = document.getElementById("status-message");
        
        if (!statusElement) {
            utils.logError("Status element not found");
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
        const utils = getUtils();
        const container = document.getElementById("individualSoundButtonsContainer");
        const folderPathSpan = document.getElementById("folderPathSpan");

        if (!container) return;

        container.innerHTML = ""; // 이전 버튼들 제거

        if (folderPathSpan && currentFolderPath) {
            folderPathSpan.textContent = utils.getShortPath(currentFolderPath);
        }

        if (soundFiles && soundFiles.length > 0) {
            soundFiles.forEach(function(soundFile: SoundFile) {
                if (soundFile && soundFile.name && soundFile.fsName) {
                    const button = document.createElement("button");
                    button.textContent = soundFile.name.replace(/\.[^/.]+$/, "");
                    button.setAttribute("data-fsname", soundFile.fsName);
                    
                    // 기존 클릭 이벤트 (효과음 삽입)
                    button.addEventListener("click", function(event: Event) {
                        // 이벤트는 나중에 event-manager에서 처리하도록 위임
                        const eventManager = getEventManager();
                        if (eventManager && eventManager.handleSoundFileButtonClick) {
                            eventManager.handleSoundFileButtonClick(event);
                        }
                    });
                    
                    // 키보드 이벤트 차단 (스페이스바로 인한 의도치 않은 활성화 방지)
                    button.addEventListener("keydown", function(event: KeyboardEvent) {
                        if (event.code === "Space" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            utils.logDebug("효과음 버튼 스페이스바 이벤트 차단됨");
                        }
                    });
                    
                    // 미리보기 이벤트 추가
                    setupAudioPreviewEvent(button, soundFile.fsName);
                    
                    container.appendChild(button);
                }
            });
            updateStatus(soundFiles.length + "개의 효과음 파일을 폴더에서 로드했습니다. (우클릭으로 미리보기 가능)", true);

            // 검색 필터 연결
            const searchInput = document.getElementById("soundSearchInput") as HTMLInputElement;
            if (searchInput) {
                searchInput.value = "";
                searchInput.oninput = function() {
                    const query = searchInput.value.toLowerCase();
                    const buttons = container.querySelectorAll("button");
                    buttons.forEach(function(btn) {
                        const name = btn.textContent ? btn.textContent.toLowerCase() : "";
                        (btn as HTMLElement).style.display = name.includes(query) ? "" : "none";
                    });
                };
            }
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
            // HTML 포맷팅: ERROR/WARN에 색상 적용
            const formattedLog = formatDebugLog((window as any).lastDebugInfo);
            debugInfo.innerHTML = formattedLog;
            debugInfo.style.display = "block";
            if (closeButton) {
                closeButton.style.display = "block";
            }
        }
    }

    // 디버그 로그를 HTML로 포맷팅 (색상 적용)
    function formatDebugLog(logText: string): string {
        if (!logText) return '';

        // 각 라인을 처리
        const lines = logText.split('\n');
        const formattedLines = lines.map(line => {
            // XSS 방지: HTML 이스케이프
            const escapedLine = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            // ERROR 패턴 감지 및 색상 적용
            if (/\[.*?\]\s*ERROR/.test(escapedLine)) {
                return `<span class="log-error">${escapedLine}</span>`;
            }
            // WARN 패턴 감지 및 색상 적용
            else if (/\[.*?\]\s*WARN/.test(escapedLine)) {
                return `<span class="log-warn">${escapedLine}</span>`;
            }
            // INFO 패턴 감지 및 색상 적용
            else if (/\[.*?\]\s*INFO/.test(escapedLine)) {
                return `<span class="log-info">${escapedLine}</span>`;
            }
            // DEBUG 패턴 감지 및 색상 적용
            else if (/\[.*?\]\s*DEBUG/.test(escapedLine)) {
                return `<span class="log-debug">${escapedLine}</span>`;
            }
            // 일반 텍스트
            return escapedLine;
        });

        return formattedLines.join('\n');
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
        const utils = getUtils();
        try {
            if (!csInterface || !csInterface.hostEnvironment) {
                utils.logWarn('CSInterface or hostEnvironment not available for theme update');
                return;
            }
            
            const appSkinInfo = csInterface.hostEnvironment.appSkinInfo;
            if (!appSkinInfo || !appSkinInfo.panelBackgroundColor) {
                utils.logWarn('App skin info not available');
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
            
            utils.logDebug('Theme updated successfully');
        } catch (e) {
            utils.logError('Theme update failed:', (e as Error).message);
        }
    }
    
    // DI 상태 확인 함수 (디버깅용) - Phase 2.1
    function getDIStatus(): { isDIAvailable: boolean; dependencies: string[] } {
        const dependencies: string[] = [];

        if (DIHelpers) dependencies.push('DIHelpers (Available)');
        else dependencies.push('DIHelpers (Not loaded)');

        if (window.JSCUtils) dependencies.push('JSCUtils (Available)');
        else dependencies.push('JSCUtils (Missing)');

        if (window.JSCEventManager) dependencies.push('JSCEventManager (Available)');
        else dependencies.push('JSCEventManager (Missing)');

        return {
            isDIAvailable: !!DIHelpers,
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