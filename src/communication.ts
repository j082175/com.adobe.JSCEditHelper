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
    getDIStatus(): { isDIAvailable: boolean; dependencies: string[] }; // Phase 2.3
}

const JSCCommunication = (function(): JSCCommunicationInterface {
    'use strict';
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    let uiService: any = null;
    let errorService: any = null;
    let stateService: any = null;
    
    try {
        diContainer = (window as any).DI;
        if (diContainer) {
            // DI에서 서비스 가져오기 시도
            utilsService = diContainer.getSafe('JSCUtils');
            uiService = diContainer.getSafe('JSCUIManager');
            errorService = diContainer.getSafe('JSCErrorHandler');
            stateService = diContainer.getSafe('JSCStateManager');
        }
    } catch (e) {
        // DI 사용 불가시 레거시 모드로 작동
    }
    
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils(): any {
        return utilsService || window.JSCUtils || {
            logDebug: (msg: string) => console.log(msg),
            logWarn: (msg: string) => console.warn(msg),
            debugLog: (msg: string) => console.log(msg),
            safeJSONParse: (json: string) => { try { return JSON.parse(json); } catch { return null; } },
            isValidPath: (path: string) => !!path,
            saveToStorage: (key: string, value: string) => { localStorage.setItem(key, value); return true; },
            CONFIG: { SOUND_FOLDER_KEY: 'soundInserter_folder' }
        };
    }
    
    function getUIManager(): any {
        return uiService || window.JSCUIManager || {
            updateStatus: (msg: string, success?: boolean) => console.log(`Status: ${msg} (${success})`),
            toggleDebugButton: (_show: boolean) => { /* no-op */ },
            displaySoundList: (list: string[]) => console.log('Sound list:', list),
            updateMagnetStatus: (success: boolean, _moved?: number, _removed?: number) => console.log(`Magnet: ${success}`),
            updateFolderPath: (_path: string) => { /* no-op */ },
            updateSoundButtons: (_files: any[], _path: string) => { /* no-op */ }
        };
    }
    
    function getErrorHandler(): any {
        return errorService || window.JSCErrorHandler || {
            handleCommunicationError: (type: string, msg: string, data?: any) => console.error(`[${type}] ${msg}`, data),
            handleError: (error: any) => console.error('Error:', error),
            createError: (type: any, code: string, msg: string, data?: any) => ({ type, code, msg, data }),
            ERROR_TYPES: { COMMUNICATION: 'COMMUNICATION' }
        };
    }
    
    function getStateManager(): any {
        return stateService || window.JSCStateManager || {
            setCurrentFolderPath: (_path: string) => { /* no-op */ return true; }
        };
    }
    
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
        const utils = getUtils();
        const uiManager = getUIManager();
        const errorHandler = getErrorHandler();
        
        try {
            let data = event.data;
            utils.logDebug("Received event data type: " + typeof data);

            // Handle non-string data
            if (typeof data !== "string") {
                utils.logWarn("Received non-string data, attempting conversion");
                try {
                    data = JSON.stringify(data);
                    utils.logDebug("Converted non-string data to JSON");
                } catch (e) {
                    errorHandler.handleCommunicationError(
                        'JSX_ERROR',
                        "데이터 처리 오류: 서버에서 잘못된 형식의 데이터를 받았습니다.",
                        { originalError: (e as Error).message }
                    );
                    return;
                }
            }

            // [object Object] 오류 검사
            if (data === "[object Object]") {
                errorHandler.handleCommunicationError(
                    'JSX_ERROR',
                    "데이터 처리 오류: 서버 응답 형식에 문제가 있습니다.",
                    { receivedData: data }
                );
                return;
            }

            // Try parsing JSON
            const resultData = utils.safeJSONParse(data) as SoundEventData;
            if (!resultData) {
                utils.logWarn("Failed to parse data as JSON, treating as string");
                uiManager.updateStatus(data as string, false);
                return;
            }

            // Save debug info
            if (resultData.debug) {
                (window as any).lastDebugInfo = resultData.debug;
                uiManager.toggleDebugButton(true);
            }

            if (resultData.soundList && Array.isArray(resultData.soundList)) {
                uiManager.displaySoundList(resultData.soundList);
            }

            if (resultData.message) {
                uiManager.updateStatus(resultData.message, resultData.success);
            }

            // 마그넷 기능 결과 처리
            if (resultData.clipsMoved !== undefined || resultData.gapsRemoved !== undefined) {
                uiManager.updateMagnetStatus(
                    resultData.success || false,
                    resultData.clipsMoved,
                    resultData.gapsRemoved
                );
            }
        } catch (e) {
            errorHandler.handleError(
                errorHandler.createError(
                    errorHandler.ERROR_TYPES.COMMUNICATION,
                    'EVENT_ERROR',
                    "처리 중 오류가 발생했습니다. 다시 시도해주세요.",
                    { originalError: (e as Error).message, stack: (e as Error).stack }
                )
            );
        }
    }
    
    // FileListEvent 처리
    function handleFileListEvent(event: any): void {
        const utils = getUtils();
        const uiManager = getUIManager();
        const stateManager = getStateManager();
        
        utils.debugLog("handleFileListEvent received event. Type: " + event.type);
        
        try {
            const eventDataString = event.data;
            utils.debugLog("handleFileListEvent: eventDataString (type: " + typeof eventDataString + "): " + eventDataString);
            
            let parsedData: FileListEventData;

            if (typeof eventDataString === "string") {
                if (eventDataString.trim() === "") {
                    console.error("handleFileListEvent: Received empty string data.");
                    uiManager.updateStatus("폴더에서 데이터를 가져오는 데 실패했습니다.", false);
                    return;
                }
                
                const parsed = utils.safeJSONParse(eventDataString);
                if (!parsed) {
                    console.error("handleFileListEvent: JSON parsing error for data: " + eventDataString);
                    uiManager.updateStatus("폴더 데이터 처리 중 오류가 발생했습니다.", false);
                    return;
                }
                parsedData = parsed as FileListEventData;
            } else if (typeof eventDataString === "object" && eventDataString !== null) {
                parsedData = eventDataString as FileListEventData;
                utils.debugLog("handleFileListEvent: Received data as object (no parsing needed)");
            } else {
                console.error("handleFileListEvent: Unknown data type received: " + typeof eventDataString);
                uiManager.updateStatus("예상치 못한 데이터 형식을 받았습니다.", false);
                return;
            }

            if (!parsedData || !parsedData.soundFiles) {
                console.error("handleFileListEvent: Invalid data structure (soundFiles missing). Parsed data:", parsedData);
                uiManager.updateStatus("폴더 데이터를 올바르게 읽을 수 없습니다.", false);
                return;
            }

            const soundFiles = parsedData.soundFiles;
            const folderPathFromEvent = parsedData.folderPath;
            
            utils.debugLog("handleFileListEvent: soundFiles count: " + soundFiles.length + " folderPathFromEvent: " + folderPathFromEvent);

            // 폴더 경로 업데이트
            if (folderPathFromEvent && utils.isValidPath(folderPathFromEvent)) {
                if (stateManager && stateManager.setCurrentFolderPath) {
                    stateManager.setCurrentFolderPath(folderPathFromEvent);
                }
                utils.saveToStorage(utils.CONFIG.SOUND_FOLDER_KEY, folderPathFromEvent);
                uiManager.updateFolderPath(folderPathFromEvent);
            }

            // 사운드 버튼 업데이트
            uiManager.updateSoundButtons(soundFiles, folderPathFromEvent);

        } catch (e) {
            console.error("handleFileListEvent: CRITICAL ERROR during event processing:", e);
            uiManager.updateStatus("폴더 정보를 처리하는 중 오류가 발생했습니다.", false);
        }
    }
    
    // ExtendScript 함수 호출
    function callExtendScript(scriptCode: string, callback?: (result: string) => void): void {
        if (!csInterface) {
            console.error("CSInterface not initialized");
            return;
        }
        
        const utils = getUtils();
        utils.debugLog("Executing JSX code: " + scriptCode);
        csInterface.evalScript(scriptCode, callback || function(result: string) {
            utils.debugLog("JSX result: " + result);
        });
    }
    
    // DI 상태 확인 함수 (디버깅용) - Phase 2.3
    function getDIStatus(): { isDIAvailable: boolean; dependencies: string[] } {
        const dependencies: string[] = [];
        
        if (utilsService) dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils) dependencies.push('JSCUtils (Legacy)');
        
        if (uiService) dependencies.push('JSCUIManager (DI)');
        else if (window.JSCUIManager) dependencies.push('JSCUIManager (Legacy)');
        
        if (errorService) dependencies.push('JSCErrorHandler (DI)');
        else if (window.JSCErrorHandler) dependencies.push('JSCErrorHandler (Legacy)');
        
        if (stateService) dependencies.push('JSCStateManager (DI)');
        else if (window.JSCStateManager) dependencies.push('JSCStateManager (Legacy)');
        
        return {
            isDIAvailable: !!diContainer,
            dependencies: dependencies
        };
    }
    
    // 공개 API
    return {
        initialize: initialize,
        callExtendScript: callExtendScript,
        getCSInterface: function() { return csInterface; },
        getDIStatus: getDIStatus // Phase 2.3
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCCommunication = JSCCommunication;
}