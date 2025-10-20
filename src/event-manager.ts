/**
 * JSCEditHelper - Event Manager
 * 사용자 이벤트 처리를 담당하는 모듈
 */

interface JSCEventManagerInterface {
    setupEventListeners(): void;
    handleSoundFileButtonClick(event: Event): void;
    refreshSoundButtons(): void; // 자동 새로고침을 위해 공개
    getDIStatus(): any; // DI 패턴 적용
}

const JSCEventManager = (function(): JSCEventManagerInterface {
    'use strict';

    // DIHelpers 사용 - 반복 코드 제거!
    // di-helpers.ts에서 제공하는 공통 헬퍼 사용
    const DIHelpers = (window as any).DIHelpers;

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
            executeMagnetClips: () => {
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

                utils.debugLog("Folder input changed: " + inputPath);

                if (inputPath && utils.isValidPath(inputPath)) {
                    stateManager.saveFolderPath(inputPath);
                    utils.logDebug("Valid path stored: " + inputPath);
                } else {
                    if (inputPath) {
                        utils.logWarn("Invalid path entered: " + inputPath);
                        const uiManager = getUIManager();
                        uiManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        this.value = stateManager.getCurrentFolderPath(); // 이전 유효한 경로로 복원
                    } else {
                        stateManager.clearFolderPath();
                        utils.logDebug("Path cleared");
                    }
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
            
            // UI 상태 업데이트
            uiManager.updateStatus("클립 자동 정렬 중...", true);
            uiManager.resetDebugUI();
            
            const magnetStatus = document.getElementById("magnetStatus");
            if (magnetStatus) {
                magnetStatus.textContent = "처리 중...";
                magnetStatus.style.color = "#007acc";
            }
            
            // SoundEngine으로 마그넷 기능 실행
            const result = await soundEngine.executeMagnetClips();
            
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

    // 공개 API
    return {
        setupEventListeners: setupEventListeners,
        handleSoundFileButtonClick: handleSoundFileButtonClick,
        refreshSoundButtons: refreshSoundButtons, // 자동 새로고침을 위해 공개
        getDIStatus: getDIStatus // DI 패턴 적용
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCEventManager = JSCEventManager;
}