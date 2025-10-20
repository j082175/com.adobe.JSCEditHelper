/**
 * JSCEditHelper - State Manager
 * 애플리케이션 상태 관리를 담당하는 모듈
 */

interface AppSettings {
    folderPath: string;
    audioTrack: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

interface JSCStateManagerInterface {
    setCurrentFolderPath(path: string): boolean;
    getCurrentFolderPath(): string;
    initializeFolderPath(): boolean;
    saveFolderPath(path: string): boolean;
    clearFolderPath(): void;
    getSettings(): AppSettings;
    validateState(): ValidationResult;
    getDIStatus(): { isDIAvailable: boolean; dependencies: string[] }; // Phase 2.2
}

const JSCStateManager = (function(): JSCStateManagerInterface {
    'use strict';
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    let uiService: any = null;
    
    try {
        diContainer = (window as any).DI;
        if (diContainer) {
            // DI에서 서비스 가져오기 시도
            utilsService = diContainer.getSafe('JSCUtils');
            uiService = diContainer.getSafe('JSCUIManager');
        }
    } catch (e) {
        // DI 사용 불가시 레거시 모드로 작동
    }
    
    // 유틸리티 서비스 가져오기 (DI 우선, 레거시 fallback)
    function getUtils(): JSCUtilsInterface {
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[StateManager]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[StateManager]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[StateManager]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[StateManager]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[StateManager]', msg),
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
        return utilsService || window.JSCUtils || fallback;
    }
    
    // UI 서비스 가져오기 (DI 우선, 레거시 fallback)
    function getUIManager(): any {
        return uiService || window.JSCUIManager || {
            updateFolderPath: (_path: string) => { /* no-op fallback */ }
        };
    }
    
    let currentFolderPath: string = "";
    
    // 현재 폴더 경로 설정 (실용적 검증)
    function setCurrentFolderPath(path: string): boolean {
        const utils = getUtils();
        if (utils.isValidPath(path)) {
            currentFolderPath = path.trim();
            utils.logDebug("Updated currentFolderPath");
            return true;
        }
        
        utils.logWarn("Invalid path provided");
        return false;
    }
    
    // 현재 폴더 경로 가져오기
    function getCurrentFolderPath(): string {
        return currentFolderPath;
    }
    
    // 레거시 키에서 데이터 마이그레이션
    function migrateLegacyData(): string | null {
        const utils = getUtils();
        const legacyKeys: string[] = ["JSCEditHelper_soundFolder"]; // 이전에 잘못 사용한 키들
        
        for (const legacyKey of legacyKeys) {
            const legacyValue = utils.loadFromStorage(legacyKey);
            
            if (legacyValue && utils.isValidPath(legacyValue)) {
                utils.logInfo("Migrating data from legacy key: " + legacyKey);
                utils.saveToStorage(utils.CONFIG.SOUND_FOLDER_KEY, legacyValue);
                utils.removeFromStorage(legacyKey); // 레거시 키 삭제
                return legacyValue;
            }
        }
        return null;
    }
    
    // 폴더 경로 초기화 및 복원
    function initializeFolderPath(): boolean {
        const utils = getUtils();
        const uiManager = getUIManager();
        
        utils.logDebug("Initializing folder path from storage");
        
        // 먼저 현재 키에서 시도
        let savedFolder = utils.loadFromStorage(utils.CONFIG.SOUND_FOLDER_KEY);
        
        // 현재 키에 값이 없으면 레거시 데이터 마이그레이션 시도
        if (!savedFolder) {
            savedFolder = migrateLegacyData();
        }

        // 기존 방식의 관대한 검증 사용 (초기화 시에는)
        if (savedFolder && utils.isValidPath(savedFolder)) {
            currentFolderPath = savedFolder;
            uiManager.updateFolderPath(savedFolder);
            utils.logInfo("Valid folder path restored from storage: " + savedFolder);
            return true;
        } else {
            if (savedFolder) {
                utils.logWarn("Invalid saved folder path detected, clearing storage: " + savedFolder);
                utils.removeFromStorage(utils.CONFIG.SOUND_FOLDER_KEY);
            }
            currentFolderPath = "";
            uiManager.updateFolderPath("");
            utils.logDebug("No valid folder path found, initialized to empty");
            return false;
        }
    }
    
    // 폴더 경로 저장
    function saveFolderPath(path: string): boolean {
        if (setCurrentFolderPath(path)) {
            const utils = getUtils();
            const uiManager = getUIManager();
            utils.saveToStorage(utils.CONFIG.SOUND_FOLDER_KEY, path);
            uiManager.updateFolderPath(path);
            return true;
        }
        return false;
    }
    
    // 폴더 경로 지우기
    function clearFolderPath(): void {
        const utils = getUtils();
        const uiManager = getUIManager();
        currentFolderPath = "";
        utils.removeFromStorage(utils.CONFIG.SOUND_FOLDER_KEY);
        uiManager.updateFolderPath("");
        utils.debugLog("Folder path cleared");
    }
    
    // 설정 가져오기
    function getSettings(): AppSettings {
        const audioTrackElement = document.getElementById("audio-track") as HTMLSelectElement;
        
        return {
            folderPath: currentFolderPath,
            audioTrack: audioTrackElement ? audioTrackElement.value : "auto"
        };
    }
    
    // 실용적인 상태 검증
    function validateState(): ValidationResult {
        const utils = getUtils();
        const errors: string[] = [];
        
        if (!currentFolderPath) {
            errors.push("효과음 폴더 경로가 설정되지 않았습니다.");
        } else if (!utils.isValidPath(currentFolderPath)) {
            errors.push("효과음 폴더 경로가 올바르지 않습니다.");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // DI 상태 확인 함수 (디버깅용) - Phase 2.2
    function getDIStatus(): { isDIAvailable: boolean; dependencies: string[] } {
        const dependencies: string[] = [];
        
        if (utilsService) dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils) dependencies.push('JSCUtils (Legacy)');
        
        if (uiService) dependencies.push('JSCUIManager (DI)');
        else if (window.JSCUIManager) dependencies.push('JSCUIManager (Legacy)');
        
        return {
            isDIAvailable: !!diContainer,
            dependencies: dependencies
        };
    }
    
    // 공개 API
    return {
        setCurrentFolderPath: setCurrentFolderPath,
        getCurrentFolderPath: getCurrentFolderPath,
        initializeFolderPath: initializeFolderPath,
        saveFolderPath: saveFolderPath,
        clearFolderPath: clearFolderPath,
        getSettings: getSettings,
        validateState: validateState,
        getDIStatus: getDIStatus // Phase 2.2
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCStateManager = JSCStateManager;
}