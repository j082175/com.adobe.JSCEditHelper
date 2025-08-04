/**
 * Audio File Processing Engine
 * 오디오 파일 검색, 필터링, 검증을 담당하는 TypeScript 엔진
 */

interface AudioFileInfo {
    name: string;
    fsName: string;  // Full system path
    displayName: string;
    extension: string;
    size?: number;
}

interface AudioFolderResult {
    files: AudioFileInfo[];
    path: string;
    totalFiles: number;
    filteredCount: number;
}

interface AudioProcessingConfig {
    folderPath: string;
    filterByDefaultPrefix: boolean;
    supportedExtensions?: string[];
    excludePatterns?: string[];
}

const AudioFileProcessor = (function() {
    const DEFAULT_EXTENSIONS = [
        '.wav', '.mp3', '.aif', '.aiff', '.m4a',
        '.WAV', '.MP3', '.AIF', '.AIFF', '.M4A'
    ];

    const DEFAULT_PREFIX = 'Default';

    /**
     * 폴더에서 오디오 파일을 검색하고 필터링
     */
    function processAudioFolder(config: AudioProcessingConfig): AudioFolderResult {
        window.JSCUtils.logDebug(`Audio folder processing started: ${config.folderPath}`);
        
        // 경로 정규화
        const normalizedPath = normalizePath(config.folderPath);
        
        // 폴더 유효성 검사
        const validation = validateFolderPath(normalizedPath);
        if (!validation.isValid) {
            throw new Error(`Invalid folder path: ${validation.errors.join(', ')}`);
        }

        // 확장자 목록 준비
        const extensions = config.supportedExtensions || DEFAULT_EXTENSIONS;
        
        // ExtendScript 호출을 위한 명령어 생성
        const command = {
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
    function hasDefaultPrefix(fileName: string): boolean {
        if (!fileName || typeof fileName !== 'string') {
            return false;
        }
        
        return fileName.toLowerCase().startsWith(DEFAULT_PREFIX.toLowerCase());
    }

    /**
     * 파일 확장자가 지원되는지 확인
     */
    function isSupportedAudioFile(fileName: string, extensions: string[] = DEFAULT_EXTENSIONS): boolean {
        if (!fileName || typeof fileName !== 'string') {
            return false;
        }

        const fileExtension = getFileExtension(fileName);
        return extensions.some(ext => 
            ext.toLowerCase() === fileExtension.toLowerCase()
        );
    }

    /**
     * 파일들을 필터링 조건에 따라 분류
     */
    function filterAudioFiles(files: AudioFileInfo[], config: AudioProcessingConfig): AudioFileInfo[] {
        if (!files || !Array.isArray(files)) {
            return [];
        }

        let filteredFiles = files.filter(file => {
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
                for (const pattern of config.excludePatterns) {
                    if (file.name.toLowerCase().includes(pattern.toLowerCase())) {
                        return false;
                    }
                }
            }

            return true;
        });

        // 이름 순으로 정렬
        filteredFiles.sort((a, b) => a.name.localeCompare(b.name));

        window.JSCUtils.logDebug(`Filtered ${filteredFiles.length} files from ${files.length} total`);
        return filteredFiles;
    }

    /**
     * 경로 정규화 (윈도우 경로 표준화)
     */
    function normalizePath(path: string): string {
        if (!path || typeof path !== 'string') {
            return '';
        }

        return path
            .trim()
            .replace(/['"`]/g, '')  // 따옴표 제거
            .replace(/\\\\/g, '\\') // 더블 백슬래시 정규화
            .replace(/\//g, '\\');  // 슬래시를 백슬래시로 변환
    }

    /**
     * 폴더 경로 유효성 검사
     */
    function validateFolderPath(path: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!path) {
            errors.push('폴더 경로가 비어있습니다');
        }

        if (path.length < 3) {
            errors.push('폴더 경로가 너무 짧습니다');
        }

        // ExtendScript 에러 패턴 체크 (기존 로직 유지)
        const errorPatterns = [
            'EvalScript error',
            'undefined',
            'null',
            '[object Object]',
            'error:',
            'JSX exception'
        ];

        for (const pattern of errorPatterns) {
            if (path.indexOf(pattern) !== -1) {
                errors.push(`잘못된 경로 형식: ${pattern}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 파일 확장자 추출
     */
    function getFileExtension(fileName: string): string {
        if (!fileName || typeof fileName !== 'string') {
            return '';
        }

        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
            return '';
        }

        return fileName.substring(lastDotIndex);
    }

    /**
     * ExtendScript 호스트로부터 파일 목록 요청
     */
    function requestAudioFilesFromHost(command: any): AudioFolderResult {
        // 이 부분은 기존 communication 시스템을 활용
        const commandJson = JSON.stringify(command);
        
        // 임시로 기존 방식 사용 (나중에 개선)
        window.JSCCommunication.callExtendScript(
            `getAudioFilesAdvanced(${JSON.stringify(commandJson)})`,
            (result: string) => {
                window.JSCUtils.logDebug('Audio files result received: ' + result);
            }
        );

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
    function createAudioFileInfo(filePath: string, fileName: string): AudioFileInfo {
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
    function getDisplayName(fileName: string): string {
        if (!fileName) return '';
        
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return fileName.substring(0, lastDotIndex);
        }
        
        return fileName;
    }

    /**
     * 파일 크기 형식화
     */
    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 공개 API 반환
    return {
        processAudioFolder,
        hasDefaultPrefix,
        isSupportedAudioFile,
        filterAudioFiles,
        createAudioFileInfo,
        formatFileSize
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    (window as any).AudioFileProcessor = AudioFileProcessor;
}