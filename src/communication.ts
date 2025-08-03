/**
 * JSCEditHelper - Communication Module
 * CEP와 ExtendScript 간의 통신을 담당하는 모듈
 */

/// <reference path="../types/cep.d.ts" />

interface SoundEventData {
    message?: string;
    success?: boolean;
    soundList?: string[];
    debug?: string;
    clipsMoved?: number;
    gapsRemoved?: number;
}

interface FileListEventData {
    soundFiles: Array<{
        name: string;
        fsName: string;
    }>;
    folderPath: string;
}

interface JSCCommunicationInterface {
    initialize(): any | null;
    callExtendScript(scriptCode: string, callback?: (result: string) => void): void;
    getCSInterface(): any | null;
}

const JSCCommunication = (function(): JSCCommunicationInterface {
    'use strict';
    
    let csInterface: any = null;
    
    // CSInterface 초기화
    function initialize(): any | null {
        try {
            if (typeof CSInterface === 'undefined') {
                throw new Error('CSInterface not available - CEP environment required');
            }
            
            csInterface = new CSInterface();
            setupEventListeners();
            console.log('Communication module initialized successfully');
            return csInterface;
        } catch (e) {
            console.error('Communication module initialization failed:', (e as Error).message);
            return null;
        }
    }
    
    // 이벤트 리스너 설정
    function setupEventListeners(): void {
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
    function handleSoundEvent(event: any): void {
        try {
            let data = event.data;
            window.JSCUtils.logDebug("Received event data type: " + typeof data);

            // Handle non-string data
            if (typeof data !== "string") {
                window.JSCUtils.logWarn("Received non-string data, attempting conversion");
                try {
                    data = JSON.stringify(data);
                    window.JSCUtils.logDebug("Converted non-string data to JSON");
                } catch (e) {
                    window.JSCErrorHandler.handleCommunicationError(
                        'JSX_ERROR',
                        "데이터 처리 오류: 서버에서 잘못된 형식의 데이터를 받았습니다.",
                        { originalError: (e as Error).message }
                    );
                    return;
                }
            }

            // [object Object] 오류 검사
            if (data === "[object Object]") {
                window.JSCErrorHandler.handleCommunicationError(
                    'JSX_ERROR',
                    "데이터 처리 오류: 서버 응답 형식에 문제가 있습니다.",
                    { receivedData: data }
                );
                return;
            }

            // Try parsing JSON
            const resultData = window.JSCUtils.safeJSONParse(data) as SoundEventData;
            if (!resultData) {
                window.JSCUtils.logWarn("Failed to parse data as JSON, treating as string");
                window.JSCUIManager.updateStatus(data as string, false);
                return;
            }

            // Save debug info
            if (resultData.debug) {
                (window as any).lastDebugInfo = resultData.debug;
                window.JSCUIManager.toggleDebugButton(true);
            }

            if (resultData.soundList && Array.isArray(resultData.soundList)) {
                window.JSCUIManager.displaySoundList(resultData.soundList);
            }

            if (resultData.message) {
                window.JSCUIManager.updateStatus(resultData.message, resultData.success);
            }

            // 마그넷 기능 결과 처리
            if (resultData.clipsMoved !== undefined || resultData.gapsRemoved !== undefined) {
                window.JSCUIManager.updateMagnetStatus(
                    resultData.success || false,
                    resultData.clipsMoved,
                    resultData.gapsRemoved
                );
            }
        } catch (e) {
            window.JSCErrorHandler.handleError(
                window.JSCErrorHandler.createError(
                    window.JSCErrorHandler.ERROR_TYPES.COMMUNICATION,
                    'EVENT_ERROR',
                    "처리 중 오류가 발생했습니다. 다시 시도해주세요.",
                    { originalError: (e as Error).message, stack: (e as Error).stack }
                )
            );
        }
    }
    
    // FileListEvent 처리
    function handleFileListEvent(event: any): void {
        window.JSCUtils.debugLog("handleFileListEvent received event. Type: " + event.type);
        
        try {
            const eventDataString = event.data;
            window.JSCUtils.debugLog("handleFileListEvent: eventDataString (type: " + typeof eventDataString + "): " + eventDataString);
            
            let parsedData: FileListEventData;

            if (typeof eventDataString === "string") {
                if (eventDataString.trim() === "") {
                    console.error("handleFileListEvent: Received empty string data.");
                    window.JSCUIManager.updateStatus("폴더에서 데이터를 가져오는 데 실패했습니다.", false);
                    return;
                }
                
                const parsed = window.JSCUtils.safeJSONParse(eventDataString);
                if (!parsed) {
                    console.error("handleFileListEvent: JSON parsing error for data: " + eventDataString);
                    window.JSCUIManager.updateStatus("폴더 데이터 처리 중 오류가 발생했습니다.", false);
                    return;
                }
                parsedData = parsed as FileListEventData;
            } else if (typeof eventDataString === "object" && eventDataString !== null) {
                parsedData = eventDataString as FileListEventData;
                window.JSCUtils.debugLog("handleFileListEvent: Received data as object (no parsing needed)");
            } else {
                console.error("handleFileListEvent: Unknown data type received: " + typeof eventDataString);
                window.JSCUIManager.updateStatus("예상치 못한 데이터 형식을 받았습니다.", false);
                return;
            }

            if (!parsedData || !parsedData.soundFiles) {
                console.error("handleFileListEvent: Invalid data structure (soundFiles missing). Parsed data:", parsedData);
                window.JSCUIManager.updateStatus("폴더 데이터를 올바르게 읽을 수 없습니다.", false);
                return;
            }

            const soundFiles = parsedData.soundFiles;
            const folderPathFromEvent = parsedData.folderPath;
            
            window.JSCUtils.debugLog("handleFileListEvent: soundFiles count: " + soundFiles.length + " folderPathFromEvent: " + folderPathFromEvent);

            // 폴더 경로 업데이트
            if (folderPathFromEvent && window.JSCUtils.isValidPath(folderPathFromEvent)) {
                if (window.JSCStateManager && window.JSCStateManager.setCurrentFolderPath) {
                    window.JSCStateManager.setCurrentFolderPath(folderPathFromEvent);
                }
                window.JSCUtils.saveToStorage(window.JSCUtils.CONFIG.SOUND_FOLDER_KEY, folderPathFromEvent);
                window.JSCUIManager.updateFolderPath(folderPathFromEvent);
            }

            // 사운드 버튼 업데이트
            window.JSCUIManager.updateSoundButtons(soundFiles, folderPathFromEvent);

        } catch (e) {
            console.error("handleFileListEvent: CRITICAL ERROR during event processing:", e);
            window.JSCUIManager.updateStatus("폴더 정보를 처리하는 중 오류가 발생했습니다.", false);
        }
    }
    
    // ExtendScript 함수 호출
    function callExtendScript(scriptCode: string, callback?: (result: string) => void): void {
        if (!csInterface) {
            console.error("CSInterface not initialized");
            return;
        }
        
        window.JSCUtils.debugLog("Executing JSX code: " + scriptCode);
        csInterface.evalScript(scriptCode, callback || function(result: string) {
            window.JSCUtils.debugLog("JSX result: " + result);
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