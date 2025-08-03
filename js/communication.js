/**
 * JSCEditHelper - Communication Module
 * CEP와 ExtendScript 간의 통신을 담당하는 모듈
 */

var JSCCommunication = (function() {
    'use strict';
    
    var csInterface = null;
    
    // CSInterface 초기화
    function initialize() {
        try {
            if (typeof CSInterface === 'undefined') {
                throw new Error('CSInterface not available - CEP environment required');
            }
            
            csInterface = new CSInterface();
            setupEventListeners();
            console.log('Communication module initialized successfully');
            return csInterface;
        } catch (e) {
            console.error('Communication module initialization failed:', e.message);
            return null;
        }
    }
    
    // 이벤트 리스너 설정
    function setupEventListeners() {
        if (!csInterface) return;
        
        // SoundEvent 리스너
        csInterface.addEventListener(
            "com.adobe.soundInserter.events.SoundEvent",
            handleSoundEvent
        );
        
        // FileListEvent 리스너  
        csInterface.addEventListener(
            "com.adobe.soundInserter.events.FileListEvent",
            handleFileListEvent
        );
    }
    
    // SoundEvent 처리
    function handleSoundEvent(event) {
        try {
            var data = event.data;
            JSCUtils.logDebug("Received event data type: " + typeof data);

            // Handle non-string data
            if (typeof data !== "string") {
                JSCUtils.logWarn("Received non-string data, attempting conversion");
                try {
                    data = JSON.stringify(data);
                    JSCUtils.logDebug("Converted non-string data to JSON");
                } catch (e) {
                    var errorDisplay = typeof data === "object" && data !== null
                        ? "[object Object] (raw object received)"
                        : String(data);
                    JSCErrorHandler.handleCommunicationError(
                        'JSX_ERROR',
                        "데이터 처리 오류: 서버에서 잘못된 형식의 데이터를 받았습니다.",
                        { originalError: e.message }
                    );
                    return;
                }
            }

            // [object Object] 오류 검사
            if (data === "[object Object]") {
                JSCErrorHandler.handleCommunicationError(
                    'JSX_ERROR',
                    "데이터 처리 오류: 서버 응답 형식에 문제가 있습니다.",
                    { receivedData: data }
                );
                return;
            }

            // Try parsing JSON
            var resultData = JSCUtils.safeJSONParse(data);
            if (!resultData) {
                JSCUtils.logWarn("Failed to parse data as JSON, treating as string");
                JSCUIManager.updateStatus(data, false);
                return;
            }

            // Save debug info
            if (resultData.debug) {
                window.lastDebugInfo = resultData.debug;
                JSCUIManager.toggleDebugButton(true);
            }

            if (resultData.soundList && Array.isArray(resultData.soundList)) {
                JSCUIManager.displaySoundList(resultData.soundList);
            }

            if (resultData.message) {
                JSCUIManager.updateStatus(resultData.message, resultData.success);
            }

            // 마그넷 기능 결과 처리
            if (resultData.clipsMoved !== undefined || resultData.gapsRemoved !== undefined) {
                JSCUIManager.updateMagnetStatus(
                    resultData.success,
                    resultData.clipsMoved,
                    resultData.gapsRemoved
                );
            }
        } catch (e) {
            JSCErrorHandler.handleError(
                JSCErrorHandler.createError(
                    JSCErrorHandler.ERROR_TYPES.COMMUNICATION,
                    'EVENT_ERROR',
                    "처리 중 오류가 발생했습니다. 다시 시도해주세요.",
                    { originalError: e.message, stack: e.stack }
                )
            );
        }
    }
    
    // FileListEvent 처리
    function handleFileListEvent(event) {
        JSCUtils.debugLog("handleFileListEvent received event. Type: " + event.type);
        
        try {
            var eventDataString = event.data;
            JSCUtils.debugLog("handleFileListEvent: eventDataString (type: " + typeof eventDataString + "): " + eventDataString);
            
            var parsedData;

            if (typeof eventDataString === "string") {
                if (eventDataString.trim() === "") {
                    console.error("handleFileListEvent: Received empty string data.");
                    JSCUIManager.updateStatus("폴더에서 데이터를 가져오는 데 실패했습니다.", false);
                    return;
                }
                
                parsedData = JSCUtils.safeJSONParse(eventDataString);
                if (!parsedData) {
                    console.error("handleFileListEvent: JSON parsing error for data: " + eventDataString);
                    JSCUIManager.updateStatus("폴더 데이터 처리 중 오류가 발생했습니다.", false);
                    return;
                }
            } else if (typeof eventDataString === "object" && eventDataString !== null) {
                parsedData = eventDataString;
                JSCUtils.debugLog("handleFileListEvent: Received data as object (no parsing needed)");
            } else {
                console.error("handleFileListEvent: Unknown data type received: " + typeof eventDataString);
                JSCUIManager.updateStatus("예상치 못한 데이터 형식을 받았습니다.", false);
                return;
            }

            if (!parsedData || !parsedData.soundFiles) {
                console.error("handleFileListEvent: Invalid data structure (soundFiles missing). Parsed data:", parsedData);
                JSCUIManager.updateStatus("폴더 데이터를 올바르게 읽을 수 없습니다.", false);
                return;
            }

            var soundFiles = parsedData.soundFiles;
            var folderPathFromEvent = parsedData.folderPath;
            
            JSCUtils.debugLog("handleFileListEvent: soundFiles count: " + soundFiles.length + " folderPathFromEvent: " + folderPathFromEvent);

            // 폴더 경로 업데이트
            if (folderPathFromEvent && JSCUtils.isValidPath(folderPathFromEvent)) {
                if (window.JSCStateManager && window.JSCStateManager.setCurrentFolderPath) {
                    window.JSCStateManager.setCurrentFolderPath(folderPathFromEvent);
                }
                JSCUtils.saveToStorage(JSCUtils.CONFIG.SOUND_FOLDER_KEY, folderPathFromEvent);
                JSCUIManager.updateFolderPath(folderPathFromEvent);
            }

            // 사운드 버튼 업데이트
            JSCUIManager.updateSoundButtons(soundFiles, folderPathFromEvent);

        } catch (e) {
            console.error("handleFileListEvent: CRITICAL ERROR during event processing:", e);
            JSCUIManager.updateStatus("폴더 정보를 처리하는 중 오류가 발생했습니다.", false);
        }
    }
    
    // ExtendScript 함수 호출
    function callExtendScript(scriptCode, callback) {
        if (!csInterface) {
            console.error("CSInterface not initialized");
            return;
        }
        
        JSCUtils.debugLog("Executing JSX code: " + scriptCode);
        csInterface.evalScript(scriptCode, callback || function(result) {
            JSCUtils.debugLog("JSX result: " + result);
        });
    }
    
    // 공개 API
    return {
        initialize: initialize,
        callExtendScript: callExtendScript,
        getCSInterface: function() { return csInterface; }
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCCommunication = JSCCommunication;
}