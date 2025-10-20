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
    callExtendScriptAsync(scriptCode: string): Promise<string>;
    getCSInterface(): any | null;
    getDIStatus(): { isDIAvailable: boolean; dependencies: string[] }; // Phase 2.3
}

const JSCCommunication = (function(): JSCCommunicationInterface {
    'use strict';

    // DIHelpers 사용 - 반복 코드 제거!
    const DIHelpers = (window as any).DIHelpers;

    // 서비스 가져오기 헬퍼 함수들 (DIHelpers 우선, 레거시 fallback)
    function getUtils(): JSCUtilsInterface {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('Communication');
        }
        // Fallback
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[Communication]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[Communication]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[Communication]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[Communication]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[Communication]', msg),
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

    function getUIManager(): any {
        if (DIHelpers && DIHelpers.getUIManager) {
            return DIHelpers.getUIManager('Communication');
        }
        // Fallback
        return window.JSCUIManager || {
            updateStatus: (msg: string, success?: boolean) => console.log(`Status: ${msg} (${success})`),
            toggleDebugButton: (_show: boolean) => { /* no-op */ },
            displaySoundList: (list: string[]) => console.log('Sound list:', list),
            updateMagnetStatus: (success: boolean, _moved?: number, _removed?: number) => console.log(`Magnet: ${success}`),
            updateFolderPath: (_path: string) => { /* no-op */ },
            updateSoundButtons: (_files: any[], _path: string) => { /* no-op */ }
        };
    }

    function getErrorHandler(): any {
        if (DIHelpers && DIHelpers.getErrorHandler) {
            return DIHelpers.getErrorHandler();
        }
        // Fallback
        return window.JSCErrorHandler || {
            handleCommunicationError: (type: string, msg: string, data?: any) => console.error(`[${type}] ${msg}`, data),
            handleError: (error: any) => console.error('Error:', error),
            createError: (type: any, code: string, msg: string, data?: any) => ({ type, code, msg, data }),
            ERROR_TYPES: { COMMUNICATION: 'COMMUNICATION' }
        };
    }

    function getStateManager(): any {
        if (DIHelpers && DIHelpers.getStateManager) {
            return DIHelpers.getStateManager();
        }
        // Fallback
        return window.JSCStateManager || {
            setCurrentFolderPath: (_path: string) => { /* no-op */ return true; }
        };
    }
    
    let csInterface: any = null;
    
    // CSInterface 초기화
    function initialize(): any | null {
        const utils = getUtils();
        try {
            if (typeof CSInterface === 'undefined') {
                throw new Error('CSInterface not available - CEP environment required');
            }
            
            csInterface = new CSInterface();
            setupEventListeners();
            utils.logDebug('Communication module initialized successfully');
            return csInterface;
        } catch (e) {
            utils.logError('Communication module initialization failed:', (e as Error).message);
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
                    utils.logError("handleFileListEvent: Received empty string data.");
                    uiManager.updateStatus("폴더에서 데이터를 가져오는 데 실패했습니다.", false);
                    return;
                }
                
                const parsed = utils.safeJSONParse(eventDataString);
                if (!parsed) {
                    utils.logError("handleFileListEvent: JSON parsing error for data: " + eventDataString);
                    uiManager.updateStatus("폴더 데이터 처리 중 오류가 발생했습니다.", false);
                    return;
                }
                parsedData = parsed as FileListEventData;
            } else if (typeof eventDataString === "object" && eventDataString !== null) {
                parsedData = eventDataString as FileListEventData;
                utils.debugLog("handleFileListEvent: Received data as object (no parsing needed)");
            } else {
                utils.logError("handleFileListEvent: Unknown data type received: " + typeof eventDataString);
                uiManager.updateStatus("예상치 못한 데이터 형식을 받았습니다.", false);
                return;
            }

            if (!parsedData || !parsedData.soundFiles) {
                utils.logError("handleFileListEvent: Invalid data structure (soundFiles missing). Parsed data:", parsedData);
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
            utils.logError("handleFileListEvent: CRITICAL ERROR during event processing:", e);
            uiManager.updateStatus("폴더 정보를 처리하는 중 오류가 발생했습니다.", false);
        }
    }
    
    // ExtendScript 함수 호출
    function callExtendScript(scriptCode: string, callback?: (result: string) => void): void {
        const utils = getUtils();
        if (!csInterface) {
            utils.logError("CSInterface not initialized");
            return;
        }

        utils.debugLog("Executing JSX code: " + scriptCode);
        csInterface.evalScript(scriptCode, callback || function(result: string) {
            utils.debugLog("JSX result: " + result);
        });
    }

    // Promise 기반 ExtendScript 호출 (callback hell 제거용)
    function callExtendScriptAsync(scriptCode: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const utils = getUtils();
            if (!csInterface) {
                const error = "CSInterface not initialized";
                utils.logError(error);
                reject(new Error(error));
                return;
            }

            utils.debugLog("Executing JSX code (async): " + scriptCode);
            csInterface.evalScript(scriptCode, function(result: string) {
                utils.debugLog("JSX result (async): " + result);

                // 에러 체크
                if (typeof result === 'string' && result.indexOf('error:') === 0) {
                    reject(new Error(result.substring(6)));
                } else if (typeof result === 'string' && result.indexOf('ERROR:') === 0) {
                    reject(new Error(result.substring(6)));
                } else {
                    resolve(result);
                }
            });
        });
    }

    // DI 상태 확인 함수 (디버깅용) - Phase 2.3
    function getDIStatus(): { isDIAvailable: boolean; dependencies: string[] } {
        const dependencies: string[] = [];

        if (DIHelpers) dependencies.push('DIHelpers (Available)');
        else dependencies.push('DIHelpers (Not loaded)');

        if (window.JSCUtils) dependencies.push('JSCUtils (Available)');
        else dependencies.push('JSCUtils (Missing)');

        if (window.JSCUIManager) dependencies.push('JSCUIManager (Available)');
        else dependencies.push('JSCUIManager (Missing)');

        if (window.JSCErrorHandler) dependencies.push('JSCErrorHandler (Available)');
        else dependencies.push('JSCErrorHandler (Missing)');

        if (window.JSCStateManager) dependencies.push('JSCStateManager (Available)');
        else dependencies.push('JSCStateManager (Missing)');

        return {
            isDIAvailable: !!DIHelpers,
            dependencies: dependencies
        };
    }
    
    // 공개 API
    return {
        initialize: initialize,
        callExtendScript: callExtendScript,
        callExtendScriptAsync: callExtendScriptAsync, // Promise 기반 (callback hell 제거용)
        getCSInterface: function() { return csInterface; },
        getDIStatus: getDIStatus // Phase 2.3
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCCommunication = JSCCommunication;
}