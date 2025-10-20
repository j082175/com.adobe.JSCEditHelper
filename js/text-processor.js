"use strict";
/**
 * Text Processor - 새로 추가하는 텍스트 처리 모듈
 * 텍스트 분석, 변환, 검증 기능을 제공
 */
var TextFormat;
(function (TextFormat) {
    TextFormat["UPPERCASE"] = "uppercase";
    TextFormat["LOWERCASE"] = "lowercase";
    TextFormat["TITLE_CASE"] = "titlecase";
    TextFormat["SENTENCE_CASE"] = "sentencecase";
})(TextFormat || (TextFormat = {}));
var TextProcessor = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var uiService = null;
    var errorService = null;
    function initializeDIDependencies() {
        try {
            diContainer = window.DI;
            if (diContainer) {
                utilsService = diContainer.getSafe('JSCUtils');
                uiService = diContainer.getSafe('JSCUIManager');
                errorService = diContainer.getSafe('JSCErrorHandler');
            }
        }
        catch (e) {
            // DI 사용 불가시 레거시 모드로 작동
        }
    }
    // 초기화 시도
    initializeDIDependencies();
    // 앱 초기화 후에 DI 서비스 재시도
    if (typeof window !== 'undefined') {
        setTimeout(function () {
            if (!utilsService || !uiService || !errorService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils() {
        var fallback = {
            debugLog: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[TextProcessor]', msg);
            },
            logDebug: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[TextProcessor]', msg);
            },
            logInfo: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.info('[TextProcessor]', msg);
            },
            logWarn: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.warn('[TextProcessor]', msg);
            },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error('[TextProcessor]', msg);
            },
            isValidPath: function (path) { return !!path; },
            getShortPath: function (path) { return path; },
            safeJSONParse: function (str) {
                try {
                    return JSON.parse(str);
                }
                catch (e) {
                    return null;
                }
            },
            saveToStorage: function (key, value) { localStorage.setItem(key, value); return true; },
            loadFromStorage: function (key) { return localStorage.getItem(key); },
            removeFromStorage: function (key) { localStorage.removeItem(key); return true; },
            CONFIG: {
                DEBUG_MODE: false,
                SOUND_FOLDER_KEY: 'soundInserter_folder',
                APP_NAME: 'JSCEditHelper',
                VERSION: '1.0.0'
            },
            LOG_LEVELS: {},
            log: function () { },
            getDIStatus: function () { return ({ isDIAvailable: false, containerInfo: 'Fallback mode' }); }
        };
        return utilsService || window.JSCUtils || fallback;
    }
    function getUIManager() {
        return uiService || window.JSCUIManager || {
            updateStatus: function (msg, success) { return console.log("Status: ".concat(msg, " (").concat(success, ")")); },
            displayMessage: function (msg) { return console.log("Message: ".concat(msg)); }
        };
    }
    function getErrorHandler() {
        return errorService || window.JSCErrorHandler || {
            handleError: function (error) { return console.error('TextProcessor Error:', error); },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error("[TextProcessor Error] ".concat(msg));
            }
        };
    }
    /**
     * 텍스트 처리 메인 함수
     */
    function processText(text, options) {
        if (options === void 0) { options = {}; }
        var utils = getUtils();
        var ui = getUIManager();
        utils.logDebug("Processing text: \"".concat(text.substring(0, 50), "...\""));
        var processedText = text;
        var changes = [];
        var warnings = [];
        try {
            // 1. 공백 제거
            if (options.trimWhitespace !== false) {
                var trimmed = processedText.trim();
                if (trimmed !== processedText) {
                    processedText = trimmed;
                    changes.push('공백 제거');
                }
            }
            // 2. 특수문자 제거
            if (options.removeSpecialChars) {
                var cleaned = processedText.replace(/[^\w\s가-힣]/g, '');
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
                changes.push("\uAE38\uC774 \uC81C\uD55C \uC801\uC6A9 (".concat(options.maxLength, "\uC790)"));
                warnings.push("\uC6D0\uBCF8 \uD14D\uC2A4\uD2B8\uAC00 \uC798\uB838\uC2B5\uB2C8\uB2E4 (".concat(text.length, " \u2192 ").concat(options.maxLength, "\uC790)"));
            }
            // 결과 로깅
            utils.logInfo("\uD14D\uC2A4\uD2B8 \uCC98\uB9AC \uC644\uB8CC: ".concat(changes.length, "\uAC1C \uBCC0\uACBD\uC0AC\uD56D"));
            if (warnings.length > 0) {
                utils.logWarn("\uACBD\uACE0 ".concat(warnings.length, "\uAC1C: ").concat(warnings.join(', ')));
            }
            // UI 업데이트
            ui.updateStatus("\uD14D\uC2A4\uD2B8 \uCC98\uB9AC \uC644\uB8CC (".concat(changes.length, "\uAC1C \uBCC0\uACBD)"), true);
            return {
                success: true,
                originalText: text,
                processedText: processedText,
                changes: changes,
                warnings: warnings
            };
        }
        catch (e) {
            var errorHandler = getErrorHandler();
            var errorMsg = "\uD14D\uC2A4\uD2B8 \uCC98\uB9AC \uC911 \uC624\uB958: ".concat(e.message);
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
    function validateText(text) {
        var utils = getUtils();
        var errors = [];
        var suggestions = [];
        utils.logDebug("Validating text: \"".concat(text.substring(0, 30), "...\""));
        // 기본 검증
        if (!text || text.trim().length === 0) {
            errors.push('텍스트가 비어있습니다');
        }
        if (text.length > 10000) {
            errors.push('텍스트가 너무 깁니다 (10,000자 초과)');
            suggestions.push('텍스트를 더 짧게 나누어 처리하세요');
        }
        // 특수 문자 체크
        var specialChars = text.match(/[^\w\s가-힣]/g);
        if (specialChars && specialChars.length > text.length * 0.1) {
            suggestions.push('특수문자가 많습니다. removeSpecialChars 옵션 사용을 고려하세요');
        }
        // 공백 체크
        if (text.startsWith(' ') || text.endsWith(' ')) {
            suggestions.push('앞뒤 공백이 있습니다. trimWhitespace 옵션 사용을 고려하세요');
        }
        utils.logInfo("\uD14D\uC2A4\uD2B8 \uAC80\uC99D \uC644\uB8CC: ".concat(errors.length, "\uAC1C \uC624\uB958, ").concat(suggestions.length, "\uAC1C \uC81C\uC548"));
        return {
            isValid: errors.length === 0,
            errors: errors,
            suggestions: suggestions
        };
    }
    /**
     * 텍스트 포맷팅
     */
    function formatText(text, format) {
        var utils = getUtils();
        utils.logDebug("Formatting text with: ".concat(format));
        switch (format) {
            case TextFormat.UPPERCASE:
                return text.toUpperCase();
            case TextFormat.LOWERCASE:
                return text.toLowerCase();
            case TextFormat.TITLE_CASE:
                return text.replace(/\w\S*/g, function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            case TextFormat.SENTENCE_CASE:
                return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            default:
                utils.logWarn("\uC54C \uC218 \uC5C6\uB294 \uD3EC\uB9F7: ".concat(format));
                return text;
        }
    }
    /**
     * DI 상태 확인 함수 (디버깅용)
     */
    function getDIStatus() {
        var dependencies = [];
        if (utilsService)
            dependencies.push('JSCUtils (DI)');
        else if (window.JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
        if (uiService)
            dependencies.push('JSCUIManager (DI)');
        else if (window.JSCUIManager)
            dependencies.push('JSCUIManager (Legacy)');
        if (errorService)
            dependencies.push('JSCErrorHandler (DI)');
        else if (window.JSCErrorHandler)
            dependencies.push('JSCErrorHandler (Legacy)');
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
    window.TextProcessor = TextProcessor;
    window.TextFormat = TextFormat;
}
//# sourceMappingURL=text-processor.js.map