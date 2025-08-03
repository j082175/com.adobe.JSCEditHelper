"use strict";
/**
 * JSCEditHelper - UI Manager
 * UI 상태 관리 및 업데이트를 담당하는 모듈
 */
/// <reference path="../types/cep.d.ts" />
var JSCUIManager = (function () {
    'use strict';
    // 상태 메시지 업데이트
    function updateStatus(message, isSuccess) {
        var statusElement = document.getElementById("status-message");
        if (!statusElement) {
            console.error("Status element not found");
            return;
        }
        // 기존 클래스 제거
        statusElement.classList.remove("success", "error");
        // 성공/실패에 따른 클래스 추가
        if (isSuccess === true) {
            statusElement.classList.add("success");
        }
        else if (isSuccess === false) {
            statusElement.classList.add("error");
            // 오류 발생 시 디버그 버튼 표시 (디버그 정보가 있을 경우)
            if (window.lastDebugInfo) {
                toggleDebugButton(true);
            }
        }
        statusElement.textContent = message;
    }
    // 마그넷 상태 업데이트
    function updateMagnetStatus(isSuccess, clipsMoved, gapsRemoved) {
        var magnetStatus = document.getElementById("magnetStatus");
        if (!magnetStatus)
            return;
        if (isSuccess) {
            magnetStatus.textContent = "완료: " + (clipsMoved || 0) + "개 클립 이동, " + (gapsRemoved || 0) + "개 간격 제거";
            magnetStatus.style.color = "#28a745";
        }
        else {
            magnetStatus.textContent = "오류 발생";
            magnetStatus.style.color = "#dc3545";
        }
        // 3초 후 상태 메시지 지우기
        setTimeout(function () {
            magnetStatus.textContent = "";
        }, 3000);
    }
    // 효과음 목록 표시
    function displaySoundList(soundList) {
        var listContainer = document.getElementById("sound-list");
        if (!listContainer)
            return;
        listContainer.innerHTML = "";
        if (!soundList || soundList.length === 0) {
            listContainer.innerHTML = "<p>삽입된 효과음이 없습니다.</p>";
            return;
        }
        for (var i = 0; i < soundList.length; i++) {
            var soundItem = document.createElement("div");
            soundItem.className = "sound-item";
            soundItem.textContent = (i + 1) + ". " + soundList[i];
            listContainer.appendChild(soundItem);
        }
    }
    // 개별 효과음 버튼 업데이트
    function updateSoundButtons(soundFiles, currentFolderPath) {
        var container = document.getElementById("individualSoundButtonsContainer");
        var folderPathSpan = document.getElementById("folderPathSpan");
        if (!container)
            return;
        container.innerHTML = ""; // 이전 버튼들 제거
        if (folderPathSpan && currentFolderPath) {
            folderPathSpan.textContent = window.JSCUtils.getShortPath(currentFolderPath);
        }
        if (soundFiles && soundFiles.length > 0) {
            soundFiles.forEach(function (soundFile) {
                if (soundFile && soundFile.name && soundFile.fsName) {
                    var button = document.createElement("button");
                    button.textContent = soundFile.name;
                    button.setAttribute("data-fsname", soundFile.fsName);
                    button.addEventListener("click", function (event) {
                        // 이벤트는 나중에 event-manager에서 처리하도록 위임
                        if (window.JSCEventManager && window.JSCEventManager.handleSoundFileButtonClick) {
                            window.JSCEventManager.handleSoundFileButtonClick(event);
                        }
                    });
                    container.appendChild(button);
                }
            });
            updateStatus(soundFiles.length + "개의 효과음 파일을 폴더에서 로드했습니다.", true);
        }
        else {
            updateStatus("선택된 폴더에 오디오 파일이 없습니다.", false);
        }
    }
    // 폴더 경로 UI 업데이트
    function updateFolderPath(path) {
        var folderInput = document.getElementById("sound-folder");
        var refreshButton = document.getElementById("refreshSounds");
        if (folderInput) {
            folderInput.value = path || "";
        }
        if (refreshButton) {
            refreshButton.disabled = !path || !window.JSCUtils.isValidPath(path);
        }
    }
    // 디버그 버튼 표시/숨김 설정
    function toggleDebugButton(show) {
        var debugButton = document.getElementById("debug-button");
        if (debugButton) {
            debugButton.style.display = show ? "block" : "none";
        }
    }
    // 디버그 정보 표시
    function showDebugInfo() {
        var debugInfo = document.getElementById("debug-info");
        var closeButton = document.getElementById("close-debug-button");
        if (debugInfo && window.lastDebugInfo) {
            debugInfo.textContent = window.lastDebugInfo;
            debugInfo.style.display = "block";
            if (closeButton) {
                closeButton.style.display = "block";
            }
        }
    }
    // 디버그 UI 초기화
    function resetDebugUI() {
        window.lastDebugInfo = null;
        toggleDebugButton(false);
        var debugInfo = document.getElementById("debug-info");
        var closeButton = document.getElementById("close-debug-button");
        if (debugInfo)
            debugInfo.style.display = "none";
        if (closeButton)
            closeButton.style.display = "none";
    }
    // Adobe 앱 테마 정보로 UI 업데이트
    function updateThemeWithAppSkinInfo(csInterface) {
        try {
            if (!csInterface || !csInterface.hostEnvironment) {
                console.warn('CSInterface or hostEnvironment not available for theme update');
                return;
            }
            var appSkinInfo = csInterface.hostEnvironment.appSkinInfo;
            if (!appSkinInfo || !appSkinInfo.panelBackgroundColor) {
                console.warn('App skin info not available');
                return;
            }
            var panelBgColor = appSkinInfo.panelBackgroundColor.color;
            if (!panelBgColor)
                return;
            // 어두운 테마인지 확인
            var isDarkTheme = panelBgColor.red < 128;
            // 필요에 따라 테마 스타일 전환
            if (!isDarkTheme) {
                // 밝은 테마 스타일 적용
                document.body.classList.add("light-theme");
            }
            console.log('Theme updated successfully');
        }
        catch (e) {
            console.error('Theme update failed:', e.message);
        }
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
        updateThemeWithAppSkinInfo: updateThemeWithAppSkinInfo
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCUIManager = JSCUIManager;
}
//# sourceMappingURL=ui-manager.js.map