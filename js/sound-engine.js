"use strict";
/**
 * Sound Engine - Main Business Logic
 * 효과음 삽입의 핵심 비즈니스 로직을 담당하는 메인 엔진
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var SoundEngine = (function () {
    'use strict';
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    var diContainer = null;
    var utilsService = null;
    var communicationService = null;
    var uiService = null;
    var clipCalculatorService = null;
    function initializeDIDependencies() {
        try {
            diContainer = window.DI;
            if (diContainer) {
                // DI에서 서비스 가져오기 시도
                utilsService = diContainer.getSafe('JSCUtils');
                communicationService = diContainer.getSafe('JSCCommunication');
                uiService = diContainer.getSafe('JSCUIManager');
                clipCalculatorService = diContainer.getSafe('ClipTimeCalculator');
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
            if (!utilsService || !communicationService || !uiService || !clipCalculatorService) {
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
                return console.log('[SoundEngine]', msg);
            },
            logDebug: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.log('[SoundEngine]', msg);
            },
            logInfo: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.info('[SoundEngine]', msg);
            },
            logWarn: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.warn('[SoundEngine]', msg);
            },
            logError: function (msg) {
                var _args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    _args[_i - 1] = arguments[_i];
                }
                return console.error('[SoundEngine]', msg);
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
    function getCommunication() {
        return communicationService || window.JSCCommunication || {
            callExtendScript: function (_script, callback) {
                callback('error: Communication service not available');
            }
        };
    }
    function getUIManager() {
        return uiService || window.JSCUIManager || {
            updateStatus: function (msg, _success) { console.log('Status:', msg); }
        };
    }
    function getClipCalculator() {
        return clipCalculatorService || window.ClipTimeCalculator || {
            createInsertionPlan: function () { return ({ totalInsertions: 0 }); },
            createMagnetPlan: function () { return ({ totalMoved: 0, gapsRemoved: 0 }); },
            formatDuration: function (duration) { return duration + 'ms'; }
        };
    }
    var requestCounter = 0;
    /**
     * 효과음 삽입 전체 프로세스 실행
     */
    function executeSoundInsertion(config) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, debugInfo, validation, audioResult, audioFiles, clipsResult, clips, audioTrackNumber, clipCalculator, insertionPlan, command, executionResult, executionTime, result, error_1, executionTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = performance.now();
                        debugInfo = "\uD6A8\uACFC\uC74C \uC0BD\uC785 \uC2DC\uC791 - ".concat(new Date().toISOString(), "\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        debugInfo += "\uC124\uC815: ".concat(JSON.stringify(config), "\n");
                        validation = validateConfig(config);
                        if (!validation.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: validation.message,
                                    debug: debugInfo + "\uAC80\uC99D \uC2E4\uD328: ".concat(validation.message, "\n")
                                }];
                        }
                        // 2. 오디오 파일 검색 및 필터링
                        debugInfo += "오디오 파일 검색 중...\n";
                        return [4 /*yield*/, processAudioFiles(config)];
                    case 2:
                        audioResult = _a.sent();
                        if (!audioResult.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: audioResult.message,
                                    debug: debugInfo + "\uC624\uB514\uC624 \uD30C\uC77C \uCC98\uB9AC \uC2E4\uD328: ".concat(audioResult.message, "\n")
                                }];
                        }
                        audioFiles = audioResult.data;
                        debugInfo += "\uBC1C\uACAC\uB41C \uC624\uB514\uC624 \uD30C\uC77C: ".concat(audioFiles.length, "\uAC1C\n");
                        // 3. 클립 정보 수집
                        debugInfo += "클립 정보 수집 중...\n";
                        return [4 /*yield*/, getSelectedClips()];
                    case 3:
                        clipsResult = _a.sent();
                        if (!clipsResult.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: clipsResult.message,
                                    debug: debugInfo + "\uD074\uB9BD \uC815\uBCF4 \uC218\uC9D1 \uC2E4\uD328: ".concat(clipsResult.message, "\n")
                                }];
                        }
                        clips = clipsResult.data;
                        debugInfo += "\uC120\uD0DD\uB41C \uD074\uB9BD: ".concat(clips.length, "\uAC1C\n");
                        audioTrackNumber = parseAudioTrack(config.audioTrack);
                        clipCalculator = getClipCalculator();
                        insertionPlan = clipCalculator.createInsertionPlan(clips, audioFiles, audioTrackNumber);
                        if (insertionPlan.totalInsertions === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "삽입할 수 있는 위치가 없습니다. 클립을 2개 이상 선택해주세요.",
                                    debug: debugInfo + "삽입 계획 생성 실패: 삽입 위치 없음\n"
                                }];
                        }
                        debugInfo += "\uC0BD\uC785 \uACC4\uD68D: ".concat(insertionPlan.totalInsertions, "\uAC1C \uC704\uCE58, \uC608\uC0C1 \uC2DC\uAC04: ").concat(clipCalculator.formatDuration(insertionPlan.estimatedDuration), "\n");
                        command = createInsertionCommand(insertionPlan, config);
                        debugInfo += "ExtendScript \uBA85\uB839 \uC0DD\uC131 \uC644\uB8CC\n";
                        return [4 /*yield*/, executeExtendScriptCommand(command)];
                    case 4:
                        executionResult = _a.sent();
                        executionTime = performance.now() - startTime;
                        debugInfo += "\uC2E4\uD589 \uC644\uB8CC - \uCD1D \uC18C\uC694 \uC2DC\uAC04: ".concat(executionTime.toFixed(2), "ms\n");
                        // ExtendScript 디버그 로그 포함
                        if (executionResult.debugLog) {
                            debugInfo += "\n--- ExtendScript 통신 디버그 ---\n";
                            debugInfo += executionResult.debugLog;
                        }
                        // JSX 내부 디버그 정보 포함
                        if (executionResult.debug) {
                            debugInfo += "\n--- JSX 내부 실행 디버그 ---\n";
                            debugInfo += executionResult.debug;
                        }
                        result = {
                            success: executionResult.success,
                            message: executionResult.success
                                ? "".concat(insertionPlan.totalInsertions, "\uAC1C\uC758 \uD6A8\uACFC\uC74C\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0BD\uC785\uB418\uC5C8\uC2B5\uB2C8\uB2E4.")
                                : executionResult.message,
                            data: {
                                insertions: insertionPlan.totalInsertions,
                                audioTrack: audioTrackNumber,
                                files: audioFiles.length
                            },
                            debug: debugInfo,
                            executionTime: executionTime
                        };
                        // debugLog가 존재하는 경우에만 추가
                        if (executionResult.debugLog) {
                            result.debugLog = executionResult.debugLog;
                        }
                        return [2 /*return*/, result];
                    case 5:
                        error_1 = _a.sent();
                        executionTime = performance.now() - startTime;
                        debugInfo += "\uC608\uC678 \uBC1C\uC0DD: ".concat(error_1.message, "\n");
                        return [2 /*return*/, {
                                success: false,
                                message: "효과음 삽입 중 오류가 발생했습니다.",
                                debug: debugInfo,
                                executionTime: executionTime
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * 클립 자동 정렬(마그넷) 실행
     */
    function executeMagnetClips() {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, debugInfo, clipsResult, clips, clipCalculator, magnetPlan, command, executionResult, executionTime, error_2, executionTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = performance.now();
                        debugInfo = "\uD074\uB9BD \uC790\uB3D9 \uC815\uB82C \uC2DC\uC791 - ".concat(new Date().toISOString(), "\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, getAllClipsInSequence()];
                    case 2:
                        clipsResult = _a.sent();
                        if (!clipsResult.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: clipsResult.message,
                                    debug: debugInfo + "\uD074\uB9BD \uC815\uBCF4 \uC218\uC9D1 \uC2E4\uD328: ".concat(clipsResult.message, "\n")
                                }];
                        }
                        clips = clipsResult.data;
                        debugInfo += "\uC2DC\uD000\uC2A4 \uB0B4 \uD074\uB9BD: ".concat(clips.length, "\uAC1C\n");
                        clipCalculator = getClipCalculator();
                        magnetPlan = clipCalculator.createMagnetPlan(clips);
                        if (magnetPlan.totalMoved === 0) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "정렬할 간격이 없습니다. 모든 클립이 이미 올바르게 정렬되어 있습니다.",
                                    data: {
                                        clipsMoved: 0,
                                        gapsRemoved: 0
                                    },
                                    debug: debugInfo + "정렬 불필요: 간격 없음\n"
                                }];
                        }
                        debugInfo += "\uC815\uB82C \uACC4\uD68D: ".concat(magnetPlan.totalMoved, "\uAC1C \uD074\uB9BD \uC774\uB3D9, ").concat(magnetPlan.gapsRemoved, "\uAC1C \uAC04\uACA9 \uC81C\uAC70\n");
                        command = createMagnetCommand(magnetPlan);
                        return [4 /*yield*/, executeExtendScriptCommand(command)];
                    case 3:
                        executionResult = _a.sent();
                        executionTime = performance.now() - startTime;
                        debugInfo += "\uC2E4\uD589 \uC644\uB8CC - \uCD1D \uC18C\uC694 \uC2DC\uAC04: ".concat(executionTime.toFixed(2), "ms\n");
                        return [2 /*return*/, {
                                success: executionResult.success,
                                message: executionResult.success
                                    ? "".concat(magnetPlan.totalMoved, "\uAC1C \uD074\uB9BD\uC744 \uC774\uB3D9\uD558\uC5EC ").concat(magnetPlan.gapsRemoved, "\uAC1C\uC758 \uAC04\uACA9\uC744 \uC81C\uAC70\uD588\uC2B5\uB2C8\uB2E4.")
                                    : executionResult.message,
                                data: {
                                    clipsMoved: magnetPlan.totalMoved,
                                    gapsRemoved: magnetPlan.gapsRemoved
                                },
                                debug: debugInfo,
                                executionTime: executionTime
                            }];
                    case 4:
                        error_2 = _a.sent();
                        executionTime = performance.now() - startTime;
                        debugInfo += "\uC608\uC678 \uBC1C\uC0DD: ".concat(error_2.message, "\n");
                        return [2 /*return*/, {
                                success: false,
                                message: "클립 자동 정렬 중 오류가 발생했습니다.",
                                debug: debugInfo,
                                executionTime: executionTime
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * 설정 검증
     */
    function validateConfig(config) {
        var errors = [];
        // 폴더 경로 검증
        if (!config.folderPath || typeof config.folderPath !== 'string') {
            errors.push('폴더 경로가 필요합니다');
        }
        else {
            var utils = getUtils();
            if (!utils.isValidPath(config.folderPath)) {
                errors.push('유효하지 않은 폴더 경로입니다');
            }
        }
        // 오디오 트랙 검증
        if (config.audioTrack === undefined || config.audioTrack === null) {
            errors.push('오디오 트랙을 선택해주세요');
        }
        // 최대 삽입 개수 검증
        if (config.maxInsertions && (config.maxInsertions < 1 || config.maxInsertions > 1000)) {
            errors.push('최대 삽입 개수는 1-1000 사이여야 합니다');
        }
        return {
            success: errors.length === 0,
            message: errors.length > 0 ? errors.join(', ') : 'Valid configuration'
        };
    }
    /**
     * 오디오 파일 처리
     */
    function processAudioFiles(config) {
        return __awaiter(this, void 0, void 0, function () {
            var audioConfig, command, result, audioFiles, filterMsg, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        audioConfig = {
                            folderPath: config.folderPath,
                            filterByDefaultPrefix: (_a = config.filterByDefaultPrefix) !== null && _a !== void 0 ? _a : true,
                            excludePatterns: config.excludePatterns || []
                        };
                        command = {
                            action: 'getAudioFiles',
                            data: {
                                folderPath: audioConfig.folderPath,
                                filterByDefaultPrefix: audioConfig.filterByDefaultPrefix,
                                excludePatterns: audioConfig.excludePatterns
                            },
                            requestId: generateRequestId()
                        };
                        return [4 /*yield*/, executeExtendScriptCommand(command)];
                    case 1:
                        result = _b.sent();
                        if (!result.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: '오디오 파일을 불러올 수 없습니다: ' + result.message
                                }];
                        }
                        audioFiles = result.data;
                        if (!audioFiles || audioFiles.length === 0) {
                            filterMsg = audioConfig.filterByDefaultPrefix
                                ? "'Default'로 시작하는 "
                                : "";
                            return [2 /*return*/, {
                                    success: false,
                                    message: "\uC120\uD0DD\uB41C \uD3F4\uB354\uC5D0\uC11C ".concat(filterMsg, "\uC624\uB514\uC624 \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.")
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                message: "".concat(audioFiles.length, "\uAC1C\uC758 \uC624\uB514\uC624 \uD30C\uC77C\uC744 \uCC3E\uC558\uC2B5\uB2C8\uB2E4."),
                                data: audioFiles
                            }];
                    case 2:
                        error_3 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: '오디오 파일 처리 중 오류가 발생했습니다: ' + error_3.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * 선택된 클립 정보 수집
     */
    function getSelectedClips() {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = {
                            action: 'getSelectedClips',
                            data: {},
                            requestId: generateRequestId()
                        };
                        return [4 /*yield*/, executeExtendScriptCommand(command)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    /**
     * 시퀀스 내 모든 클립 정보 수집
     */
    function getAllClipsInSequence() {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = {
                            action: 'getAllClips',
                            data: {},
                            requestId: generateRequestId()
                        };
                        return [4 /*yield*/, executeExtendScriptCommand(command)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    /**
     * 오디오 트랙 번호 파싱
     */
    function parseAudioTrack(audioTrack) {
        if (typeof audioTrack === 'number') {
            return Math.max(1, Math.floor(audioTrack));
        }
        if (typeof audioTrack === 'string') {
            if (audioTrack.toLowerCase() === 'auto') {
                return 'auto'; // 자동 선택을 JSX에서 처리하도록 전달
            }
            var parsed = parseInt(audioTrack, 10);
            if (!isNaN(parsed)) {
                return Math.max(1, parsed);
            }
        }
        return 1; // 기본값
    }
    /**
     * 삽입 명령어 생성
     */
    function createInsertionCommand(plan, config) {
        return {
            action: 'executeInsertionPlan',
            data: {
                insertions: plan.insertions,
                audioTrack: plan.audioTrack,
                folderPath: config.folderPath
            },
            requestId: generateRequestId()
        };
    }
    /**
     * 마그넷 명령어 생성
     */
    function createMagnetCommand(plan) {
        return {
            action: 'executeMagnetPlan',
            data: {
                movements: plan.movements,
                estimatedTime: plan.estimatedTime
            },
            requestId: generateRequestId()
        };
    }
    /**
     * ExtendScript 명령 실행
     */
    function executeExtendScriptCommand(command) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var commandJson = JSON.stringify(command);
                        var jsxFunction = "executeSoundEngineCommand(".concat(JSON.stringify(commandJson), ")");
                        // 디버그 로그 수집
                        var debugLog = "";
                        var utils = getUtils();
                        utils.logDebug("ExtendScript call: ".concat(jsxFunction));
                        debugLog += "\uD83D\uDD27 ExtendScript \uD638\uCD9C: ".concat(jsxFunction, "\n");
                        var communication = getCommunication();
                        communication.callExtendScript(jsxFunction, function (result) {
                            try {
                                utils.logDebug("Response: ".concat(result));
                                debugLog += "\uD83D\uDD27 \uC751\uB2F5: ".concat(result, "\n");
                                if (result === "true" || result === "false") {
                                    utils.logDebug("Boolean string response");
                                    debugLog += "🔧 Boolean 응답 처리\n";
                                    resolve({
                                        success: result === "true",
                                        message: result === "true" ? "Success" : "Failed",
                                        debugLog: debugLog
                                    });
                                    return;
                                }
                                // JSON 응답 파싱 시도
                                var parsedResult = utils.safeJSONParse(result);
                                if (parsedResult) {
                                    utils.logDebug("JSON parsing successful");
                                    debugLog += "🔧 JSON 파싱 성공\n";
                                    resolve(__assign(__assign({}, parsedResult), { debugLog: debugLog }));
                                    return;
                                }
                                // 에러 메시지 처리
                                if (result && result.startsWith('error:')) {
                                    utils.logError("Error response: " + result);
                                    debugLog += "🔧 에러 응답\n";
                                    resolve({
                                        success: false,
                                        message: result.substring(6), // 'error:' 제거
                                        debugLog: debugLog
                                    });
                                    return;
                                }
                                // 기본 실패 응답
                                utils.logWarn("Unknown response format: " + result);
                                debugLog += "🔧 알 수 없는 응답\n";
                                resolve({
                                    success: false,
                                    message: result || "알 수 없는 오류가 발생했습니다.",
                                    debugLog: debugLog
                                });
                            }
                            catch (error) {
                                utils.logError("Exception: " + error.message);
                                debugLog += "\uD83D\uDD27 \uC608\uC678: ".concat(error.message, "\n");
                                resolve({
                                    success: false,
                                    message: "응답 처리 중 오류가 발생했습니다: " + error.message,
                                    debugLog: debugLog
                                });
                            }
                        });
                    })];
            });
        });
    }
    /**
     * 요청 ID 생성
     */
    function generateRequestId() {
        return "req_".concat(Date.now(), "_").concat(++requestCounter);
    }
    /**
     * 엔진 상태 확인
     */
    function getEngineStatus() {
        var dependencies = [];
        var isReady = true;
        // 필수 의존성 체크 (DI 우선, 레거시 fallback)
        var utils = getUtils();
        var communication = getCommunication();
        var uiManager = getUIManager();
        var clipCalculator = getClipCalculator();
        if (!utils || (!utilsService && !window.JSCUtils)) {
            dependencies.push('JSCUtils');
            isReady = false;
        }
        if (!communication || (!communicationService && !window.JSCCommunication)) {
            dependencies.push('JSCCommunication');
            isReady = false;
        }
        if (!uiManager || (!uiService && !window.JSCUIManager)) {
            dependencies.push('JSCUIManager');
            isReady = false;
        }
        if (!clipCalculator || (!clipCalculatorService && !window.ClipTimeCalculator)) {
            dependencies.push('ClipTimeCalculator');
            isReady = false;
        }
        return { isReady: isReady, dependencies: dependencies };
    }
    // DI 상태 확인 함수 (디버깅용) - Phase 2.6
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
        if (uiService)
            dependencies.push('JSCUIManager (DI)');
        else if (window.JSCUIManager)
            dependencies.push('JSCUIManager (Legacy)');
        if (clipCalculatorService)
            dependencies.push('ClipTimeCalculator (DI)');
        else if (window.ClipTimeCalculator)
            dependencies.push('ClipTimeCalculator (Legacy)');
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
            dependencies: dependencies
        };
    }
    // 공개 API 반환
    return {
        executeSoundInsertion: executeSoundInsertion,
        executeMagnetClips: executeMagnetClips,
        getEngineStatus: getEngineStatus,
        getDIStatus: getDIStatus // Phase 2.6
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.SoundEngine = SoundEngine;
}
//# sourceMappingURL=sound-engine.js.map