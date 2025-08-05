"use strict";
/**
 * Audio File Processing Engine
 * 오디오 파일 검색, 필터링, 검증을 담당하는 TypeScript 엔진
 */
var AudioFileProcessor = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var communicationService = null;
    function initializeDIDependencies() {
        try {
            diContainer = window.DI;
            if (diContainer) {
                // DI에서 서비스 가져오기 시도
                utilsService = diContainer.getSafe('JSCUtils');
                communicationService = diContainer.getSafe('JSCCommunication');
            }
        }
        catch (e) {
            // DI 사용 불가시 레거시 모드로 작동
        }
    }
    // 초기화 시도 (즉시 및 지연)
    initializeDIDependencies();
    // 앱 초기화 후에 DI 서비스 재시도
    if (typeof window !== 'undefined') {
        setTimeout(function () {
            if (!utilsService || !communicationService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils() {
        return utilsService || window.JSCUtils || {
            logDebug: function (msg) { console.log('[DEBUG]', msg); },
            logWarn: function (msg) { console.warn('[WARN]', msg); },
            logInfo: function (msg) { console.info('[INFO]', msg); }
        };
    }
    function getCommunication() {
        return communicationService || window.JSCCommunication || {
            callExtendScript: function (_script, callback) {
                callback('error: Communication service not available');
            }
        };
    }
    var DEFAULT_EXTENSIONS = [
        '.wav', '.mp3', '.aif', '.aiff', '.m4a',
        '.WAV', '.MP3', '.AIF', '.AIFF', '.M4A'
    ];
    var DEFAULT_PREFIX = 'Default';
    /**
     * 폴더에서 오디오 파일을 검색하고 필터링
     */
    function processAudioFolder(config) {
        var utils = getUtils();
        utils.logDebug("Audio folder processing started: ".concat(config.folderPath));
        // 경로 정규화
        var normalizedPath = normalizePath(config.folderPath);
        // 폴더 유효성 검사
        var validation = validateFolderPath(normalizedPath);
        if (!validation.isValid) {
            throw new Error("Invalid folder path: ".concat(validation.errors.join(', ')));
        }
        // 확장자 목록 준비
        var extensions = config.supportedExtensions || DEFAULT_EXTENSIONS;
        // ExtendScript 호출을 위한 명령어 생성
        var command = {
            action: 'getAudioFiles',
            folderPath: normalizedPath,
            extensions: extensions,
            filterByDefaultPrefix: config.filterByDefaultPrefix,
            excludePatterns: config.excludePatterns || []
        };
        return requestAudioFilesFromHost(command);
    }
    /**
     * 파일 이름이 Default 접두사로 시작하는지 확인
     */
    function hasDefaultPrefix(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return false;
        }
        return fileName.toLowerCase().startsWith(DEFAULT_PREFIX.toLowerCase());
    }
    /**
     * 파일 확장자가 지원되는지 확인
     */
    function isSupportedAudioFile(fileName, extensions) {
        if (extensions === void 0) { extensions = DEFAULT_EXTENSIONS; }
        if (!fileName || typeof fileName !== 'string') {
            return false;
        }
        var fileExtension = getFileExtension(fileName);
        return extensions.some(function (ext) {
            return ext.toLowerCase() === fileExtension.toLowerCase();
        });
    }
    /**
     * 파일들을 필터링 조건에 따라 분류
     */
    function filterAudioFiles(files, config) {
        if (!files || !Array.isArray(files)) {
            return [];
        }
        var filteredFiles = files.filter(function (file) {
            // 확장자 체크
            if (!isSupportedAudioFile(file.name, config.supportedExtensions)) {
                return false;
            }
            // Default 접두사 필터링
            if (config.filterByDefaultPrefix && !hasDefaultPrefix(file.name)) {
                return false;
            }
            // 제외 패턴 체크
            if (config.excludePatterns) {
                for (var _i = 0, _a = config.excludePatterns; _i < _a.length; _i++) {
                    var pattern = _a[_i];
                    if (file.name.toLowerCase().includes(pattern.toLowerCase())) {
                        return false;
                    }
                }
            }
            return true;
        });
        // 이름 순으로 정렬
        filteredFiles.sort(function (a, b) { return a.name.localeCompare(b.name); });
        var utils = getUtils();
        utils.logDebug("Filtered ".concat(filteredFiles.length, " files from ").concat(files.length, " total"));
        return filteredFiles;
    }
    /**
     * 경로 정규화 (윈도우 경로 표준화)
     */
    function normalizePath(path) {
        if (!path || typeof path !== 'string') {
            return '';
        }
        return path
            .trim()
            .replace(/['"`]/g, '') // 따옴표 제거
            .replace(/\\\\/g, '\\') // 더블 백슬래시 정규화
            .replace(/\//g, '\\'); // 슬래시를 백슬래시로 변환
    }
    /**
     * 폴더 경로 유효성 검사
     */
    function validateFolderPath(path) {
        var errors = [];
        if (!path) {
            errors.push('폴더 경로가 비어있습니다');
        }
        if (path.length < 3) {
            errors.push('폴더 경로가 너무 짧습니다');
        }
        // ExtendScript 에러 패턴 체크 (기존 로직 유지)
        var errorPatterns = [
            'EvalScript error',
            'undefined',
            'null',
            '[object Object]',
            'error:',
            'JSX exception'
        ];
        for (var _i = 0, errorPatterns_1 = errorPatterns; _i < errorPatterns_1.length; _i++) {
            var pattern = errorPatterns_1[_i];
            if (path.indexOf(pattern) !== -1) {
                errors.push("\uC798\uBABB\uB41C \uACBD\uB85C \uD615\uC2DD: ".concat(pattern));
            }
        }
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    /**
     * 파일 확장자 추출
     */
    function getFileExtension(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return '';
        }
        var lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
            return '';
        }
        return fileName.substring(lastDotIndex);
    }
    /**
     * ExtendScript 호스트로부터 파일 목록 요청
     */
    function requestAudioFilesFromHost(command) {
        // 이 부분은 기존 communication 시스템을 활용
        var commandJson = JSON.stringify(command);
        // DI 서비스 사용으로 개선
        var communication = getCommunication();
        var utils = getUtils();
        communication.callExtendScript("getAudioFilesAdvanced(".concat(JSON.stringify(commandJson), ")"), function (result) {
            utils.logDebug('Audio files result received: ' + result);
        });
        // 동기적 처리를 위한 임시 구현 (실제로는 비동기로 처리)
        return {
            files: [],
            path: command.folderPath,
            totalFiles: 0,
            filteredCount: 0
        };
    }
    /**
     * 오디오 파일 정보 생성
     */
    function createAudioFileInfo(filePath, fileName) {
        return {
            name: fileName,
            fsName: filePath,
            displayName: getDisplayName(fileName),
            extension: getFileExtension(fileName)
        };
    }
    /**
     * 표시용 파일 이름 생성 (확장자 제거 등)
     */
    function getDisplayName(fileName) {
        if (!fileName)
            return '';
        var lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return fileName.substring(0, lastDotIndex);
        }
        return fileName;
    }
    /**
     * 파일 크기 형식화
     */
    function formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        var dependencies = [];
        if (utilsService)
            dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
        if (communicationService)
            dependencies.push('JSCCommunication (DI)');
        else if (window.JSCCommunication)
            dependencies.push('JSCCommunication (Legacy)');
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
            dependencies: dependencies
        };
    }
    // 공개 API 반환
    return {
        processAudioFolder: processAudioFolder,
        hasDefaultPrefix: hasDefaultPrefix,
        isSupportedAudioFile: isSupportedAudioFile,
        filterAudioFiles: filterAudioFiles,
        createAudioFileInfo: createAudioFileInfo,
        formatFileSize: formatFileSize,
        getDIStatus: getDIStatus // DI 패턴 적용
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.AudioFileProcessor = AudioFileProcessor;
}
//# sourceMappingURL=audio-file-processor.js.map