/**
 * JSCEditHelper - Event Manager
 * 사용자 이벤트 처리를 담당하는 모듈
 */

interface JSCEventManagerInterface {
    setupEventListeners(): void;
    handleSoundFileButtonClick(event: Event): void;
    refreshSoundButtons(): void; // 자동 새로고침을 위해 공개
    getDIStatus(): any; // DI 패턴 적용
    closeTextReplaceModal(): void; // 텍스트 교체 모달 닫기
    executeTextReplace(): void; // 텍스트 교체 실행
}

const JSCEventManager = (function(): JSCEventManagerInterface {
    'use strict';

    // DIHelpers 사용 - 반복 코드 제거!
    // di-helpers.ts에서 제공하는 공통 헬퍼 사용
    const DIHelpers = (window as any).DIHelpers;

    // 이미지 파일명 고유성을 위한 카운터
    let imageCounter = 0;

    // 이미지 매칭 데이터 구조
    interface ImageMapping {
        id: string;              // 고유 ID
        filePath: string;        // 파일 경로
        fileName: string;        // 파일명
        thumbnail: string;       // Base64 썸네일
        captionCount: number;    // 이 이미지가 차지할 캡션 개수
        textLabel?: string | undefined;      // 매칭된 텍스트 (1:1 매칭용)
        isPlaceholder?: boolean; // 비디오 목업 여부
    }

    // 이미지 매핑 배열 (고급 모드용)
    let imageMappings: ImageMapping[] = [];

    // 텍스트 리스트 (1:1 매칭용)
    let textList: string[] = [];

    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    // DIHelpers가 로드되어 있으면 사용, 아니면 직접 fallback 사용
    function getUtils(): JSCUtilsInterface {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('EventManager');
        }
        // Fallback (DIHelpers 로드 안됨)
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[EventManager]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[EventManager]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[EventManager]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[EventManager]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[EventManager]', msg),
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

    function getUIManager() {
        if (DIHelpers && DIHelpers.getUIManager) {
            return DIHelpers.getUIManager('EventManager');
        }
        // Fallback
        const utils = getUtils();
        return (window as any).JSCUIManager || {
            updateStatus: (msg: string, _success?: boolean) => { console.log('Status:', msg); },
            displaySoundList: (_files: any[]) => { console.log('Display sound list'); },
            resetDebugUI: () => { console.log('Reset debug UI'); },
            updateSoundButtons: (_files: any[], _path?: string) => { console.log('Update sound buttons'); },
            showDebugInfo: () => { console.log('Show debug info'); },
            toggleDebugButton: (_show: boolean) => { console.log('Toggle debug button'); },
            updateMagnetStatus: (_success: boolean, _moved?: number, _removed?: number) => {
                utils.logDebug('Update magnet status');
            }
        };
    }

    function getStateManager() {
        if (DIHelpers && DIHelpers.getStateManager) {
            return DIHelpers.getStateManager();
        }
        // Fallback
        return (window as any).JSCStateManager || {
            saveFolderPath: (_path: string) => { console.log('Save folder path'); },
            getCurrentFolderPath: () => { return ''; },
            clearFolderPath: () => { console.log('Clear folder path'); },
            validateState: () => { return { isValid: true, errors: [] }; },
            getSettings: () => { return { folderPath: '', audioTrack: 1 }; }
        };
    }

    function getCommunication() {
        if (DIHelpers && DIHelpers.getCommunication) {
            return DIHelpers.getCommunication();
        }
        // Fallback
        return (window as any).JSCCommunication || {
            callExtendScript: (_script: string, callback: (result: string) => void) => {
                callback('error: Communication service not available');
            },
            callExtendScriptAsync: (_script: string) => {
                return Promise.reject(new Error('Communication service not available'));
            }
        };
    }

    function getSoundEngine() {
        // No DI helper for SoundEngine yet, use direct window access
        return (window as any).SoundEngine || {
            executeSoundInsertion: (_config: any) => {
                return Promise.resolve({ success: false, message: 'SoundEngine not available' });
            },
            executeMagnetClips: (_trackOption?: string) => {
                return Promise.resolve({ success: false, message: 'SoundEngine not available' });
            },
            getEngineStatus: () => { return { isReady: false, dependencies: [] }; }
        };
    }
    
    
    // 이벤트 리스너 설정
    function setupEventListeners(): void {
        const utils = getUtils();
        try {
            utils.logDebug('Setting up event listeners...');
            setupInsertSoundsButton();
            setupBrowseFolderButton();
            setupRefreshButton();
            setupMagnetButton();
            setupFolderInput();
            setupDebugUI();
            setupCaptionEventListeners(); // 캡션-이미지 동기화 이벤트
            setupTextListInput(); // 텍스트 리스트 입력
            utils.logDebug('Event listeners setup completed');
        } catch (e) {
            utils.logError('Event listeners setup failed:', (e as Error).message);
        }
    }
    
    // 효과음 삽입 버튼 이벤트
    function setupInsertSoundsButton(): void {
        const utils = getUtils();
        const insertButton = document.getElementById("insert-sounds");
        if (insertButton) {
            insertButton.addEventListener("click", insertSounds);
            utils.logDebug("Event listener added to insert-sounds button");
        } else {
            utils.logWarn("Button with ID 'insert-sounds' not found.");
        }
    }
    
    // 폴더 찾기 버튼 이벤트
    function setupBrowseFolderButton(): void {
        const utils = getUtils();
        const browseButton = document.getElementById("browseFolder");
        if (browseButton) {
            browseButton.addEventListener("click", browseSoundFolder);
            utils.debugLog("Event listener added to browseFolder button");
        } else {
            utils.logError("Button with ID 'browseFolder' not found.");
        }
    }
    
    // 새로고침 버튼 이벤트
    function setupRefreshButton(): void {
        const utils = getUtils();
        const refreshButton = document.getElementById("refreshSounds");
        if (refreshButton) {
            refreshButton.addEventListener("click", refreshSoundButtons);
            utils.debugLog("Event listener added to refreshSounds button");
        } else {
            utils.logError("Button with ID 'refreshSounds' not found.");
        }
    }
    
    // 마그넷 버튼 이벤트
    function setupMagnetButton(): void {
        const utils = getUtils();
        const magnetButton = document.getElementById("magnetClips");
        if (magnetButton) {
            magnetButton.addEventListener("click", magnetClips);
            utils.debugLog("Event listener added to magnetClips button");
        } else {
            utils.logError("Button with ID 'magnetClips' not found.");
        }
    }
    
    // 폴더 입력 필드 이벤트
    function setupFolderInput(): void {
        const utils = getUtils();
        const folderInput = document.getElementById("sound-folder") as HTMLInputElement;
        if (folderInput) {
            folderInput.addEventListener("change", function(this: HTMLInputElement) {
                const inputPath = this.value.trim();
                const utils = getUtils();
                const stateManager = getStateManager();
                const uiManager = getUIManager();

                utils.debugLog("Folder input changed: " + inputPath);

                if (inputPath) {
                    // 길이 검증 (Windows MAX_PATH)
                    const MAX_PATH_LENGTH = 260;
                    if (inputPath.length > MAX_PATH_LENGTH) {
                        utils.logWarn(`Path too long: ${inputPath.length} characters`);
                        uiManager.updateStatus(`경로가 너무 깁니다 (최대 ${MAX_PATH_LENGTH}자)`, false);
                        this.value = stateManager.getCurrentFolderPath();
                        return;
                    }

                    // 특수 문자 검증 (Windows 파일 시스템 금지 문자)
                    const invalidChars = /[<>:"|?*\x00-\x1f]/g;
                    if (invalidChars.test(inputPath)) {
                        utils.logWarn("Path contains invalid characters: " + inputPath);
                        uiManager.updateStatus("경로에 사용할 수 없는 문자가 포함되어 있습니다", false);
                        this.value = stateManager.getCurrentFolderPath();
                        return;
                    }

                    // 경로 유효성 검증
                    if (utils.isValidPath(inputPath)) {
                        stateManager.saveFolderPath(inputPath);
                        utils.logDebug("Valid path stored: " + inputPath);
                    } else {
                        utils.logWarn("Invalid path entered: " + inputPath);
                        uiManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        this.value = stateManager.getCurrentFolderPath();
                    }
                } else {
                    stateManager.clearFolderPath();
                    utils.logDebug("Path cleared");
                }
            });
            utils.debugLog("Event listener added to sound-folder input");
        } else {
            utils.logError("Input with ID 'sound-folder' not found.");
        }
    }
    
    // 디버그 UI 이벤트
    function setupDebugUI(): void {
        setupDebugButton();
        setupCloseDebugButton();
        setupTestSoundEngineButton();
    }
    
    function setupDebugButton(): void {
        const debugButton = document.getElementById("debug-button");
        if (debugButton) {
            debugButton.addEventListener("click", function() {
                const uiManager = getUIManager();
                uiManager.showDebugInfo();
            });
        }
    }
    
    function setupCloseDebugButton(): void {
        const closeDebugButton = document.getElementById("close-debug-button");
        if (closeDebugButton) {
            closeDebugButton.addEventListener("click", function(this: HTMLElement) {
                const debugInfo = document.getElementById("debug-info");
                if (debugInfo) debugInfo.style.display = "none";
                this.style.display = "none";
            });
        }
    }
    
    function setupTestSoundEngineButton(): void {
        const testButton = document.getElementById("test-sound-engine");
        if (testButton) {
            testButton.addEventListener("click", testSoundEngine);
        }
    }
    
    // SoundEngine 테스트 함수
    async function testSoundEngine(): Promise<void> {
        let debugInfo = "=== SoundEngine 테스트 ===\n";
        debugInfo += `시간: ${new Date().toISOString()}\n`;
        
        try {
            // 1. SoundEngine 존재 확인
            const soundEngine = getSoundEngine();
            if (!soundEngine || !(window as any).SoundEngine) {
                debugInfo += "❌ SoundEngine이 로드되지 않았습니다\n";
                const uiManager = getUIManager();
                uiManager.updateStatus("SoundEngine이 로드되지 않았습니다", false);
                (window as any).lastDebugInfo = debugInfo;
                uiManager.toggleDebugButton(true);
                return;
            }
            debugInfo += "✅ SoundEngine 로드됨\n";
            
            // 2. SoundEngine 상태 확인
            const engineStatus = soundEngine.getEngineStatus();
            debugInfo += `엔진 상태: ${engineStatus.isReady ? "준비완료" : "준비안됨"}\n`;
            if (!engineStatus.isReady) {
                debugInfo += `누락 의존성: ${engineStatus.dependencies.join(', ')}\n`;
            }
            
            // 3. 기본 모듈들 확인
            const stateManager = getStateManager();
            debugInfo += `JSCStateManager: ${stateManager && stateManager !== getStateManager() ? "✅" : "❌"}\n`;
            debugInfo += `ClipTimeCalculator: ${(window as any).ClipTimeCalculator ? "✅" : "❌"}\n`;
            const communication = getCommunication();
            debugInfo += `JSCCommunication: ${communication && communication !== getCommunication() ? "✅" : "❌"}\n`;
            
            // 4. 상태 검증
            if (stateManager) {
                const validation = stateManager.validateState();
                debugInfo += `상태 유효성: ${validation.isValid ? "✅" : "❌"}\n`;
                if (!validation.isValid) {
                    debugInfo += `오류: ${validation.errors.join(', ')}\n`;
                }
                
                const settings = stateManager.getSettings();
                debugInfo += `폴더 경로: ${settings.folderPath || "설정되지 않음"}\n`;
                debugInfo += `오디오 트랙: ${settings.audioTrack}\n`;
            }
            
            const uiManager = getUIManager();
            uiManager.updateStatus("SoundEngine 테스트 완료", true);
            
        } catch (error) {
            debugInfo += `❌ 테스트 중 오류: ${(error as Error).message}\n`;
            const uiManager = getUIManager();
            uiManager.updateStatus("SoundEngine 테스트 실패", false);
        }
        
        window.lastDebugInfo = debugInfo;
        const uiManager = getUIManager();
        uiManager.toggleDebugButton(true);
    }
    
    // 효과음 삽입 처리 (새로운 SoundEngine 사용)
    async function insertSounds(): Promise<void> {
        const utils = getUtils();
        let debugInfo = "=== 효과음 삽입 디버그 ===\n";
        debugInfo += `시작 시간: ${new Date().toISOString()}\n`;

        try {
            debugInfo += "1. JSCStateManager 확인...\n";
            const stateManager = getStateManager();
            if (!stateManager) {
                debugInfo += "❌ JSCStateManager 없음\n";
                utils.logError('JSCStateManager not available');
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ JSCStateManager 정상\n";
            
            debugInfo += "2. SoundEngine 확인...\n";
            // Check if SoundEngine is available
            const soundEngine = getSoundEngine();
            if (!soundEngine) {
                debugInfo += "❌ SoundEngine 모듈 없음\n";
                const uiManager = getUIManager();
                uiManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                utils.logError('SoundEngine not available');
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ SoundEngine 정상\n";
            
            debugInfo += "3. SoundEngine 상태 확인...\n";
            // 엔진 상태 확인
            const engineStatus = soundEngine.getEngineStatus();
            debugInfo += `엔진 준비 상태: ${engineStatus.isReady}\n`;
            if (!engineStatus.isReady) {
                debugInfo += `❌ 누락 의존성: ${engineStatus.dependencies.join(', ')}\n`;
                const uiManager = getUIManager();
                uiManager.updateStatus(
                    `필요한 모듈이 로드되지 않았습니다: ${engineStatus.dependencies.join(', ')}`, 
                    false
                );
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ 엔진 상태 정상\n";
            
            debugInfo += "4. 상태 검증...\n";
            // 상태 검증
            const validation = stateManager.validateState();
            debugInfo += `상태 유효성: ${validation.isValid}\n`;
            if (!validation.isValid) {
                debugInfo += `❌ 검증 오류: ${validation.errors.join(', ')}\n`;
                const uiManager = getUIManager();
                uiManager.updateStatus(validation.errors[0], false);
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ 상태 검증 통과\n";
            
            const settings = stateManager.getSettings();
            debugInfo += `설정 - 폴더: ${settings.folderPath}\n`;
            debugInfo += `설정 - 오디오 트랙: ${settings.audioTrack}\n`;
            
            debugInfo += "5. UI 상태 업데이트...\n";
            // UI 상태 업데이트
            const uiManager = getUIManager();
            uiManager.updateStatus("효과음 삽입 중...", true);
            uiManager.displaySoundList([]);
            // window.JSCUIManager.resetDebugUI(); // 디버그 정보 유지를 위해 제거
            
            debugInfo += "6. SoundEngine 설정 생성...\n";
            // SoundEngine 설정 생성
            const engineConfig = {
                folderPath: settings.folderPath.trim(),
                audioTrack: settings.audioTrack,
                filterByDefaultPrefix: true, // Default 필터링 활성화
                maxInsertions: 100 // 최대 삽입 개수 제한
            };
            debugInfo += `엔진 설정: ${JSON.stringify(engineConfig)}\n`;
            
            debugInfo += "7. SoundEngine.executeSoundInsertion() 호출...\n";
            // SoundEngine으로 효과음 삽입 실행
            const result = await soundEngine.executeSoundInsertion(engineConfig);
            
            debugInfo += "8. 결과 처리...\n";
            debugInfo += `결과 성공: ${result.success}\n`;
            debugInfo += `결과 메시지: ${result.message}\n`;
            if (result.data) {
                debugInfo += `결과 데이터: ${JSON.stringify(result.data)}\n`;
            }
            
            // 결과 처리
            if (result.success) {
                uiManager.updateStatus(result.message, true);
                
                // 삽입된 효과음 목록 표시 (있다면)
                if (result.data && result.data.files) {
                    const fileNames = Array.isArray(result.data.files) 
                        ? result.data.files.map((f: any) => typeof f === 'string' ? f : f.name)
                        : [];
                    uiManager.displaySoundList(fileNames);
                    debugInfo += `표시된 파일 목록: ${fileNames.length}개\n`;
                }
            } else {
                uiManager.updateStatus(result.message, false);
            }
            
            // SoundEngine의 디버그 정보도 추가
            if (result.debug) {
                debugInfo += "\n--- SoundEngine 내부 디버그 ---\n";
                debugInfo += result.debug;
            }
            
            // ExtendScript 통신 디버그 로그 추가
            if ((result as any).debugLog) {
                debugInfo += "\n--- ExtendScript 통신 로그 ---\n";
                debugInfo += (result as any).debugLog;
            }
            
            // 실행 시간 로깅
            if (result.executionTime) {
                debugInfo += `실행 시간: ${result.executionTime.toFixed(2)}ms\n`;
                const utils = getUtils();
                utils.logInfo(`효과음 삽입 완료 - 소요 시간: ${result.executionTime.toFixed(2)}ms`);
            }
            
            debugInfo += "✅ insertSounds() 함수 완료\n";
            
        } catch (e) {
            debugInfo += `❌ 예외 발생: ${(e as Error).message}\n`;
            debugInfo += `스택 추적:\n${(e as Error).stack}\n`;
            utils.logError("Sound insertion failed:", (e as Error).message);
            const uiManager = getUIManager();
            uiManager.updateStatus("효과음 삽입 중 오류가 발생했습니다.", false);
        }
        
        // 디버그 정보 항상 표시
        (window as any).lastDebugInfo = debugInfo;
        // window.JSCUIManager.toggleDebugButton(true); // 항상 표시되므로 필요없음
    }
    
    // 폴더 찾기 처리 (async/await로 리팩토링)
    async function browseSoundFolder(): Promise<void> {
        const utils = getUtils();
        const stateManager = getStateManager();
        const uiManager = getUIManager();
        const communication = getCommunication();

        if (!communication || !communication.callExtendScriptAsync) {
            utils.logError("Communication service not available");
            return;
        }

        try {
            const result = await communication.callExtendScriptAsync("browseSoundFolder()");
            utils.logDebug("Browse folder result: " + result);

            if (result && result !== "undefined" && result !== "" && utils.isValidPath(result)) {
                stateManager.saveFolderPath(result);
                utils.logDebug("Valid path set: " + result);

                // 폴더 선택 성공 후 자동으로 효과음 라이브러리 새로고침
                uiManager.updateStatus("폴더가 설정되었습니다. 효과음 목록을 불러오는 중...", true);

                // 잠시 후 새로고침 실행 (UI 업데이트 완료 후)
                setTimeout(() => {
                    refreshSoundButtons();
                }, 100);
            } else {
                if (result && result !== "undefined" && result !== "") {
                    utils.logWarn("Invalid path received from ExtendScript: " + result);
                    uiManager.updateStatus("올바른 폴더를 선택해주세요.", false);
                } else {
                    utils.logDebug("No folder selected or empty result");
                }
            }
        } catch (error) {
            utils.logError("Failed to browse folder:", (error as Error).message);
            uiManager.updateStatus("폴더 선택 중 오류가 발생했습니다.", false);
        }
    }
    
    // 새로고침 처리 (async/await로 리팩토링)
    async function refreshSoundButtons(): Promise<void> {
        const stateManager = getStateManager();
        const utils = getUtils();
        const uiManager = getUIManager();
        const communication = getCommunication();

        const currentPath = stateManager.getCurrentFolderPath();
        utils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);

        // 경로 유효성 검증
        if (!currentPath || !utils.isValidPath(currentPath)) {
            if (currentPath) {
                utils.logWarn("currentFolderPath is invalid, clearing it: " + currentPath);
                stateManager.clearFolderPath();
                uiManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
            } else {
                utils.logWarn("currentFolderPath is empty or invalid. Aborting refresh.");
                uiManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
            }
            return;
        }

        if (!communication || !communication.callExtendScriptAsync) {
            utils.logError("Communication service not available");
            return;
        }

        // 디버그 정보 생성
        let debugInfo = "=== Refresh Sound Buttons Debug ===\n";
        debugInfo += "시간: " + new Date().toISOString() + "\n";
        debugInfo += "폴더 경로: " + currentPath + "\n";

        try {
            uiManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
            uiManager.updateStatus(
                "'" + utils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...",
                true
            );

            const pathArg = JSON.stringify(currentPath);
            utils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg);

            // 첫 번째 호출
            const result = await communication.callExtendScriptAsync("getFilesForPathCS(" + pathArg + ")");
            debugInfo += "JSX 결과: " + result + "\n";
            debugInfo += "결과 타입: " + typeof result + "\n";

            if (result === "success") {
                debugInfo += "성공적으로 완료됨\n";
                debugInfo += "파일 목록 가져오기 시도...\n";

                // 두 번째 호출 - 파일 목록 가져오기
                const callbackResult = await communication.callExtendScriptAsync(
                    "getFilesForPathWithCallback(" + pathArg + ")"
                );
                debugInfo += "콜백 결과: " + callbackResult + "\n";

                const parsedResult = utils.safeJSONParse(callbackResult);
                if (parsedResult && parsedResult.success && parsedResult.soundFiles) {
                    debugInfo += "파일 " + parsedResult.soundFiles.length + "개 발견\n";
                    uiManager.updateSoundButtons(parsedResult.soundFiles, parsedResult.folderPath);
                    uiManager.updateStatus(
                        "폴더 새로고침이 완료되었습니다. " + parsedResult.soundFiles.length + "개 파일 발견.",
                        true
                    );
                } else {
                    debugInfo += "파일 목록 처리 실패\n";
                    uiManager.updateStatus("파일 목록을 가져올 수 없습니다.", false);
                }
            } else {
                debugInfo += "예상치 못한 결과: " + result + "\n";
                uiManager.updateStatus("폴더 새로고침 결과를 처리하는 중입니다...", true);
            }
        } catch (error) {
            debugInfo += "오류 발생: " + (error as Error).message + "\n";
            utils.logError("Failed to refresh sound buttons:", (error as Error).message);
            uiManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다: " + (error as Error).message, false);
        } finally {
            // 디버그 정보 저장
            (window as any).lastDebugInfo = debugInfo;
            uiManager.toggleDebugButton(true);
        }
    }
    
    // 클립 자동 정렬 처리 (새로운 SoundEngine 사용)
    async function magnetClips(): Promise<void> {
        try {
            const utils = getUtils();
            const uiManager = getUIManager();
            const soundEngine = getSoundEngine();

            utils.debugLog("magnetClips() called");

            // Check if SoundEngine is available
            if (!soundEngine) {
                uiManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                utils.logError('SoundEngine not available');
                return;
            }

            // 엔진 상태 확인
            const engineStatus = soundEngine.getEngineStatus();
            if (!engineStatus.isReady) {
                uiManager.updateStatus(
                    `필요한 모듈이 로드되지 않았습니다: ${engineStatus.dependencies.join(', ')}`,
                    false
                );
                return;
            }

            // 트랙 선택 옵션 읽기
            const trackSelect = document.getElementById("magnet-video-track") as HTMLSelectElement;
            const trackOption = trackSelect ? trackSelect.value : "auto";

            // UI 상태 업데이트
            uiManager.updateStatus("클립 자동 정렬 중...", true);
            uiManager.resetDebugUI();

            const magnetStatus = document.getElementById("magnetStatus");
            if (magnetStatus) {
                magnetStatus.textContent = "처리 중...";
                magnetStatus.style.color = "#007acc";
            }

            // SoundEngine으로 마그넷 기능 실행
            const result = await soundEngine.executeMagnetClips(trackOption);
            
            // 결과 처리
            if (result.success) {
                uiManager.updateStatus(result.message, true);
                
                // 마그넷 상태 업데이트
                if (result.data) {
                    uiManager.updateMagnetStatus(
                        true,
                        result.data.clipsMoved || 0,
                        result.data.gapsRemoved || 0
                    );
                }
            } else {
                uiManager.updateStatus(result.message, false);
                uiManager.updateMagnetStatus(false);
            }
            
            // 디버그 정보 표시
            if (result.debug && utils.CONFIG.DEBUG_MODE) {
                (window as any).lastDebugInfo = result.debug;
                uiManager.toggleDebugButton(true);
            }
            
            // 실행 시간 로깅
            if (result.executionTime) {
                utils.logInfo(`클립 자동 정렬 완료 - 소요 시간: ${result.executionTime.toFixed(2)}ms`);
            }
            
        } catch (e) {
            const utils = getUtils();
            const uiManager = getUIManager();
            utils.logError("Magnet clips failed:", (e as Error).message);
            uiManager.updateStatus("클립 자동 정렬 중 오류가 발생했습니다.", false);
            uiManager.updateMagnetStatus(false);
            
            // 에러 정보를 디버그로 표시
            if (utils.CONFIG.DEBUG_MODE) {
                (window as any).lastDebugInfo = `Error: ${(e as Error).message}\nStack: ${(e as Error).stack}`;
                uiManager.toggleDebugButton(true);
            }
        }
    }
    
    // 포커스 제거 헬퍼 함수
    function removeFocusFromPanel(): string {
        let focusDebug = "\n--- 포커스 디버그 정보 ---\n";

        try {
            const currentElement = document.activeElement;
            focusDebug += "시작 - 현재 활성 요소: " + (currentElement ? currentElement.tagName : "없음") + "\n";

            // CEP 패널에서 포커스 제거
            if (document.activeElement && (document.activeElement as HTMLElement).blur) {
                (document.activeElement as HTMLElement).blur();
                focusDebug += "현재 요소 blur 완료\n";
            }

            // 모든 포커스 가능한 요소들을 blur
            const focusableElements = document.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach(el => {
                try { (el as HTMLElement).blur(); } catch(e) { /* ignore */ }
            });

            // 강제로 포커스 제거를 위한 임시 요소
            const tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.style.top = '-9999px';
            tempInput.style.opacity = '0';
            document.body.appendChild(tempInput);
            tempInput.focus();
            tempInput.blur();
            document.body.removeChild(tempInput);

            focusDebug += "완전한 포커스 제거 시도 완료\n";
        } catch (e) {
            focusDebug += "포커스 제거 중 오류: " + (e as Error).message + "\n";
        }

        return focusDebug;
    }

    // 개별 효과음 버튼 클릭 처리 (async/await로 완전히 리팩토링)
    async function handleSoundFileButtonClick(event: Event): Promise<void> {
        const utils = getUtils();
        const uiManager = getUIManager();
        const communication = getCommunication();

        const target = event.target as HTMLElement;
        const soundFsName = target.getAttribute("data-fsname");
        const soundDisplayName = target.textContent;

        // Early validation
        if (!soundFsName) {
            utils.logError("Sound file path (fsName) not found on button.");
            uiManager.updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
            return;
        }

        if (!communication || !communication.callExtendScriptAsync) {
            utils.logError("Communication service or async method not available");
            uiManager.updateStatus("통신 서비스를 사용할 수 없습니다.", false);
            return;
        }

        utils.logDebug("Replacing with sound file: " + soundFsName);
        uiManager.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);

        let debugInfo = "=== Sound File Button Click Debug ===\n";
        debugInfo += "시간: " + new Date().toISOString() + "\n";
        debugInfo += "파일 경로: " + soundFsName + "\n";
        debugInfo += "파일명: " + soundDisplayName + "\n";

        try {
            // Step 1: 가장 간단한 ExtendScript 테스트
            utils.logDebug("Testing simplest ExtendScript function first...");
            debugInfo += "\n--- 단순 테스트 결과 ---\n";

            const simpleResult = await communication.callExtendScriptAsync("simpleTest()");
            utils.logDebug("Simple test result: " + simpleResult);
            debugInfo += "simpleTest(): " + simpleResult + "\n";

            if (simpleResult !== "HELLO_FROM_EXTENDSCRIPT") {
                debugInfo += "✗ ExtendScript 기본 실행 실패: " + simpleResult + "\n";
                uiManager.updateStatus("ExtendScript 실행 환경에 문제가 있습니다", false);
                (window as any).lastDebugInfo = debugInfo;
                uiManager.toggleDebugButton(true);
                return;
            }

            debugInfo += "✓ ExtendScript 기본 실행 성공\n";

            // Step 2: 중복 임포트 테스트
            debugInfo += "\n--- 중복 임포트 테스트 결과 ---\n";
            const duplicateResult = await communication.callExtendScriptAsync(
                "testDuplicateImport(" + JSON.stringify(soundFsName) + ")"
            );
            debugInfo += duplicateResult + "\n";

            // Step 3: 기본 정보 테스트
            debugInfo += "\n--- 기본 정보 테스트 결과 ---\n";
            const basicResult = await communication.callExtendScriptAsync("basicInfo()");
            debugInfo += "basicInfo(): " + basicResult + "\n";

            if (!basicResult || basicResult.indexOf("ERROR:") === 0) {
                debugInfo += "✗ 기본 정보 수집 실패: " + basicResult + "\n";
                uiManager.updateStatus("ExtendScript 기본 정보 수집 실패", false);
                (window as any).lastDebugInfo = debugInfo;
                uiManager.toggleDebugButton(true);
                return;
            }

            debugInfo += "✓ 기본 정보 수집 성공\n";

            // Step 4: 실제 클립 교체
            debugInfo += "\n환경 테스트 통과, 클립 교체 시도...\n";
            const result = await communication.callExtendScriptAsync(
                "replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")"
            );

            utils.logDebug("replaceSelectedAudioClips call result: " + result);
            debugInfo += "\n--- 클립 교체 결과 ---\n";
            debugInfo += "원본 결과: " + result + "\n";

            // JSON 파싱 및 결과 처리
            const parsedResult = utils.safeJSONParse(result);

            if (parsedResult) {
                debugInfo += "JSON 파싱: SUCCESS\n";
                debugInfo += "파싱된 결과:\n";
                debugInfo += "  - success: " + parsedResult.success + "\n";
                debugInfo += "  - message: " + parsedResult.message + "\n";

                if (parsedResult.data) {
                    debugInfo += "  - replacedCount: " + parsedResult.data.replacedCount + "\n";
                    debugInfo += "  - totalSelected: " + parsedResult.data.totalSelected + "\n";
                }

                // 상태 메시지 업데이트
                if (parsedResult.success) {
                    uiManager.updateStatus("클립 교체 완료: " + parsedResult.message, true);
                } else {
                    uiManager.updateStatus("클립 교체 실패: " + parsedResult.message, false);
                }

                // ExtendScript 디버그 정보 추가
                if (parsedResult.debug) {
                    debugInfo += "\n--- ExtendScript 디버그 정보 ---\n";
                    debugInfo += parsedResult.debug;
                }
            } else {
                debugInfo += "JSON 파싱 실패, 문자열로 처리\n";

                // 기존 문자열 처리 방식 사용
                if (typeof result === "string") {
                    if (result.indexOf("success:") === 0) {
                        const message = result.substring(8);
                        uiManager.updateStatus("클립 교체 완료: " + message, true);
                    } else if (result.indexOf("error:") === 0) {
                        const errorMessage = result.substring(6);
                        uiManager.updateStatus("클립 교체 실패: " + errorMessage, false);
                    } else {
                        uiManager.updateStatus("클립 교체 결과: " + result, true);
                    }
                }
            }

            // 디버그 정보 저장
            (window as any).lastDebugInfo = debugInfo;
            uiManager.toggleDebugButton(true);

            // 포커스 처리를 비동기로 처리
            await handleFocusRemovalAfterInsertion(debugInfo);

        } catch (error) {
            debugInfo += "\n\n오류 발생: " + (error as Error).message + "\n";
            debugInfo += "Stack trace: " + (error as Error).stack + "\n";

            utils.logError("Sound file button click failed:", (error as Error).message);
            uiManager.updateStatus("클립 교체 중 오류가 발생했습니다: " + (error as Error).message, false);

            (window as any).lastDebugInfo = debugInfo;
            uiManager.toggleDebugButton(true);
        }
    }

    // 포커스 제거 및 타임라인 활성화 처리 (헬퍼 함수)
    async function handleFocusRemovalAfterInsertion(debugInfo: string): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(async () => {
                const utils = getUtils();
                const uiManager = getUIManager();
                const communication = getCommunication();

                try {
                    // 포커스 제거 헬퍼 사용
                    const focusDebug = removeFocusFromPanel();

                    const finalElement = document.activeElement;
                    let fullFocusDebug = focusDebug;
                    fullFocusDebug += "blur 후 - 최종 활성 요소: " +
                        (finalElement ? (finalElement.tagName +
                        (finalElement.id ? "#" + finalElement.id : "") +
                        (finalElement.textContent ? " (" + finalElement.textContent.substring(0, 20) + ")" : "")) : "없음") + "\n";

                    // UI에 포커스 정보 표시
                    uiManager.updateStatus("효과음 삽입 완료 - 포커스 상태 확인", true);

                    // Adobe 앱으로 포커스 이동 (타임라인 활성화)
                    if (communication && communication.callExtendScriptAsync) {
                        try {
                            const focusResult = await communication.callExtendScriptAsync("focusTimeline();");
                            fullFocusDebug += "타임라인 포커스 이동 결과: " + focusResult + "\n";

                            const veryFinalElement = document.activeElement;
                            fullFocusDebug += "최종 - 활성 요소: " +
                                (veryFinalElement ? (veryFinalElement.tagName + (veryFinalElement.id ? "#" + veryFinalElement.id : "")) : "없음") + "\n";
                        } catch (focusError) {
                            fullFocusDebug += "타임라인 포커스 이동 실패: " + (focusError as Error).message + "\n";
                        }
                    } else {
                        fullFocusDebug += "Communication 객체 없음\n";
                    }

                    // 디버그 정보에 포커스 정보 추가
                    (window as any).lastDebugInfo = ((window as any).lastDebugInfo || debugInfo) + fullFocusDebug;
                    utils.logDebug("포커스 디버그:", fullFocusDebug);

                } catch (focusError) {
                    const errorMsg = "포커스 이동 중 오류: " + (focusError as Error).message;
                    uiManager.updateStatus(errorMsg, false);
                    utils.logDebug(errorMsg);
                }

                resolve();
            }, 100);
        });
    }

    // ===== 캡션-이미지 동기화 기능 =====

    /**
     * 캡션-이미지 동기화 이벤트 리스너 설정
     */
    function setupCaptionEventListeners(): void {
        const utils = getUtils();
        utils.logDebug('Setting up caption-image sync event listeners...');

        // Paste 이벤트 리스너 (Ctrl+V 감지)
        // 사용자가 이미지를 복사하고 패널에서 Ctrl+V를 누르면 자동으로 이미지 큐에 추가됨
        document.addEventListener('paste', handlePasteEvent);
        utils.logDebug('Global paste event listener added');

        // 이미지 찾기 버튼
        const browseButton = document.getElementById('browse-images');
        if (browseButton) {
            browseButton.addEventListener('click', browseImagesForSync);
            utils.logDebug('Event listener added to browse-images button');
        }

        // 동기화 시작 버튼
        const syncButton = document.getElementById('sync-caption-images');
        if (syncButton) {
            syncButton.addEventListener('click', startCaptionImageSync);
            utils.logDebug('Event listener added to sync-caption-images button');
        }

        // 이미지 큐 비우기 버튼 (모달)
        const clearQueueButton = document.getElementById('clear-image-queue');
        if (clearQueueButton) {
            clearQueueButton.addEventListener('click', clearImageQueue);
            utils.logDebug('Event listener added to clear-image-queue button');
        }

        // 이미지 전체 삭제 버튼 (미리보기 패널)
        const clearAllButton = document.getElementById('clear-all-images');
        if (clearAllButton) {
            clearAllButton.addEventListener('click', clearImageQueue);
            utils.logDebug('Event listener added to clear-all-images button');
        }

        // 드래그 앤 드롭 이벤트 (이미지 그리드)
        const imageGrid = document.getElementById('image-grid');
        if (imageGrid) {
            setupDragAndDrop(imageGrid);
            utils.logDebug('Drag and drop setup for image-grid');
        }

        // 드래그 앤 드롭 이벤트 (모달)
        const modalDropZone = document.getElementById('modal-drop-zone');
        if (modalDropZone) {
            setupDragAndDrop(modalDropZone);
            utils.logDebug('Drag and drop setup for modal-drop-zone');
        }
    }

    /**
     * 썸네일 크기 조절 슬라이더 설정
     */

    /**
     * 텍스트 리스트 입력 이벤트 설정 (행 기반)
     */
    function setupTextListInput(): void {
        const utils = getUtils();
        const container = document.getElementById('text-list-container');
        const replaceButton = document.getElementById('replace-all-text');

        if (!container) {
            utils.logWarn('Text list container not found');
            return;
        }

        // 전체 교체 버튼 이벤트
        if (replaceButton) {
            replaceButton.addEventListener('click', () => {
                openTextReplaceModal();
            });
        }

        // 초기 텍스트 리스트 설정
        if (textList.length === 0) {
            textList = [
                '1번 이미지와 매칭될 텍스트',
                '2번 이미지와 매칭될 텍스트',
                '3번 이미지와 매칭될 텍스트'
            ];
        }

        // 텍스트 행 렌더링 (이벤트 리스너 포함)
        renderTextRows();

        utils.logDebug('Text list input setup completed');
    }

    /**
     * 텍스트 전체 교체 모달 열기
     */
    function openTextReplaceModal(): void {
        const modal = document.getElementById('text-replace-modal');
        const textarea = document.getElementById('text-replace-input') as HTMLTextAreaElement;

        if (!modal || !textarea) return;

        // 현재 텍스트를 textarea에 표시
        textarea.value = textList.join('\n');

        // 모달 열기
        modal.classList.add('active');
        textarea.focus();
    }

    /**
     * 텍스트 전체 교체 모달 닫기
     */
    function closeTextReplaceModal(): void {
        const modal = document.getElementById('text-replace-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * 텍스트 전체 교체 실행
     */
    function executeTextReplace(): void {
        const utils = getUtils();
        const textarea = document.getElementById('text-replace-input') as HTMLTextAreaElement;

        if (!textarea) return;

        const newText = textarea.value;

        // 줄 단위로 분리
        const lines = newText.split('\n').filter(line => line.trim() !== '');

        // textList 업데이트
        if (lines.length > 0) {
            textList = lines.map(line => line.trim());
        } else {
            textList = [''];
        }

        // 텍스트 행 렌더링 (이벤트 리스너 포함)
        renderTextRows();

        // 이미지 라벨 업데이트
        updateImageTextLabels();

        utils.logDebug(`${lines.length}개 줄로 전체 교체 완료`);

        // 모달 닫기
        closeTextReplaceModal();
    }

    /**
     * 텍스트 행 삭제
     */
    function deleteTextRow(index: number): void {
        const container = document.getElementById('text-list-container');
        if (!container) return;

        const rows = container.querySelectorAll('.text-row');
        if (index >= 0 && index < rows.length) {
            rows[index].remove();
            textList.splice(index, 1);
            renderTextRows(); // 전체 다시 렌더링 (인덱스 재정렬)
            updateImageTextLabels(); // 이미지 라벨 업데이트
        }
    }

    /**
     * 텍스트 행 전체 렌더링
     */
    function renderTextRows(): void {
        const container = document.getElementById('text-list-container');
        if (!container) return;

        container.innerHTML = '';

        textList.forEach((text, index) => {
            const row = document.createElement('div');
            row.className = 'text-row';
            row.dataset.index = index.toString();

            const rowNumber = document.createElement('div');
            rowNumber.className = 'row-number';
            rowNumber.title = '클릭: 비디오 목업 토글';

            // 비디오 플레이스홀더 여부에 따라 표시 변경
            const hasPlaceholder = index < imageMappings.length && imageMappings[index]?.isPlaceholder;
            if (hasPlaceholder) {
                rowNumber.textContent = '🎬';
                rowNumber.classList.add('video-placeholder');
            } else {
                rowNumber.textContent = index < imageMappings.length ? `#${index + 1}` : '-';
            }

            const rowText = document.createElement('div');
            rowText.className = 'row-text';
            rowText.contentEditable = 'true';
            rowText.textContent = text;
            rowText.dataset.placeholder = '텍스트 입력...';

            const rowDelete = document.createElement('button');
            rowDelete.className = 'row-delete';
            rowDelete.textContent = '✕';
            rowDelete.title = '삭제';

            // 이벤트: 텍스트 입력
            rowText.addEventListener('input', () => {
                updateTextList();
            });

            // 이벤트: Enter 키로 새 행 생성
            rowText.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;

                if (keyEvent.key === 'Enter') {
                    e.preventDefault();

                    const currentIndex = parseInt(row.dataset.index || '0');

                    // 새 행을 현재 행 다음에 삽입
                    textList.splice(currentIndex + 1, 0, '');
                    renderTextRows();
                    updateImageTextLabels();

                    // 새로 생성된 행에 포커스
                    setTimeout(() => {
                        const cont = document.getElementById('text-list-container');
                        if (cont) {
                            const rows = cont.querySelectorAll('.text-row');
                            const newRow = rows[currentIndex + 1];
                            if (newRow) {
                                const newRowText = newRow.querySelector('.row-text') as HTMLElement;
                                if (newRowText) {
                                    newRowText.focus();
                                }
                            }
                        }
                    }, 10);
                }

                // Backspace로 빈 행 삭제
                if (keyEvent.key === 'Backspace') {
                    const currentIndex = parseInt(row.dataset.index || '0');
                    const isEmpty = rowText.textContent?.trim() === '';

                    if (isEmpty && textList.length > 1) {
                        e.preventDefault();

                        textList.splice(currentIndex, 1);
                        renderTextRows();
                        updateImageTextLabels();

                        // 이전 행 끝으로 포커스
                        setTimeout(() => {
                            const cont = document.getElementById('text-list-container');
                            if (cont) {
                                const rows = cont.querySelectorAll('.text-row');
                                const prevRow = rows[Math.max(0, currentIndex - 1)];
                                if (prevRow) {
                                    const prevRowText = prevRow.querySelector('.row-text') as HTMLElement;
                                    if (prevRowText) {
                                        prevRowText.focus();
                                        // 커서를 끝으로 이동
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(prevRowText);
                                        range.collapse(false);
                                        sel?.removeAllRanges();
                                        sel?.addRange(range);
                                    }
                                }
                            }
                        }, 10);
                    }
                }
            });

            // 이벤트: 개별 행에 붙여넣기 (여러 줄 처리)
            rowText.addEventListener('paste', (e: Event) => {
                const pasteEvent = e as ClipboardEvent;
                const pastedText = pasteEvent.clipboardData?.getData('text');

                if (pastedText && pastedText.includes('\n')) {
                    // 여러 줄이면 기본 동작 막고 각 줄을 새 행으로
                    e.preventDefault();

                    const lines = pastedText.split('\n').filter(line => line.trim() !== '');

                    if (lines.length > 0) {
                        // 첫 줄은 현재 행에
                        rowText.textContent = lines[0].trim();

                        // 나머지 줄들은 새 행으로 추가
                        const currentIndex = parseInt(row.dataset.index || '0');
                        for (let i = 1; i < lines.length; i++) {
                            textList.splice(currentIndex + i, 0, lines[i].trim());
                        }

                        renderTextRows();
                        updateImageTextLabels();
                    }
                }
                // 한 줄이면 기본 동작 허용
            });

            // 이벤트: 텍스트 클릭 (이미지 강조)
            rowText.addEventListener('click', () => {
                const textRowIndex = parseInt(row.dataset.index || '0');
                const imageIndex = getImageIndexForTextRow(textRowIndex);
                if (imageIndex >= 0 && imageIndex < imageMappings.length) {
                    highlightImageCard(imageIndex);
                }
            });

            // 이벤트: 행 번호 클릭 (비디오 목업 토글)
            rowNumber.addEventListener('click', (e: Event) => {
                e.stopPropagation(); // 이벤트 전파 방지
                const hasPlaceholder = index < imageMappings.length && imageMappings[index]?.isPlaceholder;
                if (hasPlaceholder) {
                    removeVideoPlaceholder(index);
                } else {
                    createVideoPlaceholder(index);
                }
            });

            // 이벤트: 행 삭제
            rowDelete.addEventListener('click', () => {
                deleteTextRow(index);
            });

            // 이벤트: hover 시 해당 이미지 약하게 강조
            row.addEventListener('mouseenter', () => {
                const textRowIndex = parseInt(row.dataset.index || '0');
                const imageIndex = getImageIndexForTextRow(textRowIndex);
                if (imageIndex >= 0 && imageIndex < imageMappings.length) {
                    hoverHighlightImageCard(imageIndex);
                }
            });

            row.addEventListener('mouseleave', () => {
                clearHoverHighlightImageCard();
            });

            // 비디오 플레이스홀더가 있는 행인지 확인하여 스타일 추가
            if (hasPlaceholder) {
                row.classList.add('has-video-placeholder');
            }

            row.appendChild(rowNumber);
            row.appendChild(rowText);
            row.appendChild(rowDelete);
            container.appendChild(row);
        });

        updateTextCount();
    }

    /**
     * 텍스트 리스트 업데이트 (행 기반)
     */
    function updateTextList(): void {
        const container = document.getElementById('text-list-container');
        if (!container) return;

        // 각 행에서 텍스트 추출 (빈 줄도 유지하여 이미지와 순서 일치)
        const rows = container.querySelectorAll('.text-row');
        textList = Array.from(rows).map(row => {
            const textDiv = row.querySelector('.row-text') as HTMLElement;
            return textDiv ? textDiv.textContent || '' : '';
        });

        updateTextCount();
        updateImageTextLabels();
    }

    /**
     * 텍스트 개수 업데이트
     */
    function updateTextCount(): void {
        const textCount = document.getElementById('text-count');
        if (textCount) {
            const container = document.getElementById('text-list-container');
            const rowCount = container ? container.querySelectorAll('.text-row').length : 0;
            textCount.textContent = `${rowCount}줄`;
        }
    }

    /**
     * 줄 번호 업데이트 (행 기반에서는 렌더링 시 자동 업데이트)
     */
    function updateLineNumbers(): void {
        const container = document.getElementById('text-list-container');
        if (!container) return;

        const rows = container.querySelectorAll('.text-row');
        rows.forEach((row, index) => {
            const rowNumber = row.querySelector('.row-number');
            if (rowNumber) {
                rowNumber.textContent = index < imageMappings.length ? `#${index + 1}` : '-';
            }
        });
    }

    /**
     * 이미지에 텍스트 라벨 매칭
     * captionCount가 2개 이상일 경우, 여러 텍스트를 합쳐서 표시
     */
    function updateImageTextLabels(): void {
        const lines = textList;
        let textIndex = 0; // 텍스트 리스트의 현재 위치

        imageMappings.forEach((mapping) => {
            const assignedTexts: string[] = [];

            // captionCount만큼의 텍스트 가져오기
            for (let i = 0; i < mapping.captionCount; i++) {
                if (textIndex < lines.length) {
                    assignedTexts.push(lines[textIndex]);
                    textIndex++;
                }
            }

            // 여러 텍스트를 하나로 합치기
            if (assignedTexts.length > 0) {
                mapping.textLabel = assignedTexts.join(' / ');
            } else {
                mapping.textLabel = undefined;
            }
        });

        // UI 업데이트
        updateImageGrid();
    }

    // 행 기반 구조에서는 텍스트 클릭 시 이미지 강조가 각 행의 이벤트에서 처리됨

    /**
     * 이미지 인덱스를 텍스트 행 범위로 변환
     * @param imageIndex 이미지 인덱스
     * @returns 텍스트 행의 시작과 끝 인덱스
     */
    function getTextRowRangeForImage(imageIndex: number): { start: number, end: number } | null {
        if (imageIndex < 0 || imageIndex >= imageMappings.length) {
            return null;
        }

        let textStartIndex = 0;
        for (let i = 0; i < imageIndex; i++) {
            textStartIndex += imageMappings[i].captionCount;
        }

        const textEndIndex = textStartIndex + imageMappings[imageIndex].captionCount - 1;
        return { start: textStartIndex, end: textEndIndex };
    }

    /**
     * 텍스트 행 인덱스를 이미지 인덱스로 변환
     * @param textRowIndex 텍스트 행 인덱스
     * @returns 이미지 인덱스
     */
    function getImageIndexForTextRow(textRowIndex: number): number {
        if (textRowIndex < 0) {
            return -1;
        }

        let textCounter = 0;
        for (let i = 0; i < imageMappings.length; i++) {
            textCounter += imageMappings[i].captionCount;
            if (textRowIndex < textCounter) {
                return i;
            }
        }

        return -1; // 범위를 벗어난 경우
    }

    /**
     * 모든 클릭 강조 제거 (텍스트 + 이미지)
     */
    function clearAllHighlights(): void {
        // 이미지 강조 제거
        const gridDiv = document.getElementById('image-grid');
        if (gridDiv) {
            const highlightedImages = gridDiv.querySelectorAll('.image-card.highlight');
            highlightedImages.forEach(card => card.classList.remove('highlight'));
        }

        // 텍스트 강조 제거
        const container = document.getElementById('text-list-container');
        if (container) {
            const highlightedRows = container.querySelectorAll('.text-row.highlight');
            highlightedRows.forEach(row => row.classList.remove('highlight'));
        }
    }

    /**
     * 텍스트-이미지 쌍 강조 (클릭 시)
     */
    function highlightPair(index: number, scrollToImage: boolean = true): void {
        const gridDiv = document.getElementById('image-grid');
        const container = document.getElementById('text-list-container');

        // 모든 기존 강조 제거
        clearAllHighlights();

        // 이미지 강조
        if (gridDiv && index < imageMappings.length) {
            const imageId = imageMappings[index]?.id;
            if (imageId) {
                const targetCard = gridDiv.querySelector(`[data-image-id="${imageId}"]`);
                if (targetCard) {
                    targetCard.classList.add('highlight');
                    if (scrollToImage) {
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }

        // 텍스트 강조 (captionCount만큼의 여러 행 강조)
        if (container) {
            const textRange = getTextRowRangeForImage(index);
            if (textRange) {
                const rows = container.querySelectorAll('.text-row');
                let firstRow: Element | null = null;

                for (let i = textRange.start; i <= textRange.end && i < rows.length; i++) {
                    rows[i].classList.add('highlight');
                    if (!firstRow) {
                        firstRow = rows[i];
                    }
                }

                // 첫 번째 강조된 행으로 스크롤
                if (!scrollToImage && firstRow) {
                    firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    /**
     * 이미지 카드 강조 (클릭 시) - 양쪽 모두 강조
     */
    function highlightImageCard(imageIndex: number): void {
        highlightPair(imageIndex, true);  // 이미지로 스크롤
    }

    /**
     * 이미지 카드 hover 강조 (텍스트 hover 시)
     */
    function hoverHighlightImageCard(imageIndex: number): void {
        const gridDiv = document.getElementById('image-grid');
        if (!gridDiv) return;

        // 기존 hover 강조 제거
        const previousHovered = gridDiv.querySelectorAll('.image-card.hover-highlight');
        previousHovered.forEach(card => card.classList.remove('hover-highlight'));

        // 해당 이미지 카드 찾기
        const imageId = imageMappings[imageIndex]?.id;
        if (!imageId) return;

        const targetCard = gridDiv.querySelector(`[data-image-id="${imageId}"]`);
        if (targetCard) {
            // hover 강조 효과 추가
            targetCard.classList.add('hover-highlight');
        }
    }

    /**
     * 이미지 카드 hover 강조 제거
     */
    function clearHoverHighlightImageCard(): void {
        const gridDiv = document.getElementById('image-grid');
        if (!gridDiv) return;

        const hovered = gridDiv.querySelectorAll('.image-card.hover-highlight');
        hovered.forEach(card => card.classList.remove('hover-highlight'));
    }

    /**
     * 텍스트 행 hover 강조 (이미지 hover 시)
     */
    function hoverHighlightTextRow(imageIndex: number): void {
        const container = document.getElementById('text-list-container');
        if (!container) return;

        // 기존 hover 강조 제거
        const previousHovered = container.querySelectorAll('.text-row.hover-highlight');
        previousHovered.forEach(row => row.classList.remove('hover-highlight'));

        // 해당 이미지의 텍스트 범위 찾기 (captionCount만큼)
        const textRange = getTextRowRangeForImage(imageIndex);
        if (!textRange) return;

        const rows = container.querySelectorAll('.text-row');
        for (let i = textRange.start; i <= textRange.end && i < rows.length; i++) {
            rows[i].classList.add('hover-highlight');
        }
    }

    /**
     * 텍스트 행 hover 강조 제거
     */
    function clearHoverHighlightTextRow(): void {
        const container = document.getElementById('text-list-container');
        if (!container) return;

        const hovered = container.querySelectorAll('.text-row.hover-highlight');
        hovered.forEach(row => row.classList.remove('hover-highlight'));
    }

    /**
     * 이미지 카드 클릭 핸들러 (해당 텍스트 행 강조)
     */
    function handleImageCardClick(imageIndex: number): void {
        const utils = getUtils();
        const container = document.getElementById('text-list-container');
        if (!container) return;

        // 텍스트와 이미지 양쪽 모두 강조 (텍스트로 스크롤)
        highlightPair(imageIndex, false);

        // 해당 이미지의 첫 번째 텍스트 행 찾아서 포커스
        const textRange = getTextRowRangeForImage(imageIndex);
        if (textRange) {
            const rows = container.querySelectorAll('.text-row');
            if (textRange.start < rows.length) {
                const targetRow = rows[textRange.start];
                const rowText = targetRow.querySelector('.row-text') as HTMLElement;

                if (rowText) {
                    // 텍스트에 포커스
                    rowText.focus();

                    const captionCount = imageMappings[imageIndex].captionCount;
                    utils.logDebug(`이미지 #${imageIndex + 1} 클릭 → ${captionCount}개 텍스트 강조 (텍스트 ${textRange.start + 1}-${textRange.end + 1})`);
                }
            }
        }
    }

    /**
     * 이미지 그리드 렌더링
     */
    function updateImageGrid(): void {
        const gridDiv = document.getElementById('image-grid');
        const countText = document.getElementById('image-count-text');
        const clearAllButton = document.getElementById('clear-all-images') as HTMLButtonElement;

        if (!gridDiv || !countText) return;

        if (imageMappings.length === 0) {
            gridDiv.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🖼️</div>
                    <h3>이미지를 추가하세요</h3>
                    <p>드래그 앤 드롭 또는 Ctrl+V로 추가</p>
                </div>
            `;
            countText.textContent = '0개';
            if (clearAllButton) clearAllButton.style.display = 'none';
        } else {
            countText.textContent = `${imageMappings.length}개`;
            if (clearAllButton) clearAllButton.style.display = 'inline-block';

            // 그리드 렌더링
            gridDiv.innerHTML = '';

            // 캡션 범위 계산을 위한 누적 카운터
            let cumulativeCaptionIndex = 1;

            imageMappings.forEach((mapping, index) => {
                const captionStart = cumulativeCaptionIndex;
                const captionEnd = cumulativeCaptionIndex + mapping.captionCount - 1;
                cumulativeCaptionIndex += mapping.captionCount;

                // 카드 생성
                const card = document.createElement('div');
                card.className = mapping.isPlaceholder ? 'image-card placeholder' : 'image-card';
                card.dataset.imageId = mapping.id;
                card.draggable = true;

                // 텍스트 라벨 HTML (플레이스홀더와 일반 이미지 모두 사용)
                const textLabelHtml = mapping.textLabel
                    ? `<div class="image-card-text" title="${mapping.textLabel}">📝 ${mapping.textLabel}</div>`
                    : '';

                // 플레이스홀더 카드 렌더링
                if (mapping.isPlaceholder) {
                    card.innerHTML = `
                        <div class="image-card-number">${index + 1}</div>
                        <button class="image-card-remove" data-image-id="${mapping.id}">✕</button>
                        <div class="image-card-thumbnail placeholder-thumbnail">
                            <div class="placeholder-icon">🎬</div>
                        </div>
                        <div class="image-card-info">
                            ${textLabelHtml}
                            <div class="image-card-filename" title="비디오 구간">비디오 구간</div>
                            <div class="image-card-controls">
                                <span class="image-card-caption">캡션 ${captionStart}-${captionEnd}</span>
                                <select data-image-id="${mapping.id}" class="image-card-caption-select">
                                    ${[1,2,3,4,5,6,7,8,9,10].map(n =>
                                        `<option value="${n}" ${n === mapping.captionCount ? 'selected' : ''}>${n}개</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    `;
                } else {
                    // 일반 이미지 카드 렌더링
                    card.innerHTML = `
                        <div class="image-card-number">${index + 1}</div>
                        <button class="image-card-remove" data-image-id="${mapping.id}">✕</button>
                        <img class="image-card-thumbnail" src="data:image/png;base64,${mapping.thumbnail}" alt="${mapping.fileName}">
                        <div class="image-card-info">
                            ${textLabelHtml}
                            <div class="image-card-filename" title="${mapping.fileName}">${mapping.fileName}</div>
                            <div class="image-card-controls">
                                <span class="image-card-caption">캡션 ${captionStart}-${captionEnd}</span>
                                <select data-image-id="${mapping.id}" class="image-card-caption-select">
                                    ${[1,2,3,4,5,6,7,8,9,10].map(n =>
                                        `<option value="${n}" ${n === mapping.captionCount ? 'selected' : ''}>${n}개</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    `;
                }

                gridDiv.appendChild(card);

                // 이벤트 리스너
                const removeBtn = card.querySelector('.image-card-remove');
                if (removeBtn) {
                    removeBtn.addEventListener('click', handleRemoveImage);
                }

                const captionSelect = card.querySelector('.image-card-caption-select');
                if (captionSelect) {
                    captionSelect.addEventListener('change', handleCaptionCountChange);
                }

                // 이미지 카드 클릭 이벤트 (텍스트 강조)
                card.addEventListener('click', (e) => {
                    // 버튼이나 select 클릭은 무시
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'BUTTON' || target.tagName === 'SELECT') {
                        return;
                    }
                    handleImageCardClick(index);
                });

                // 이미지 카드 hover 이벤트 (텍스트 약하게 강조)
                card.addEventListener('mouseenter', () => {
                    hoverHighlightTextRow(index);
                });

                card.addEventListener('mouseleave', () => {
                    clearHoverHighlightTextRow();
                });

                // 드래그 이벤트
                card.addEventListener('dragstart', handlePreviewDragStart);
                card.addEventListener('dragover', handlePreviewDragOver);
                card.addEventListener('drop', handlePreviewDrop);
                card.addEventListener('dragend', handlePreviewDragEnd);
            });
        }

        // 이미지 개수가 변경되었으므로 줄 번호 업데이트
        updateLineNumbers();
    }

    // updateImageSummary는 updateImageGrid의 별칭으로 사용
    function updateImageSummary(): void {
        updateImageGrid();
    }

    /**
     * 특정 인덱스부터 캡션 범위 업데이트 (DOM 텍스트만 변경)
     * @param startIndex 업데이트 시작 인덱스
     */
    function updateCaptionRanges(startIndex: number): void {
        // 시작 인덱스까지의 누적 캡션 개수 계산
        let cumulativeCaptionIndex = 1;
        for (let i = 0; i < startIndex; i++) {
            cumulativeCaptionIndex += imageMappings[i].captionCount;
        }

        // startIndex부터 끝까지 캡션 범위 텍스트만 업데이트
        for (let i = startIndex; i < imageMappings.length; i++) {
            const mapping = imageMappings[i];
            const captionStart = cumulativeCaptionIndex;
            const captionEnd = cumulativeCaptionIndex + mapping.captionCount - 1;

            // 모달 큐의 캡션 범위 업데이트
            const captionPreview = document.getElementById(`caption-preview-${mapping.id}`);
            if (captionPreview) {
                captionPreview.textContent = `캡션 ${captionStart}-${captionEnd} 범위`;
            }

            // 메인 리스트의 캡션 정보 업데이트
            const previewDiv = document.getElementById('image-preview-thumbnails');
            if (previewDiv) {
                const listItem = previewDiv.querySelector(`[data-image-id="${mapping.id}"]`);
                if (listItem) {
                    const captionInfo = listItem.querySelector('.caption-info');
                    if (captionInfo) {
                        captionInfo.textContent = `🎬 캡션: ${captionStart}-${captionEnd}`;
                    }
                }
            }

            cumulativeCaptionIndex += mapping.captionCount;
        }
    }

    /**
     * 단일 이미지를 DOM에 추가 (성능 최적화용)
     * @param mapping 추가할 이미지 매핑
     * @param index imageMappings 배열에서의 인덱스
     */

    /**
     * 이미지 큐 렌더링 (모달 내부 - 기본 모드 vs 고급 모드)
     */
    function renderImageQueue(): void {
        const queueDiv = document.getElementById('image-queue');
        if (!queueDiv) return;

        queueDiv.innerHTML = '';

        // 패널 요약 정보 업데이트
        updateImageSummary();

        if (imageMappings.length === 0) {
            queueDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">이미지를 추가하세요</div>';
            return;
        }

        // 자동 캡션 범위 계산을 위한 누적 카운터
        let cumulativeCaptionIndex = 1;

        imageMappings.forEach((mapping) => {
            // 이 이미지의 캡션 범위 계산
            const captionStart = cumulativeCaptionIndex;
            const captionEnd = cumulativeCaptionIndex + mapping.captionCount - 1;
            cumulativeCaptionIndex += mapping.captionCount;

            // 툴팁 텍스트 생성
            const tooltipText = `${mapping.fileName}\n캡션 ${captionStart}-${captionEnd} 범위 (${mapping.captionCount}개)`;

            // 미리보기와 동일한 스타일 사용 (크기만 더 크게)
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-thumbnail-wrapper';
            wrapper.draggable = true;
            wrapper.dataset.imageId = mapping.id;

            // 썸네일 이미지
            const img = document.createElement('img');
            img.className = 'preview-thumbnail';
            img.src = `data:image/png;base64,${mapping.thumbnail}`;
            img.alt = mapping.fileName;
            img.title = tooltipText;

            // 삭제 버튼
            const removeBtn = document.createElement('div');
            removeBtn.className = 'preview-remove-btn';
            removeBtn.textContent = '✕';
            removeBtn.title = `${mapping.fileName} 삭제`;
            removeBtn.dataset.imageId = mapping.id;
            removeBtn.addEventListener('click', handleRemoveImage);

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);

            // 캡션 개수 표시 (클릭하여 변경)
            const captionCount = document.createElement('div');
            captionCount.className = 'preview-caption-count';
            captionCount.textContent = String(mapping.captionCount || 1);
            captionCount.title = '캡션 개수 (클릭하여 변경)';
            captionCount.dataset.imageId = mapping.id;
            captionCount.addEventListener('click', handleModalCaptionClick);
            wrapper.appendChild(captionCount);

            // 캡션 범위 표시
            const captionRange = document.createElement('div');
            captionRange.className = 'preview-caption-range';
            captionRange.textContent = `캡션 ${captionStart}-${captionEnd}`;
            captionRange.dataset.imageId = mapping.id;
            captionRange.id = `caption-preview-${mapping.id}`;
            wrapper.appendChild(captionRange);

            // 드래그 앤 드롭 이벤트 추가
            wrapper.addEventListener('dragstart', handleDragStart);
            wrapper.addEventListener('dragover', handleDragOver);
            wrapper.addEventListener('drop', handleDrop);
            wrapper.addEventListener('dragend', handleDragEnd);

            queueDiv.appendChild(wrapper);
        });

        // 동기화 버튼 상태 업데이트
        const syncButton = document.getElementById('sync-caption-images') as HTMLButtonElement;
        if (syncButton) {
            syncButton.disabled = imageMappings.length === 0;
        }
    }

    /**
     * 드래그 앤 드롭 핸들러
     */
    let draggedElement: HTMLElement | null = null;

    function handleDragStart(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        draggedElement = target;
        target.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            // 내부 드래그임을 표시 (외부 파일 드래그와 구분)
            e.dataTransfer.setData('text/plain', 'internal-reorder');
        }
    }

    function handleDragOver(e: DragEvent): void {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDrop(e: DragEvent): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;

        if (draggedElement && draggedElement !== target) {
            const draggedId = draggedElement.dataset.imageId;
            const targetId = target.dataset.imageId;

            if (draggedId && targetId) {
                // imageMappings 배열에서 순서 변경
                const draggedIndex = imageMappings.findIndex(m => m.id === draggedId);
                const targetIndex = imageMappings.findIndex(m => m.id === targetId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    const [draggedItem] = imageMappings.splice(draggedIndex, 1);
                    imageMappings.splice(targetIndex, 0, draggedItem);

                    // 성능 최적화: 전체 재렌더링 대신 DOM 요소만 이동
                    const queueDiv = document.getElementById('image-queue');
                    if (queueDiv) {
                        // DOM에서 드래그된 요소를 타겟 위치로 이동
                        if (draggedIndex < targetIndex) {
                            // 아래로 이동: target 다음에 삽입
                            target.parentNode?.insertBefore(draggedElement, target.nextSibling);
                        } else {
                            // 위로 이동: target 앞에 삽입
                            target.parentNode?.insertBefore(draggedElement, target);
                        }

                        // 영향받는 이미지들의 캡션 범위만 업데이트
                        const minIndex = Math.min(draggedIndex, targetIndex);
                        updateCaptionRanges(minIndex);
                    }
                }
            }
        }
    }

    function handleDragEnd(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('dragging');
        draggedElement = null;
    }

    /**
     * 이미지 제거 핸들러
     */
    function handleRemoveImage(e: Event): void {
        const utils = getUtils();
        const button = e.currentTarget as HTMLButtonElement;
        const imageId = button.dataset.imageId;

        if (imageId) {
            const index = imageMappings.findIndex(m => m.id === imageId);
            if (index !== -1) {
                const removed = imageMappings.splice(index, 1)[0];
                utils.logInfo(`이미지 제거됨: ${removed.fileName}`);

                // 텍스트 라벨 다시 매칭
                updateImageTextLabels();

                // 그리드 재렌더링
                updateImageGrid();

                // 동기화 버튼 상태 업데이트
                const syncButton = document.getElementById('sync-caption-images') as HTMLButtonElement;
                if (syncButton) {
                    syncButton.disabled = imageMappings.length === 0;
                }
            }
        }
    }

    /**
     * 미리보기 드래그 앤 드롭 핸들러 (순서 변경)
     */
    let previewDraggedElement: HTMLElement | null = null;

    function handlePreviewDragStart(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        previewDraggedElement = target;
        target.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'internal-reorder');
        }
    }

    function handlePreviewDragOver(e: DragEvent): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        if (previewDraggedElement && previewDraggedElement !== target) {
            target.classList.add('drag-over-preview');
        }
    }

    function handlePreviewDrop(e: DragEvent): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('drag-over-preview');

        if (previewDraggedElement && previewDraggedElement !== target) {
            const draggedId = previewDraggedElement.dataset.imageId;
            const targetId = target.dataset.imageId;

            if (draggedId && targetId) {
                const draggedIndex = imageMappings.findIndex(m => m.id === draggedId);
                const targetIndex = imageMappings.findIndex(m => m.id === targetId);

                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // 배열에서 순서 변경
                    const [draggedItem] = imageMappings.splice(draggedIndex, 1);
                    imageMappings.splice(targetIndex, 0, draggedItem);

                    // 텍스트 라벨 다시 매칭 (순서가 바뀌었으므로)
                    updateImageTextLabels();

                    // 그리드 전체 재렌더링
                    updateImageGrid();
                }
            }
        }
    }

    function handlePreviewDragEnd(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('dragging');

        // 모든 drag-over 스타일 제거
        document.querySelectorAll('.drag-over-preview').forEach(el => {
            el.classList.remove('drag-over-preview');
        });

        previewDraggedElement = null;
    }

    /**
     * 모달 캡션 개수 클릭 핸들러 (드롭다운으로 변경)
     */
    function handleModalCaptionClick(e: Event): void {
        e.stopPropagation();
        const captionDiv = e.currentTarget as HTMLElement;
        const imageId = captionDiv.dataset.imageId;
        const currentValue = parseInt(captionDiv.textContent || '1', 10);

        // 드롭다운으로 교체
        const select = document.createElement('select');
        select.className = 'preview-caption-select select-modern';
        select.dataset.imageId = imageId || '';

        // 옵션 추가 (1~10)
        for (let i = 1; i <= 10; i++) {
            const option = document.createElement('option');
            option.value = String(i);
            option.textContent = `${i}개`;
            if (i === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        // 부모에서 캡션 div 제거하고 select 추가
        const wrapper = captionDiv.parentElement;
        if (wrapper) {
            wrapper.removeChild(captionDiv);
            wrapper.appendChild(select);

            // 클릭 이벤트 전파 방지
            select.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // mousedown 이벤트 전파 방지
            select.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            select.focus();

            // 드롭다운 자동으로 열기
            setTimeout(() => {
                const event = new MouseEvent('mousedown', {
                    bubbles: false,
                    cancelable: true,
                    view: window
                });
                select.dispatchEvent(event);
            }, 10);

            // 선택 변경 시 즉시 저장 및 큐 재렌더링
            const saveValue = () => {
                const newValue = parseInt(select.value, 10);
                if (imageId && newValue > 0) {
                    const index = imageMappings.findIndex(m => m.id === imageId);
                    if (index !== -1) {
                        imageMappings[index].captionCount = newValue;
                        updateImageSummary();
                        updateCaptionRanges(index);
                        // 텍스트 라벨 다시 매칭 (captionCount가 변경되었으므로)
                        updateImageTextLabels();
                    }
                }
            };

            select.addEventListener('change', saveValue);
            select.addEventListener('blur', () => {
                // blur 시 미리보기와 큐 모두 업데이트
                updateImageSummary();
                renderImageQueue();
            });
        }
    }

    /**
     * 캡션 개수 변경 핸들러
     */
    function handleCaptionCountChange(e: Event): void {
        const select = e.currentTarget as HTMLSelectElement;
        const imageId = select.dataset.imageId;
        const value = parseInt(select.value, 10);

        if (imageId && value > 0) {
            const index = imageMappings.findIndex(m => m.id === imageId);
            if (index !== -1) {
                const mapping = imageMappings[index];
                mapping.captionCount = value;

                // 텍스트 라벨 다시 매칭 (captionCount가 변경되었으므로)
                updateImageTextLabels();
            }
        }
    }


    /**
     * Base64 이미지를 프로젝트 폴더에 파일로 저장 (Node.js fs 사용 - 매우 빠름!)
     * @param base64Data Base64 인코딩된 이미지 데이터
     * @param fileName 파일명
     * @returns 저장된 파일의 전체 경로를 반환하는 Promise
     */
    function saveBase64ToProjectFolder(base64Data: string, fileName: string): Promise<string | null> {
        const utils = getUtils();
        const communication = getCommunication();

        return new Promise((resolve) => {
            try {
                utils.logInfo('=== saveBase64ToProjectFolder (Node.js) 시작 ===');
                utils.logInfo(`파일명: ${fileName}`);
                utils.logInfo(`base64Data 길이: ${base64Data ? base64Data.length : 'undefined'}`);

                if (!base64Data) {
                    utils.logError('base64Data가 없습니다!');
                    resolve(null);
                    return;
                }

                // 먼저 JSX에서 프로젝트 경로를 가져옴
                communication.callExtendScript('getProjectPath()', (response: string) => {
                    try {
                        const projectInfo = JSON.parse(response);

                        if (!projectInfo.success) {
                            utils.logError(`프로젝트 경로 가져오기 실패: ${projectInfo.message}`);
                            resolve(null);
                            return;
                        }

                        const projectPath = projectInfo.path;
                        utils.logInfo(`프로젝트 경로: ${projectPath}`);

                        // Node.js fs 모듈 사용 (CEP 내장)
                        const fs = (window as any).require('fs');
                        const path = (window as any).require('path');

                        // 프로젝트 폴더에서 디렉토리 부분만 추출 (.prproj 파일 제거)
                        const projectDir = path.dirname(projectPath);
                        utils.logInfo(`프로젝트 디렉토리: ${projectDir}`);

                        // caption-images 폴더 경로
                        const targetDir = path.join(projectDir, 'caption-images');
                        utils.logInfo(`저장 폴더: ${targetDir}`);

                        // 폴더 생성 (없으면)
                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                            utils.logInfo(`폴더 생성됨: ${targetDir}`);
                        }

                        // 파일 경로
                        const filePath = path.join(targetDir, fileName);
                        utils.logInfo(`파일 경로: ${filePath}`);

                        // Base64를 Buffer로 변환 (빠름!)
                        const buffer = Buffer.from(base64Data, 'base64');
                        utils.logInfo(`Buffer 생성됨: ${buffer.length} bytes`);

                        // 파일 쓰기 (매우 빠름!)
                        fs.writeFileSync(filePath, buffer);
                        utils.logInfo(`✓ 이미지 저장 성공: ${filePath}`);

                        // 파일 존재 확인
                        if (fs.existsSync(filePath)) {
                            const stats = fs.statSync(filePath);
                            utils.logInfo(`파일 크기 확인: ${stats.size} bytes`);
                            resolve(filePath);
                        } else {
                            utils.logError('파일이 생성되지 않음');
                            resolve(null);
                        }
                    } catch (e) {
                        utils.logError('Base64 저장 중 예외 발생');
                        utils.logError(`예외 타입: ${typeof e}`);
                        if (e instanceof Error) {
                            utils.logError(`Error 메시지: ${e.message}`);
                            utils.logError(`Error 스택: ${e.stack || 'no stack'}`);
                        }
                        resolve(null);
                    }
                });
            } catch (e) {
                utils.logError('saveBase64ToProjectFolder 외부 예외 발생');
                if (e instanceof Error) {
                    utils.logError(`Error 메시지: ${e.message}`);
                    utils.logError(`Error 스택: ${e.stack || 'no stack'}`);
                }
                resolve(null);
            }
        });
    }

    /**
     * 드래그 앤 드롭 설정
     */
    function setupDragAndDrop(dropZone: HTMLElement): void {
        const utils = getUtils();

        dropZone.addEventListener('dragenter', (e: DragEvent) => {
            // 내부 요소 드래그인지 확인 (text/plain 타입이 있으면 내부 드래그)
            if (e.dataTransfer?.types.includes('text/plain')) {
                return; // 내부 요소 드래그는 처리하지 않음
            }
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragover', (e: DragEvent) => {
            // 내부 요소 드래그인지 확인 (text/plain 타입이 있으면 내부 드래그)
            if (e.dataTransfer?.types.includes('text/plain')) {
                return; // 내부 요소 드래그는 처리하지 않음
            }
            e.preventDefault();
            e.stopPropagation();
        });

        dropZone.addEventListener('dragleave', (e: DragEvent) => {
            // 내부 요소 드래그인지 확인 (text/plain 타입이 있으면 내부 드래그)
            if (e.dataTransfer?.types.includes('text/plain')) {
                return; // 내부 요소 드래그는 처리하지 않음
            }
            e.preventDefault();
            e.stopPropagation();
            // 자식 요소로의 이동은 무시
            if (e.target === dropZone) {
                dropZone.classList.remove('drag-over');
            }
        });

        dropZone.addEventListener('drop', async (e: DragEvent) => {
            // 내부 요소 드롭인지 확인 (text/plain 데이터가 'internal-reorder'이면 내부 드래그)
            const dragData = e.dataTransfer?.getData('text/plain');
            if (dragData === 'internal-reorder') {
                return; // 내부 요소 드래그는 처리하지 않음
            }

            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) {
                utils.logWarn('드롭된 파일이 없습니다');
                return;
            }

            utils.logInfo(`${files.length}개 파일 드롭됨`);

            // 각 파일 처리
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // 이미지 파일인지 확인
                if (!file.type.startsWith('image/')) {
                    utils.logWarn(`이미지가 아닌 파일 무시: ${file.name} (${file.type})`);
                    continue;
                }

                utils.logInfo(`이미지 파일 처리 중: ${file.name} (${file.type})`);

                try {
                    // FileReader로 Base64 변환
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const resultStr = reader.result as string;
                            if (!resultStr) {
                                reject(new Error('빈 결과'));
                                return;
                            }
                            const parts = resultStr.split(',');
                            const base64Data = parts[1];
                            if (!base64Data) {
                                reject(new Error('Base64 추출 실패'));
                                return;
                            }
                            resolve(base64Data);
                        };
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(file);
                    });

                    // 원본 파일명 사용
                    const originalName = file.name;

                    // 프로젝트 폴더에 저장
                    const savedPath = await saveBase64ToProjectFolder(base64, originalName);

                    if (savedPath) {
                        // 큐에 추가
                        await addImageToQueue(savedPath, originalName, base64);
                        utils.logInfo(`이미지 추가 성공: ${originalName}`);
                    } else {
                        utils.logError(`이미지 저장 실패: ${originalName}`);
                    }
                } catch (e) {
                    utils.logError(`파일 처리 중 오류: ${file.name}`, e);
                }
            }
        });
    }

    /**
     * Paste 이벤트 핸들러 (Ctrl+V)
     * navigator.clipboard.read()와 달리 paste 이벤트는 작동할 수 있음!
     */
    function handlePasteEvent(event: ClipboardEvent): void {
        const utils = getUtils();
        const resultDiv = document.getElementById('sync-test-result');

        try {
            utils.logInfo('Paste 이벤트 감지됨');

            // 클립보드 데이터 확인
            const clipboardData = event.clipboardData;
            if (!clipboardData) {
                utils.logWarn('clipboardData가 없습니다');
                return;
            }

            utils.logInfo(`클립보드 아이템 수: ${clipboardData.items.length}`);
            utils.logInfo(`클립보드 타입: ${clipboardData.types.join(', ')}`);

            // 이미지 찾기
            let imageFound = false;
            for (let i = 0; i < clipboardData.items.length; i++) {
                const item = clipboardData.items[i];
                utils.logInfo(`아이템[${i}]: kind=${item.kind}, type=${item.type}`);

                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        utils.logInfo(`✓ 이미지 파일 발견: ${file.name}, 크기: ${file.size} bytes, 타입: ${file.type}`);

                        // FileReader로 Base64 변환
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            try {
                                utils.logInfo('FileReader.onloadend 시작');
                                utils.logInfo(`reader.result 타입: ${typeof reader.result}`);
                                utils.logInfo(`reader.result 길이: ${reader.result ? (reader.result as string).length : 'null'}`);
                                utils.logInfo(`reader.result 샘플: ${reader.result ? (reader.result as string).substring(0, 100) : 'null'}`);

                                const resultStr = reader.result as string;
                                if (!resultStr) {
                                    utils.logError('reader.result가 비어있습니다');
                                    if (resultDiv) resultDiv.textContent = '✗ 이미지 읽기 실패 (빈 결과)';
                                    return;
                                }

                                const parts = resultStr.split(',');
                                utils.logInfo(`split 결과 개수: ${parts.length}`);
                                const base64 = parts[1];

                                if (!base64) {
                                    utils.logError('Base64 데이터를 추출할 수 없습니다');
                                    if (resultDiv) resultDiv.textContent = '✗ Base64 추출 실패';
                                    return;
                                }

                                utils.logInfo(`Base64 길이: ${base64.length}`);

                                // 고유한 파일명 생성 (순서대로 번호 매기기)
                                // 클립보드 이미지는 file.name이 항상 "image.png"로 같으므로 항상 고유 이름 생성
                                imageCounter++;

                                // MIME 타입에서 확장자 결정
                                let extension = 'png'; // 기본값
                                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                                    extension = 'jpg';
                                } else if (file.type === 'image/png') {
                                    extension = 'png';
                                } else if (file.type === 'image/gif') {
                                    extension = 'gif';
                                } else if (file.type === 'image/webp') {
                                    extension = 'webp';
                                }

                                const fileName = `image-${imageCounter}.${extension}`;
                                utils.logInfo(`원본 파일명: ${file.name}, MIME: ${file.type}, 생성된 파일명: ${fileName}`);

                                // 로딩 표시
                                if (resultDiv) {
                                    resultDiv.textContent = `⏳ 이미지 저장 중... (${fileName})`;
                                }

                                // Base64를 프로젝트 폴더에 파일로 저장 (비동기)
                                utils.logInfo('saveBase64ToProjectFolder 호출 직전');
                                const savedPath = await saveBase64ToProjectFolder(base64, fileName);
                                utils.logInfo(`saveBase64ToProjectFolder 완료, 결과: ${savedPath}`);

                                if (savedPath) {
                                    // 저장된 파일 경로와 Base64 썸네일을 큐에 추가
                                    await addImageToQueue(savedPath, fileName, base64);

                                    if (resultDiv) {
                                        resultDiv.textContent = `✓ 이미지 저장 완료: ${fileName}`;
                                    }
                                    utils.logInfo(`이미지 저장 및 큐에 추가됨: ${savedPath}`);
                                } else {
                                    if (resultDiv) {
                                        resultDiv.textContent = `✗ 이미지 저장 실패: ${fileName}`;
                                    }
                                    utils.logError(`이미지 저장 실패: ${fileName}`);
                                }
                            } catch (e) {
                                utils.logError('FileReader.onloadend 예외:', e);
                                utils.logError('예외 타입:', typeof e);
                                utils.logError('예외 문자열:', String(e));
                                if (e instanceof Error) {
                                    utils.logError('예외 메시지:', e.message);
                                    utils.logError('예외 스택:', e.stack);
                                }
                            }
                        };
                        reader.onerror = () => {
                            utils.logError('FileReader 오류:', reader.error);
                            if (resultDiv) {
                                resultDiv.textContent = '✗ 이미지 읽기 실패';
                            }
                        };
                        reader.readAsDataURL(file);

                        imageFound = true;
                        event.preventDefault(); // 기본 붙여넣기 동작 방지
                        break;
                    }
                }
            }

            if (!imageFound) {
                utils.logInfo('클립보드에 이미지가 없습니다 (텍스트나 다른 형식)');
            }

        } catch (error) {
            const err = error as Error;
            utils.logError('Paste 이벤트 오류:', err.message);
            if (resultDiv) {
                resultDiv.textContent = `✗ 붙여넣기 오류: ${err.message}`;
            }
        }
    }

    /**
     * 이미지 파일 찾기
     */
    function browseImagesForSync(): void {
        const utils = getUtils();
        const communication = getCommunication();
        const resultDiv = document.getElementById('sync-test-result');

        if (resultDiv) resultDiv.textContent = '이미지 선택 중...';

        // JSX에서 파일 선택 다이얼로그 열기
        const script = `
            var files = File.openDialog("이미지 파일 선택", "Image Files:*.png;*.jpg;*.jpeg;*.gif", true);
            if (files) {
                var result = [];
                if (files instanceof Array) {
                    for (var i = 0; i < files.length; i++) {
                        result.push(files[i].fsName);
                    }
                } else {
                    result.push(files.fsName);
                }
                JSON.stringify({ success: true, files: result });
            } else {
                JSON.stringify({ success: false, message: "취소됨" });
            }
        `;

        communication.callExtendScript(script, async (result: string) => {
            try {
                const data = JSON.parse(result);
                if (data.success && data.files) {
                    // 모든 이미지를 병렬로 추가 (빠름!)
                    const addPromises = data.files.map((filePath: string) => {
                        const fileName = filePath.split('\\').pop()?.split('/').pop() || 'image.png';
                        return addImageToQueue(filePath, fileName);
                    });
                    await Promise.all(addPromises);
                    if (resultDiv) resultDiv.textContent = `✓ ${data.files.length}개 이미지 추가됨`;
                } else {
                    if (resultDiv) resultDiv.textContent = '이미지 선택 취소됨';
                }
            } catch (e) {
                if (resultDiv) resultDiv.textContent = '✗ 이미지 선택 실패';
                utils.logError('Failed to browse images:', (e as Error).message);
            }
        });
    }

    /**
     * 이미지를 리사이즈하여 썸네일 생성 (성능 최적화)
     * @param source 이미지 파일 경로 또는 Base64 문자열
     * @param maxSize 최대 크기 (기본 160px)
     * @returns Base64 썸네일 또는 빈 문자열
     */
    function createThumbnail(source: string, maxSize: number = 160): Promise<string> {
        return new Promise<string>((resolve) => {
            try {
                let base64: string;

                // source가 파일 경로인지 Base64인지 판단
                if (source.includes(':') && (source.includes('\\') || source.includes('/'))) {
                    // 파일 경로
                    const fs = (window as any).require('fs');
                    const fileData = fs.readFileSync(source);
                    base64 = fileData.toString('base64');
                } else {
                    // 이미 Base64
                    base64 = source;
                }

                // 임시 Image 객체 생성
                const img = new Image();
                img.src = `data:image/png;base64,${base64}`;

                img.onload = () => {
                    // Canvas 생성
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(base64); // 실패 시 원본 반환
                        return;
                    }

                    // 비율 유지하며 리사이즈
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // 이미지 그리기
                    ctx.drawImage(img, 0, 0, width, height);

                    // Base64로 변환 (JPEG, 품질 80%)
                    const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                    resolve(resizedBase64);
                };

                img.onerror = () => {
                    resolve(base64); // 실패 시 원본 반환
                };
            } catch (e) {
                resolve(''); // 에러 시 빈 문자열
            }
        });
    }

    /**
     * 이미지를 큐에 추가
     */
    /**
     * 이미지를 큐에 추가 (썸네일 생성 포함)
     * @param filePath 저장된 파일 경로
     * @param fileName 파일명
     * @param thumbnailBase64 썸네일 Base64 (선택, 없으면 filePath에서 읽음)
     */
    async function addImageToQueue(filePath: string, fileName: string, thumbnailBase64?: string): Promise<void> {
        const utils = getUtils();

        // 고유 ID 생성
        const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // 썸네일 생성 (무조건 리사이즈하여 메모리 절약)
        let thumbnail = '';

        try {
            if (thumbnailBase64) {
                // Base64가 제공된 경우 리사이즈
                thumbnail = await createThumbnail(thumbnailBase64, 160);
            } else {
                // 파일 경로에서 리사이즈된 썸네일 생성
                thumbnail = await createThumbnail(filePath, 160);
            }
        } catch (e) {
            utils.logError(`썸네일 생성 실패: ${(e as Error).message}`);
            thumbnail = ''; // 실패 시 빈 문자열
        }

        // ImageMapping 생성
        const mapping: ImageMapping = {
            id: id,
            filePath: filePath,
            fileName: fileName,
            thumbnail: thumbnail,
            captionCount: 1,    // 기본값: 캡션 1개
            textLabel: undefined // 사용자가 직접 입력
        };

        imageMappings.push(mapping);
        utils.logInfo(`이미지 추가됨: ${fileName} (ID: ${id})`);

        // 텍스트 라벨 매칭
        updateImageTextLabels();

        // 그리드 재렌더링
        updateImageGrid();

        // 동기화 버튼 상태 업데이트
        const syncButton = document.getElementById('sync-caption-images') as HTMLButtonElement;
        if (syncButton) {
            syncButton.disabled = false;
        }
    }

    /**
     * 이미지 큐 비우기
     */
    function clearImageQueue(): void {
        const utils = getUtils();

        const imageCount = imageMappings.length;

        if (imageCount === 0) {
            utils.logInfo('Image queue is already empty');
            return;
        }

        // imageMappings 비우기
        imageMappings = [];

        // 큐 다시 렌더링
        renderImageQueue();

        utils.logInfo(`Image queue cleared: ${imageCount} images removed`);

        // 결과 메시지 표시
        const resultDiv = document.getElementById('sync-test-result');
        if (resultDiv) {
            resultDiv.textContent = `✓ ${imageCount}개 이미지 제거됨`;
        }
    }

    /**
     * 캡션-이미지 동기화 시작
     */
    async function startCaptionImageSync(): Promise<void> {
        const utils = getUtils();
        const communication = getCommunication();

        // 디버그 정보 수집 시작
        let debugInfo = "=== 캡션-이미지 동기화 디버그 ===\n";
        debugInfo += `시작 시간: ${new Date().toISOString()}\n`;

        // imageMappings 배열 사용 (DOM 대신)
        if (!imageMappings || imageMappings.length === 0) {
            utils.logWarn('이미지를 먼저 추가하세요');
            debugInfo += "ERROR: 이미지가 선택되지 않음\n";
            (window as any).lastDebugInfo = debugInfo;
            return;
        }

        const targetTrack = parseInt((document.getElementById('target-video-track') as HTMLSelectElement)?.value || '0');

        debugInfo += `대상 비디오 트랙: V${targetTrack + 1}\n`;
        debugInfo += `이미지 개수: ${imageMappings.length}\n\n`;

        utils.logInfo('Starting caption-image sync (selection-based):', { track: targetTrack });

        // 선택된 클립 기반으로 위치 정보 가져오기
        const scriptCall = 'getSelectedClipsForImageSync()';
        debugInfo += "위치 정보: 선택된 클립 기반\n";

        communication.callExtendScript(scriptCall, async (positionResult: string) => {
            try {
                debugInfo += `\nJSX 호출 결과: ${positionResult.substring(0, 100)}...\n`;

                const positionData = JSON.parse(positionResult);
                if (!positionData.success) {
                    utils.logError(`위치 정보 가져오기 실패: ${positionData.message}`);
                    debugInfo += `ERROR: ${positionData.message}\n`;
                    (window as any).lastDebugInfo = debugInfo;
                    return;
                }

                const positions = positionData.selectedItems || [];
                if (positions.length === 0) {
                    utils.logWarn('선택된 클립이 없습니다. C1 트랙의 캡션들을 먼저 선택하세요.');
                    debugInfo += "ERROR: 선택된 클립이 없음\n";
                    (window as any).lastDebugInfo = debugInfo;
                    return;
                }

                // 🎬 비디오 클립 검사 (자동 스킵)
                debugInfo += `\n=== 비디오 클립 검사 시작 ===\n`;

                // positions를 간단한 배열로 변환 [[start, end], [start, end], ...]
                const simplifiedPositions = positions.map((p: any) => [p.start, p.end]);
                const checkVideoScript = `checkCaptionsForVideos(${JSON.stringify(simplifiedPositions)}, ${targetTrack})`;

                debugInfo += `비디오 검사 스크립트: ${checkVideoScript.substring(0, 150)}...\n`;
                utils.logInfo('Checking for video clips in caption positions...');

                const videoCheckResult = await new Promise<any>((resolve) => {
                    communication.callExtendScript(checkVideoScript, (result: string) => {
                        debugInfo += `비디오 검사 JSX 응답: ${result.substring(0, 200)}...\n`;
                        try {
                            const parsed = JSON.parse(result);
                            resolve(parsed);
                        } catch (e) {
                            debugInfo += `비디오 검사 JSON 파싱 실패: ${(e as Error).message}\n`;
                            debugInfo += `원본 응답: ${result}\n`;
                            utils.logError('비디오 검사 실패:', (e as Error).message);
                            resolve({ success: false });
                        }
                    });
                });

                let hasVideoFlags: boolean[] = [];
                if (videoCheckResult.success) {
                    hasVideoFlags = videoCheckResult.hasVideo || [];
                    debugInfo += `비디오 검사 완료: ${hasVideoFlags.length}개 캡션 확인됨\n`;

                    const videoCount = hasVideoFlags.filter((v: boolean) => v).length;
                    debugInfo += `비디오 있는 캡션: ${videoCount}개\n`;
                    debugInfo += `비어있는 캡션: ${hasVideoFlags.length - videoCount}개\n`;
                } else {
                    // 검사 실패 시 모든 캡션을 비어있는 것으로 간주 (기존 동작)
                    debugInfo += `WARNING: 비디오 검사 실패, 모든 캡션을 비어있는 것으로 간주\n`;
                    hasVideoFlags = new Array(positions.length).fill(false);
                }

                // 이미지와 위치 매칭
                let successCount = 0;
                debugInfo += `\n총 위치: ${positions.length}개\n`;
                debugInfo += `루프 반복 횟수: ${imageMappings.length}번\n\n`;

                const syncDebugMsg = `총 이미지: ${imageMappings.length}, 총 위치: ${positions.length}`;
                utils.logInfo(syncDebugMsg);
                console.log(`[SYNC] ${syncDebugMsg}`);

                // 1단계: 모든 이미지-캡션 매핑 계산
                debugInfo += `\n=== 1단계: 이미지-캡션 매핑 계산 ===\n`;
                interface InsertTask {
                    imageIndex: number;
                    imagePath: string;
                    fileName: string;
                    assignedCaptions: number[];
                    startTime: number;
                    endTime: number;
                }
                const insertTasks: InsertTask[] = [];
                let currentCaptionIndex = 0;

                for (let i = 0; i < imageMappings.length; i++) {
                    const mapping = imageMappings[i];
                    debugInfo += `\n이미지 ${i+1}: ${mapping.fileName} (캡션 ${mapping.captionCount}개 필요)\n`;

                    // 비디오가 없는 캡션들을 찾아서 할당
                    const assignedCaptions: number[] = [];
                    let searchIndex = currentCaptionIndex;

                    while (assignedCaptions.length < mapping.captionCount && searchIndex < positions.length) {
                        if (!hasVideoFlags[searchIndex]) {
                            assignedCaptions.push(searchIndex);
                        } else {
                            debugInfo += `  캡션 ${searchIndex + 1} 스킵 (비디오 있음)\n`;
                        }
                        searchIndex++;
                    }

                    if (assignedCaptions.length === 0) {
                        debugInfo += `  ERROR: 남은 빈 캡션이 없음\n`;
                        utils.logWarn(`[${i}] 남은 빈 캡션이 없어 이미지를 삽입할 수 없습니다`);
                        break;
                    }

                    currentCaptionIndex = searchIndex;

                    const firstPositionIndex = assignedCaptions[0];
                    const lastPositionIndex = assignedCaptions[assignedCaptions.length - 1];
                    const firstPosition = positions[firstPositionIndex];
                    const lastPosition = positions[lastPositionIndex];

                    insertTasks.push({
                        imageIndex: i,
                        imagePath: mapping.filePath,
                        fileName: mapping.fileName,
                        assignedCaptions: assignedCaptions,
                        startTime: firstPosition.start,
                        endTime: lastPosition.end
                    });

                    debugInfo += `  → 할당: 캡션 ${assignedCaptions.map(idx => idx + 1).join(', ')}\n`;
                    debugInfo += `  → 시간: ${firstPosition.start}s ~ ${lastPosition.end}s\n`;
                }

                // 2단계: 순차 삽입 (앞→뒤)
                debugInfo += `\n=== 2단계: 순차 삽입 (총 ${insertTasks.length}개) ===\n`;
                debugInfo += `앞에서부터 순서대로 삽입합니다\n\n`;

                for (let i = 0; i < insertTasks.length; i++) {
                    const task = insertTasks[i];
                    debugInfo += `\n===== 삽입 ${i + 1}/${insertTasks.length} =====\n`;
                    debugInfo += `이미지: ${task.fileName}\n`;
                    debugInfo += `캡션: ${task.assignedCaptions.map(idx => idx + 1).join(', ')}\n`;
                    debugInfo += `시간: ${task.startTime}s ~ ${task.endTime}s (길이: ${(task.endTime - task.startTime).toFixed(2)}s)\n`;

                    // 백슬래시 이스케이프: ExtendScript에서 제대로 인식하도록 \를 \\로 변경
                    const escapedPath = task.imagePath.replace(/\\/g, '\\\\');

                    const insertScript = `insertImageAtTime("${escapedPath}", ${targetTrack}, ${task.startTime}, ${task.endTime})`;

                    debugInfo += `JSX 실행: ${insertScript.substring(0, 100)}...\n`;

                    await new Promise<void>((resolve) => {
                        communication.callExtendScript(insertScript, (insertResult: string) => {
                            debugInfo += `JSX 결과: ${insertResult.substring(0, 150)}...\n`;
                            try {
                                const result = JSON.parse(insertResult);
                                if (result.success) {
                                    successCount++;
                                    debugInfo += `✓ 성공! (총 ${successCount}개 삽입됨)\n`;
                                    utils.logInfo(`[${task.imageIndex}] ✓ 이미지 삽입 성공! (총 ${successCount}개)`);
                                } else {
                                    debugInfo += `✗ 실패: ${result.message}\n`;
                                    utils.logWarn(`[${task.imageIndex}] ✗ 이미지 삽입 실패: ${result.message}`);
                                }

                                // JSX의 디버그 로그 추가
                                if (result.debug) {
                                    debugInfo += "\n--- JSX 디버그 로그 ---\n";
                                    debugInfo += result.debug;
                                    debugInfo += "--- JSX 디버그 로그 끝 ---\n\n";
                                }
                            } catch (e) {
                                debugInfo += `✗ JSON 파싱 실패: ${(e as Error).message}\n`;
                                debugInfo += `원본 응답: ${insertResult}\n`;
                                utils.logError(`[${task.imageIndex}] JSON 파싱 실패:`, (e as Error).message);
                            }
                            resolve();
                        });
                    });
                }

                debugInfo += `\n===== 동기화 완료 =====\n`;
                debugInfo += `총 ${successCount}개 이미지 삽입됨\n`;
                debugInfo += `종료 시간: ${new Date().toISOString()}\n`;

                utils.logInfo(`Caption-image sync completed: ${successCount} images inserted`);

                // 디버그 정보 저장
                (window as any).lastDebugInfo = debugInfo;

            } catch (e) {
                debugInfo += `\nERROR: ${(e as Error).message}\n`;
                debugInfo += `Stack: ${(e as Error).stack}\n`;
                (window as any).lastDebugInfo = debugInfo;

                utils.logError('Failed to sync caption-images:', (e as Error).message);
            }
        });
    }

    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        const dependencies: string[] = [];

        // DIHelpers 상태 확인
        if (DIHelpers) {
            dependencies.push('DIHelpers (Available)');
        } else {
            dependencies.push('DIHelpers (Not loaded)');
        }

        // 서비스 availability 체크
        if ((window as any).JSCUtils)
            dependencies.push('JSCUtils (Available)');
        else
            dependencies.push('JSCUtils (Missing)');

        if ((window as any).JSCUIManager)
            dependencies.push('JSCUIManager (Available)');
        else
            dependencies.push('JSCUIManager (Missing)');

        if ((window as any).JSCStateManager)
            dependencies.push('JSCStateManager (Available)');
        else
            dependencies.push('JSCStateManager (Missing)');

        if ((window as any).JSCCommunication)
            dependencies.push('JSCCommunication (Available)');
        else
            dependencies.push('JSCCommunication (Missing)');


        if ((window as any).SoundEngine)
            dependencies.push('SoundEngine (Available)');
        else
            dependencies.push('SoundEngine (Missing)');

        return {
            isDIAvailable: !!DIHelpers,
            containerInfo: DIHelpers ? 'DIHelpers active' : 'Fallback mode',
            dependencies: dependencies
        };
    }

    /**
     * 비디오 목업 생성
     */
    function createVideoPlaceholder(rowIndex: number): void {
        const utils = getUtils();

        // 플레이스홀더 데이터 생성
        const placeholder: ImageMapping = {
            id: 'placeholder-' + Date.now(),
            filePath: '',
            fileName: '비디오 구간',
            thumbnail: '',
            captionCount: 1,
            isPlaceholder: true,
            textLabel: textList[rowIndex] || ''
        };

        // 해당 위치에 플레이스홀더 삽입
        imageMappings.splice(rowIndex, 0, placeholder);

        utils.logInfo(`비디오 목업 생성: 텍스트 행 ${rowIndex + 1}`);

        // UI 업데이트
        renderTextRows();
        updateImageGrid();
    }

    /**
     * 비디오 목업 제거
     */
    function removeVideoPlaceholder(rowIndex: number): void {
        const utils = getUtils();

        if (rowIndex >= imageMappings.length) return;
        if (!imageMappings[rowIndex]?.isPlaceholder) return;

        // 플레이스홀더 제거
        imageMappings.splice(rowIndex, 1);

        utils.logInfo(`비디오 목업 제거: 텍스트 행 ${rowIndex + 1}`);

        // UI 업데이트
        renderTextRows();
        updateImageGrid();
    }

    // 공개 API
    return {
        setupEventListeners: setupEventListeners,
        handleSoundFileButtonClick: handleSoundFileButtonClick,
        refreshSoundButtons: refreshSoundButtons, // 자동 새로고침을 위해 공개
        getDIStatus: getDIStatus, // DI 패턴 적용
        closeTextReplaceModal: closeTextReplaceModal, // 텍스트 교체 모달
        executeTextReplace: executeTextReplace // 텍스트 교체 실행
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCEventManager = JSCEventManager;
}