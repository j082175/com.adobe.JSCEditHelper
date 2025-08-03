/**
 * JSCEditHelper - Validation Module
 * 입력 검증을 담당하는 모듈
 */

var JSCValidation = (function() {
    'use strict';
    
    // 검증 규칙 정의
    var VALIDATION_RULES = {
        FOLDER_PATH: {
            minLength: 3,
            maxLength: 260, // Windows MAX_PATH
            pattern: /^[A-Za-z]:\\/,
            forbiddenChars: /[<>"|?*]/, // 콜론(:) 제거 - Windows 드라이브 문자에 필요
            forbiddenNames: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
        },
        AUDIO_TRACK: {
            validValues: ['auto', '1', '2', '3', '4', '5', '6', '7', '8']
        },
        FILE_EXTENSION: {
            audioExtensions: ['.wav', '.mp3', '.aac', '.m4a', '.flac', '.ogg', '.wma']
        }
    };
    
    // 검증 결과 객체 생성
    function createValidationResult(isValid, errors, warnings) {
        return {
            isValid: isValid || false,
            errors: errors || [],
            warnings: warnings || [],
            hasErrors: function() { return this.errors.length > 0; },
            hasWarnings: function() { return this.warnings.length > 0; },
            getFirstError: function() { return this.errors.length > 0 ? this.errors[0] : null; },
            getAllMessages: function() { return this.errors.concat(this.warnings); }
        };
    }
    
    // 폴더 경로 검증
    function validateFolderPath(path) {
        var errors = [];
        var warnings = [];
        
        if (!path || typeof path !== 'string') {
            errors.push('폴더 경로가 입력되지 않았습니다.');
            return createValidationResult(false, errors, warnings);
        }
        
        var trimmedPath = path.trim();
        
        // 길이 검증
        if (trimmedPath.length < VALIDATION_RULES.FOLDER_PATH.minLength) {
            errors.push('폴더 경로가 너무 짧습니다.');
        }
        
        if (trimmedPath.length > VALIDATION_RULES.FOLDER_PATH.maxLength) {
            errors.push('폴더 경로가 너무 깁니다. (최대 ' + VALIDATION_RULES.FOLDER_PATH.maxLength + '자)');
        }
        
        // Windows 드라이브 패턴 검증
        if (!VALIDATION_RULES.FOLDER_PATH.pattern.test(trimmedPath)) {
            errors.push('올바른 Windows 폴더 경로 형식이 아닙니다. (예: C:\\폴더)');
        }
        
        // 금지된 문자 검증 (드라이브 문자 이후의 경로 부분만)
        var pathWithoutDrive = trimmedPath.replace(/^[A-Za-z]:/, ''); // 드라이브 문자 제거
        if (VALIDATION_RULES.FOLDER_PATH.forbiddenChars.test(pathWithoutDrive)) {
            errors.push('폴더 경로에 사용할 수 없는 문자가 포함되어 있습니다: < > " | ? *');
        }
        
        // 금지된 파일명 검증
        var pathParts = trimmedPath.split(/[\\/]/);
        for (var i = 0; i < pathParts.length; i++) {
            var part = pathParts[i].toUpperCase();
            if (VALIDATION_RULES.FOLDER_PATH.forbiddenNames.indexOf(part) !== -1) {
                errors.push('폴더 경로에 시스템 예약어가 포함되어 있습니다: ' + part);
            }
        }
        
        // 경고사항 검사
        if (trimmedPath.indexOf(' ') !== -1) {
            warnings.push('폴더 경로에 공백이 포함되어 있습니다. 일부 시스템에서 문제가 발생할 수 있습니다.');
        }
        
        if (trimmedPath.length > 100) {
            warnings.push('폴더 경로가 매우 깁니다. 호환성 문제가 발생할 수 있습니다.');
        }
        
        return createValidationResult(errors.length === 0, errors, warnings);
    }
    
    // 오디오 트랙 검증
    function validateAudioTrack(track) {
        var errors = [];
        
        if (!track || typeof track !== 'string') {
            errors.push('오디오 트랙이 선택되지 않았습니다.');
            return createValidationResult(false, errors);
        }
        
        if (VALIDATION_RULES.AUDIO_TRACK.validValues.indexOf(track) === -1) {
            errors.push('올바르지 않은 오디오 트랙입니다.');
        }
        
        return createValidationResult(errors.length === 0, errors);
    }
    
    // 파일 경로 검증 (폴더 경로보다 관대함)
    function validateFilePath(filePath) {
        var errors = [];
        var warnings = [];
        
        if (!filePath || typeof filePath !== 'string') {
            errors.push('파일 경로가 올바르지 않습니다.');
            return createValidationResult(false, errors);
        }
        
        var trimmedPath = filePath.trim();
        
        // 기본적인 길이 검사
        if (trimmedPath.length < 3) {
            errors.push('파일 경로가 너무 짧습니다.');
        }
        
        // Windows 드라이브 패턴 검사 (선택적)
        if (!/^[A-Za-z]:/.test(trimmedPath)) {
            warnings.push('상대 경로이거나 비표준 경로 형식입니다.');
        }
        
        return createValidationResult(errors.length === 0, errors, warnings);
    }
    
    // 파일 확장자 검증
    function validateAudioFile(filePath) {
        var errors = [];
        var warnings = [];
        
        // 먼저 기본 파일 경로 검증
        var pathValidation = validateFilePath(filePath);
        if (!pathValidation.isValid) {
            return pathValidation;
        }
        
        var extension = getFileExtension(filePath).toLowerCase();
        
        if (VALIDATION_RULES.FILE_EXTENSION.audioExtensions.indexOf(extension) === -1) {
            errors.push('지원되지 않는 오디오 파일 형식입니다: ' + extension);
        }
        
        // 파일 크기에 대한 경고 (확장자로 추정)
        if (extension === '.wav' || extension === '.flac') {
            warnings.push('무손실 오디오 파일은 용량이 클 수 있습니다.');
        }
        
        return createValidationResult(errors.length === 0, errors, warnings);
    }
    
    // 파일 확장자 추출
    function getFileExtension(filePath) {
        var lastDotIndex = filePath.lastIndexOf('.');
        return lastDotIndex !== -1 ? filePath.substring(lastDotIndex) : '';
    }
    
    // 애플리케이션 설정 전체 검증
    function validateAppSettings(settings) {
        var errors = [];
        var warnings = [];
        
        if (!settings || typeof settings !== 'object') {
            errors.push('설정 객체가 올바르지 않습니다.');
            return createValidationResult(false, errors);
        }
        
        // 폴더 경로 검증
        var folderValidation = validateFolderPath(settings.folderPath);
        errors = errors.concat(folderValidation.errors);
        warnings = warnings.concat(folderValidation.warnings);
        
        // 오디오 트랙 검증
        var trackValidation = validateAudioTrack(settings.audioTrack);
        errors = errors.concat(trackValidation.errors);
        warnings = warnings.concat(trackValidation.warnings);
        
        return createValidationResult(errors.length === 0, errors, warnings);
    }
    
    // 사용자 입력 정제 (sanitization)
    function sanitizeFolderPath(path) {
        if (!path || typeof path !== 'string') {
            return '';
        }
        
        return path
            .trim()
            .replace(/[<>:"|?*]/g, '') // 금지된 문자 제거
            .replace(/\/{2,}/g, '/') // 연속된 슬래시 정리
            .replace(/\\{2,}/g, '\\'); // 연속된 백슬래시 정리
    }
    
    // 파일 이름 정제
    function sanitizeFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return '';
        }
        
        return fileName
            .trim()
            .replace(/[<>:"/\\|?*]/g, '') // 금지된 문자 제거
            .replace(/\s+/g, ' ') // 연속된 공백 정리
            .substring(0, 255); // 길이 제한
    }
    
    // 실시간 검증 (입력 중 검증)
    function validateLive(value, validationType) {
        switch (validationType) {
            case 'folderPath':
                return validateFolderPath(value);
            case 'audioTrack':
                return validateAudioTrack(value);
            case 'audioFile':
                return validateAudioFile(value);
            default:
                return createValidationResult(true);
        }
    }
    
    // 검증 결과를 사용자에게 표시
    function displayValidationResult(result, showSuccessMessage) {
        if (result.hasErrors()) {
            JSCErrorHandler.handleValidationError(
                'INVALID_INPUT',
                result.getFirstError(),
                { allErrors: result.errors, warnings: result.warnings }
            );
            return false;
        }
        
        if (result.hasWarnings()) {
            JSCUtils.logWarn('Validation warnings: ' + result.warnings.join(', '));
        }
        
        if (showSuccessMessage && result.isValid) {
            JSCUIManager.updateStatus('입력이 올바릅니다.', true);
        }
        
        return true;
    }
    
    // 공개 API
    return {
        VALIDATION_RULES: VALIDATION_RULES,
        createValidationResult: createValidationResult,
        validateFolderPath: validateFolderPath,
        validateFilePath: validateFilePath,
        validateAudioTrack: validateAudioTrack,
        validateAudioFile: validateAudioFile,
        validateAppSettings: validateAppSettings,
        sanitizeFolderPath: sanitizeFolderPath,
        sanitizeFileName: sanitizeFileName,
        validateLive: validateLive,
        displayValidationResult: displayValidationResult,
        getFileExtension: getFileExtension
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCValidation = JSCValidation;
}