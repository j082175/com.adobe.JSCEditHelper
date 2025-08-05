/**
 * Text Processor - 새로 추가하는 텍스트 처리 모듈
 * 텍스트 분석, 변환, 검증 기능을 제공
 */

interface TextProcessorInterface {
    processText(text: string, options?: ProcessingOptions): ProcessingResult;
    validateText(text: string): TextValidationResult;
    formatText(text: string, format: TextFormat): string;
    getDIStatus(): { isDIAvailable: boolean; dependencies: string[] };
}

interface ProcessingOptions {
    removeSpecialChars?: boolean;
    convertToUpperCase?: boolean;
    trimWhitespace?: boolean;
    maxLength?: number;
}

interface ProcessingResult {
    success: boolean;
    originalText: string;
    processedText: string;
    changes: string[];
    warnings: string[];
}

interface TextValidationResult {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
}

enum TextFormat {
    UPPERCASE = 'uppercase',
    LOWERCASE = 'lowercase',
    TITLE_CASE = 'titlecase',
    SENTENCE_CASE = 'sentencecase'
}

const TextProcessor = (function(): TextProcessorInterface {
    'use strict';
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    let uiService: any = null;
    let errorService: any = null;
    
    function initializeDIDependencies() {
        try {
            diContainer = (window as any).DI;
            if (diContainer) {
                utilsService = diContainer.getSafe('JSCUtils');
                uiService = diContainer.getSafe('JSCUIManager');
                errorService = diContainer.getSafe('JSCErrorHandler');
            }
        } catch (e) {
            // DI 사용 불가시 레거시 모드로 작동
        }
    }
    
    // 초기화 시도
    initializeDIDependencies();
    
    // 앱 초기화 후에 DI 서비스 재시도
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            if (!utilsService || !uiService || !errorService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils(): any {
        return utilsService || (window as any).JSCUtils || {
            logDebug: (msg: string) => console.log(`[TextProcessor] ${msg}`),
            logWarn: (msg: string) => console.warn(`[TextProcessor] ${msg}`),
            logInfo: (msg: string) => console.info(`[TextProcessor] ${msg}`),
            isValidPath: (path: string) => !!path,
            safeJSONParse: (str: string) => { try { return JSON.parse(str); } catch { return null; } }
        };
    }
    
    function getUIManager(): any {
        return uiService || (window as any).JSCUIManager || {
            updateStatus: (msg: string, success?: boolean) => console.log(`Status: ${msg} (${success})`),
            displayMessage: (msg: string) => console.log(`Message: ${msg}`)
        };
    }
    
    function getErrorHandler(): any {
        return errorService || (window as any).JSCErrorHandler || {
            handleError: (error: any) => console.error('TextProcessor Error:', error),
            logError: (msg: string) => console.error(`[TextProcessor Error] ${msg}`)
        };
    }
    
    /**
     * 텍스트 처리 메인 함수
     */
    function processText(text: string, options: ProcessingOptions = {}): ProcessingResult {
        const utils = getUtils();
        const ui = getUIManager();
        
        utils.logDebug(`Processing text: "${text.substring(0, 50)}..."`);
        
        let processedText = text;
        const changes: string[] = [];
        const warnings: string[] = [];
        
        try {
            // 1. 공백 제거
            if (options.trimWhitespace !== false) {
                const trimmed = processedText.trim();
                if (trimmed !== processedText) {
                    processedText = trimmed;
                    changes.push('공백 제거');
                }
            }
            
            // 2. 특수문자 제거
            if (options.removeSpecialChars) {
                const cleaned = processedText.replace(/[^\w\s가-힣]/g, '');
                if (cleaned !== processedText) {
                    processedText = cleaned;
                    changes.push('특수문자 제거');
                }
            }
            
            // 3. 대문자 변환
            if (options.convertToUpperCase) {
                processedText = processedText.toUpperCase();
                changes.push('대문자 변환');
            }
            
            // 4. 길이 제한
            if (options.maxLength && processedText.length > options.maxLength) {
                processedText = processedText.substring(0, options.maxLength);
                changes.push(`길이 제한 적용 (${options.maxLength}자)`);
                warnings.push(`원본 텍스트가 잘렸습니다 (${text.length} → ${options.maxLength}자)`);
            }
            
            // 결과 로깅
            utils.logInfo(`텍스트 처리 완료: ${changes.length}개 변경사항`);
            if (warnings.length > 0) {
                utils.logWarn(`경고 ${warnings.length}개: ${warnings.join(', ')}`);
            }
            
            // UI 업데이트
            ui.updateStatus(`텍스트 처리 완료 (${changes.length}개 변경)`, true);
            
            return {
                success: true,
                originalText: text,
                processedText: processedText,
                changes: changes,
                warnings: warnings
            };
            
        } catch (e) {
            const errorHandler = getErrorHandler();
            const errorMsg = `텍스트 처리 중 오류: ${(e as Error).message}`;
            errorHandler.handleError(e);
            ui.updateStatus(errorMsg, false);
            
            return {
                success: false,
                originalText: text,
                processedText: text,
                changes: [],
                warnings: [errorMsg]
            };
        }
    }
    
    /**
     * 텍스트 검증
     */
    function validateText(text: string): TextValidationResult {
        const utils = getUtils();
        const errors: string[] = [];
        const suggestions: string[] = [];
        
        utils.logDebug(`Validating text: "${text.substring(0, 30)}..."`);
        
        // 기본 검증
        if (!text || text.trim().length === 0) {
            errors.push('텍스트가 비어있습니다');
        }
        
        if (text.length > 10000) {
            errors.push('텍스트가 너무 깁니다 (10,000자 초과)');
            suggestions.push('텍스트를 더 짧게 나누어 처리하세요');
        }
        
        // 특수 문자 체크
        const specialChars = text.match(/[^\w\s가-힣]/g);
        if (specialChars && specialChars.length > text.length * 0.1) {
            suggestions.push('특수문자가 많습니다. removeSpecialChars 옵션 사용을 고려하세요');
        }
        
        // 공백 체크
        if (text.startsWith(' ') || text.endsWith(' ')) {
            suggestions.push('앞뒤 공백이 있습니다. trimWhitespace 옵션 사용을 고려하세요');
        }
        
        utils.logInfo(`텍스트 검증 완료: ${errors.length}개 오류, ${suggestions.length}개 제안`);
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            suggestions: suggestions
        };
    }
    
    /**
     * 텍스트 포맷팅
     */
    function formatText(text: string, format: TextFormat): string {
        const utils = getUtils();
        
        utils.logDebug(`Formatting text with: ${format}`);
        
        switch (format) {
            case TextFormat.UPPERCASE:
                return text.toUpperCase();
                
            case TextFormat.LOWERCASE:
                return text.toLowerCase();
                
            case TextFormat.TITLE_CASE:
                return text.replace(/\w\S*/g, (txt) => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
                
            case TextFormat.SENTENCE_CASE:
                return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
                
            default:
                utils.logWarn(`알 수 없는 포맷: ${format}`);
                return text;
        }
    }
    
    /**
     * DI 상태 확인 함수 (디버깅용)
     */
    function getDIStatus(): { isDIAvailable: boolean; dependencies: string[] } {
        const dependencies: string[] = [];
        
        if (utilsService) dependencies.push('JSCUtils (DI)');
        else if ((window as any).JSCUtils) dependencies.push('JSCUtils (Legacy)');
        
        if (uiService) dependencies.push('JSCUIManager (DI)');
        else if ((window as any).JSCUIManager) dependencies.push('JSCUIManager (Legacy)');
        
        if (errorService) dependencies.push('JSCErrorHandler (DI)');
        else if ((window as any).JSCErrorHandler) dependencies.push('JSCErrorHandler (Legacy)');
        
        return {
            isDIAvailable: !!diContainer,
            dependencies: dependencies
        };
    }
    
    // 공개 API
    return {
        processText: processText,
        validateText: validateText,
        formatText: formatText,
        getDIStatus: getDIStatus
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    (window as any).TextProcessor = TextProcessor;
    (window as any).TextFormat = TextFormat;
}