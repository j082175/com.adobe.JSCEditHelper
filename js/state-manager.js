/**
 * JSCEditHelper - State Manager
 * 애플리케이션 상태 관리를 담당하는 모듈
 */

var JSCStateManager = (function() {
    'use strict';
    
    var currentFolderPath = "";
    
    // 현재 폴더 경로 설정 (실용적 검증)
    function setCurrentFolderPath(path) {
        if (JSCUtils.isValidPath(path)) {
            currentFolderPath = path.trim();
            JSCUtils.logDebug("Updated currentFolderPath");
            return true;
        }
        
        JSCUtils.logWarn("Invalid path provided");
        return false;
    }
    
    // 현재 폴더 경로 가져오기
    function getCurrentFolderPath() {
        return currentFolderPath;
    }
    
    // 레거시 키에서 데이터 마이그레이션
    function migrateLegacyData() {
        var legacyKeys = ["JSCEditHelper_soundFolder"]; // 이전에 잘못 사용한 키들
        
        for (var i = 0; i < legacyKeys.length; i++) {
            var legacyKey = legacyKeys[i];
            var legacyValue = JSCUtils.loadFromStorage(legacyKey);
            
            if (legacyValue && JSCUtils.isValidPath(legacyValue)) {
                JSCUtils.logInfo("Migrating data from legacy key: " + legacyKey);
                JSCUtils.saveToStorage(JSCUtils.CONFIG.SOUND_FOLDER_KEY, legacyValue);
                JSCUtils.removeFromStorage(legacyKey); // 레거시 키 삭제
                return legacyValue;
            }
        }
        return null;
    }
    
    // 폴더 경로 초기화 및 복원
    function initializeFolderPath() {
        JSCUtils.logDebug("Initializing folder path from storage");
        
        // 먼저 현재 키에서 시도
        var savedFolder = JSCUtils.loadFromStorage(JSCUtils.CONFIG.SOUND_FOLDER_KEY);
        
        // 현재 키에 값이 없으면 레거시 데이터 마이그레이션 시도
        if (!savedFolder) {
            savedFolder = migrateLegacyData();
        }

        // 기존 방식의 관대한 검증 사용 (초기화 시에는)
        if (savedFolder && JSCUtils.isValidPath(savedFolder)) {
            currentFolderPath = savedFolder;
            JSCUIManager.updateFolderPath(savedFolder);
            JSCUtils.logInfo("Valid folder path restored from storage: " + savedFolder);
            return true;
        } else {
            if (savedFolder) {
                JSCUtils.logWarn("Invalid saved folder path detected, clearing storage: " + savedFolder);
                JSCUtils.removeFromStorage(JSCUtils.CONFIG.SOUND_FOLDER_KEY);
            }
            currentFolderPath = "";
            JSCUIManager.updateFolderPath("");
            JSCUtils.logDebug("No valid folder path found, initialized to empty");
            return false;
        }
    }
    
    // 폴더 경로 저장
    function saveFolderPath(path) {
        if (setCurrentFolderPath(path)) {
            JSCUtils.saveToStorage(JSCUtils.CONFIG.SOUND_FOLDER_KEY, path);
            JSCUIManager.updateFolderPath(path);
            return true;
        }
        return false;
    }
    
    // 폴더 경로 지우기
    function clearFolderPath() {
        currentFolderPath = "";
        JSCUtils.removeFromStorage(JSCUtils.CONFIG.SOUND_FOLDER_KEY);
        JSCUIManager.updateFolderPath("");
        JSCUtils.debugLog("Folder path cleared");
    }
    
    // 설정 가져오기
    function getSettings() {
        var audioTrackElement = document.getElementById("audio-track");
        
        return {
            folderPath: currentFolderPath,
            audioTrack: audioTrackElement ? audioTrackElement.value : "auto"
        };
    }
    
    // 실용적인 상태 검증
    function validateState() {
        var errors = [];
        
        if (!currentFolderPath) {
            errors.push("효과음 폴더 경로가 설정되지 않았습니다.");
        } else if (!JSCUtils.isValidPath(currentFolderPath)) {
            errors.push("효과음 폴더 경로가 올바르지 않습니다.");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
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
        validateState: validateState
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCStateManager = JSCStateManager;
}