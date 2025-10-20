"use strict";
/**
 * JSCEditHelper - UI Manager
 * UI 상태 관리 및 업데이트를 담당하는 모듈
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
/// <reference path="../types/cep.d.ts" />
var JSCUIManager = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var eventService = null;
    try {
        diContainer = window.DI;
        if (diContainer) {
            // DI에서 서비스 가져오기 시도
            utilsService = diContainer.getSafe('JSCUtils');
            eventService = diContainer.getSafe('JSCEventManager');
        }
    }
    catch (e) {
        // DI 사용 불가시 레거시 모드로 작동
    }
    // 유틸리티 서비스 가져오기 (DI 우선, 레거시 fallback)
    function getUtils() {
        var fallback = {
            debugLog: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[UIManager]', msg);
            },
            logDebug: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[UIManager]', msg);
            },
            logInfo: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.info('[UIManager]', msg);
            },
            logWarn: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.warn('[UIManager]', msg);
            },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error('[UIManager]', msg);
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
    // 이벤트 서비스 가져오기 (DI 우선, 레거시 fallback)
    function getEventManager() {
        return eventService || window.JSCEventManager || null;
    }
    // 상태 메시지 업데이트
    function updateStatus(message, isSuccess) {
        var utils = getUtils();
        var statusElement = document.getElementById("status-message");
        if (!statusElement) {
            utils.logError("Status element not found");
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
    // 개별 효과음 버튼에 미리보기 이벤트 추가
    function setupAudioPreviewEvent(button, filePath) {
        // 오른쪽 클릭으로 미리보기 재생/정지 토글
        button.addEventListener('contextmenu', function (event) {
            return __awaiter(this, void 0, void 0, function () {
                var audioPreview, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            event.preventDefault(); // 기본 컨텍스트 메뉴 방지
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 10, , 11]);
                            audioPreview = window.AudioPreviewManager;
                            if (!audioPreview) return [3 /*break*/, 8];
                            if (!audioPreview.isPlaying()) return [3 /*break*/, 5];
                            if (!audioPreview.isCurrentButton(button)) return [3 /*break*/, 2];
                            // 같은 버튼이면 정지
                            audioPreview.stopCurrentPreviewImmediately();
                            return [3 /*break*/, 4];
                        case 2: 
                        // 다른 버튼이면 새로운 미리보기 재생 (기존 것은 자동으로 정지됨)
                        return [4 /*yield*/, audioPreview.playPreview(filePath, button)];
                        case 3:
                            // 다른 버튼이면 새로운 미리보기 재생 (기존 것은 자동으로 정지됨)
                            _a.sent();
                            _a.label = 4;
                        case 4: return [3 /*break*/, 7];
                        case 5: 
                        // 정지 중이면 재생
                        return [4 /*yield*/, audioPreview.playPreview(filePath, button)];
                        case 6:
                            // 정지 중이면 재생
                            _a.sent();
                            _a.label = 7;
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            updateStatus('오디오 미리보기 기능을 사용할 수 없습니다.', false);
                            _a.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            error_1 = _a.sent();
                            updateStatus("\uBBF8\uB9AC\uBCF4\uAE30 \uC624\uB958: ".concat(error_1.message), false);
                            return [3 /*break*/, 11];
                        case 11: return [2 /*return*/];
                    }
                });
            });
        });
        // 미리보기 툴팁 업데이트
        button.title = "\uC88C\uD074\uB9AD: \uD6A8\uACFC\uC74C \uC0BD\uC785\n\uC6B0\uD074\uB9AD: \uBBF8\uB9AC\uBCF4\uAE30 \uC7AC\uC0DD/\uC815\uC9C0";
    }
    // 개별 효과음 버튼 업데이트
    function updateSoundButtons(soundFiles, currentFolderPath) {
        var utils = getUtils();
        var container = document.getElementById("individualSoundButtonsContainer");
        var folderPathSpan = document.getElementById("folderPathSpan");
        if (!container)
            return;
        container.innerHTML = ""; // 이전 버튼들 제거
        if (folderPathSpan && currentFolderPath) {
            folderPathSpan.textContent = utils.getShortPath(currentFolderPath);
        }
        if (soundFiles && soundFiles.length > 0) {
            soundFiles.forEach(function (soundFile) {
                if (soundFile && soundFile.name && soundFile.fsName) {
                    var button = document.createElement("button");
                    button.textContent = soundFile.name;
                    button.setAttribute("data-fsname", soundFile.fsName);
                    // 기존 클릭 이벤트 (효과음 삽입)
                    button.addEventListener("click", function (event) {
                        // 이벤트는 나중에 event-manager에서 처리하도록 위임
                        var eventManager = getEventManager();
                        if (eventManager && eventManager.handleSoundFileButtonClick) {
                            eventManager.handleSoundFileButtonClick(event);
                        }
                    });
                    // 키보드 이벤트 차단 (스페이스바로 인한 의도치 않은 활성화 방지)
                    button.addEventListener("keydown", function (event) {
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
            var utils = getUtils();
            refreshButton.disabled = !path || !utils.isValidPath(path);
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
        var utils = getUtils();
        try {
            if (!csInterface || !csInterface.hostEnvironment) {
                utils.logWarn('CSInterface or hostEnvironment not available for theme update');
                return;
            }
            var appSkinInfo = csInterface.hostEnvironment.appSkinInfo;
            if (!appSkinInfo || !appSkinInfo.panelBackgroundColor) {
                utils.logWarn('App skin info not available');
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
            utils.logDebug('Theme updated successfully');
        }
        catch (e) {
            utils.logError('Theme update failed:', e.message);
        }
    }
    // DI 상태 확인 함수 (디버깅용) - Phase 2.1
    function getDIStatus() {
        var dependencies = [];
        if (utilsService)
            dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
        if (eventService)
            dependencies.push('JSCEventManager (DI)');
        else if (window.JSCEventManager)
            dependencies.push('JSCEventManager (Legacy)');
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
//# sourceMappingURL=ui-manager.js.map