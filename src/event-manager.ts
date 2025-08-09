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
    
    // DI 컨테이너에서 의존성 가져오기 (옵션)
    let diContainer: any = null;
    let utilsService: any = null;
    let uiService: any = null;
    let stateService: any = null;
    let communicationService: any = null;
    let soundEngineService: any = null;
    let clipCalculatorService: any = null;
    
    function initializeDIDependencies() {
        try {
            diContainer = (window as any).DI;
            if (diContainer) {
                // DI에서 서비스 가져오기 시도
                utilsService = diContainer.getSafe('JSCUtils');
                uiService = diContainer.getSafe('JSCUIManager');
                stateService = diContainer.getSafe('JSCStateManager');
                communicationService = diContainer.getSafe('JSCCommunication');
                soundEngineService = diContainer.getSafe('SoundEngine');
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
        setTimeout(() => {
            if (!utilsService || !uiService || !stateService || !communicationService || !soundEngineService || !clipCalculatorService) {
                initializeDIDependencies();
            }
        }, 100);
    }
    
    // 서비스 가져오기 헬퍼 함수들 (DI 우선, 레거시 fallback)
    function getUtils() {
        return utilsService || (window as any).JSCUtils || {
            debugLog: (msg: string) => { console.log('[DEBUG]', msg); },
            logInfo: (msg: string) => { console.info('[INFO]', msg); },
            isValidPath: (path: string) => { return !!path; },
            getShortPath: (path: string) => { return path; },
            safeJSONParse: (str: string) => { 
                try { return JSON.parse(str); } catch(e) { return null; } 
            },
            CONFIG: { DEBUG_MODE: false }
        };
    }
    
    function getUIManager() {
        return uiService || (window as any).JSCUIManager || {
            updateStatus: (msg: string, _success?: boolean) => { console.log('Status:', msg); },
            displaySoundList: (_files: any[]) => { console.log('Display sound list'); },
            resetDebugUI: () => { console.log('Reset debug UI'); },
            updateSoundButtons: (_files: any[], _path?: string) => { console.log('Update sound buttons'); },
            showDebugInfo: () => { console.log('Show debug info'); },
            toggleDebugButton: (_show: boolean) => { console.log('Toggle debug button'); },
            updateMagnetStatus: (_success: boolean, _moved?: number, _removed?: number) => { 
                console.log('Update magnet status'); 
            }
        };
    }
    
    function getStateManager() {
        return stateService || (window as any).JSCStateManager || {
            saveFolderPath: (_path: string) => { console.log('Save folder path'); },
            getCurrentFolderPath: () => { return ''; },
            clearFolderPath: () => { console.log('Clear folder path'); },
            validateState: () => { return { isValid: true, errors: [] }; },
            getSettings: () => { return { folderPath: '', audioTrack: 1 }; }
        };
    }
    
    function getCommunication() {
        return communicationService || (window as any).JSCCommunication || {
            callExtendScript: (_script: string, callback: (result: string) => void) => { 
                callback('error: Communication service not available'); 
            }
        };
    }
    
    function getSoundEngine() {
        return soundEngineService || (window as any).SoundEngine || {
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
        try {
            console.log('Setting up event listeners...');
            setupInsertSoundsButton();
            setupBrowseFolderButton();
            setupRefreshButton();
            setupMagnetButton();
            setupFolderInput();
            setupDebugUI();
            console.log('Event listeners setup completed');
        } catch (e) {
            console.error('Event listeners setup failed:', (e as Error).message);
        }
    }
    
    // 효과음 삽입 버튼 이벤트
    function setupInsertSoundsButton(): void {
        const insertButton = document.getElementById("insert-sounds");
        if (insertButton) {
            insertButton.addEventListener("click", insertSounds);
            console.log("Event listener added to insert-sounds button");
        } else {
            console.warn("Button with ID 'insert-sounds' not found.");
        }
    }
    
    // 폴더 찾기 버튼 이벤트
    function setupBrowseFolderButton(): void {
        const browseButton = document.getElementById("browseFolder");
        if (browseButton) {
            browseButton.addEventListener("click", browseSoundFolder);
            const utils = getUtils();
            utils.debugLog("Event listener added to browseFolder button");
        } else {
            console.error("Button with ID 'browseFolder' not found.");
        }
    }
    
    // 새로고침 버튼 이벤트
    function setupRefreshButton(): void {
        const refreshButton = document.getElementById("refreshSounds");
        if (refreshButton) {
            refreshButton.addEventListener("click", refreshSoundButtons);
            const utils = getUtils();
            utils.debugLog("Event listener added to refreshSounds button");
        } else {
            console.error("Button with ID 'refreshSounds' not found.");
        }
    }
    
    // 마그넷 버튼 이벤트
    function setupMagnetButton(): void {
        const magnetButton = document.getElementById("magnetClips");
        if (magnetButton) {
            magnetButton.addEventListener("click", magnetClips);
            const utils = getUtils();
            utils.debugLog("Event listener added to magnetClips button");
        } else {
            console.error("Button with ID 'magnetClips' not found.");
        }
    }
    
    // 폴더 입력 필드 이벤트
    function setupFolderInput(): void {
        const folderInput = document.getElementById("sound-folder") as HTMLInputElement;
        if (folderInput) {
            folderInput.addEventListener("change", function(this: HTMLInputElement) {
                const inputPath = this.value.trim();
                const utils = getUtils();
                const stateManager = getStateManager();
                
                utils.debugLog("Folder input changed: " + inputPath);
                
                if (inputPath && utils.isValidPath(inputPath)) {
                    stateManager.saveFolderPath(inputPath);
                    console.log("Valid path stored: " + inputPath);
                } else {
                    if (inputPath) {
                        console.warn("Invalid path entered: " + inputPath);
                        const uiManager = getUIManager();
                        uiManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        this.value = stateManager.getCurrentFolderPath(); // 이전 유효한 경로로 복원
                    } else {
                        stateManager.clearFolderPath();
                        console.log("Path cleared");
                    }
                }
            });
            const utils = getUtils();
            utils.debugLog("Event listener added to sound-folder input");
        } else {
            console.error("Input with ID 'sound-folder' not found.");
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
            if (!soundEngine || (!soundEngineService && !(window as any).SoundEngine)) {
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
            debugInfo += `ClipTimeCalculator: ${(clipCalculatorService || (window as any).ClipTimeCalculator) ? "✅" : "❌"}\n`;
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
        let debugInfo = "=== 효과음 삽입 디버그 ===\n";
        debugInfo += `시작 시간: ${new Date().toISOString()}\n`;
        
        try {
            debugInfo += "1. JSCStateManager 확인...\n";
            const stateManager = getStateManager();
            if (!stateManager) {
                debugInfo += "❌ JSCStateManager 없음\n";
                console.error('JSCStateManager not available');
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
                console.error('SoundEngine not available');
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
            console.error("Sound insertion failed:", (e as Error).message);
            const uiManager = getUIManager();
            uiManager.updateStatus("효과음 삽입 중 오류가 발생했습니다.", false);
        }
        
        // 디버그 정보 항상 표시
        (window as any).lastDebugInfo = debugInfo;
        // window.JSCUIManager.toggleDebugButton(true); // 항상 표시되므로 필요없음
    }
    
    // 폴더 찾기 처리
    function browseSoundFolder(): void {
        const communication = getCommunication();
        if (communication) {
            communication.callExtendScript("browseSoundFolder()", function(result: string) {
                console.log("Browse folder result: " + result);
                
                const utils = getUtils();
                const stateManager = getStateManager();
                const uiManager = getUIManager();
                
                if (result && result !== "undefined" && result !== "" && 
                    utils && utils.isValidPath(result)) {
                    if (stateManager) {
                        stateManager.saveFolderPath(result);
                        console.log("Valid path set: " + result);
                        
                        // 폴더 선택 성공 후 자동으로 효과음 라이브러리 새로고침
                        if (uiManager) {
                            uiManager.updateStatus("폴더가 설정되었습니다. 효과음 목록을 불러오는 중...", true);
                        }
                        // 잠시 후 새로고침 실행 (UI 업데이트 완료 후)
                        setTimeout(() => {
                            refreshSoundButtons();
                        }, 100);
                    }
                } else {
                    if (result && result !== "undefined" && result !== "") {
                        console.warn("Invalid path received from ExtendScript: " + result);
                        if (uiManager) {
                            uiManager.updateStatus("올바른 폴더를 선택해주세요.", false);
                        }
                    } else {
                        console.log("No folder selected or empty result");
                    }
                }
            });
        }
    }
    
    // 새로고침 처리
    function refreshSoundButtons(): void {
        const stateManager = getStateManager();
        const utils = getUtils();
        const uiManager = getUIManager();
        const communication = getCommunication();
        
        const currentPath = stateManager.getCurrentFolderPath();
        utils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);
        
        if (currentPath && utils.isValidPath(currentPath)) {
            uiManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
            uiManager.updateStatus(
                "'" + utils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...",
                true
            );
            
            const pathArg = JSON.stringify(currentPath);
            utils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg);
            
            communication.callExtendScript(
                "getFilesForPathCS(" + pathArg + ")",
                function(result: string) {
                    utils.debugLog("refreshSoundButtons: evalScript callback result: " + result);
                    
                    // 디버그 정보 생성
                    let debugInfo = "=== Refresh Sound Buttons Debug ===\n";
                    debugInfo += "시간: " + new Date().toISOString() + "\n";
                    debugInfo += "폴더 경로: " + currentPath + "\n";
                    debugInfo += "JSX 결과: " + result + "\n";
                    debugInfo += "결과 타입: " + typeof result + "\n";
                    
                    if (typeof result === "string" && result.indexOf("error:") === 0) {
                        debugInfo += "오류 발생: " + result.substring(6) + "\n";
                        uiManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다: " + result.substring(6), false);
                    } else if (result === "success") {
                        debugInfo += "성공적으로 완료됨\n";
                        debugInfo += "콜백 방식으로 파일 목록 가져오기 시도...\n";
                        
                        // 콜백 방식으로 직접 파일 목록 가져오기
                        communication.callExtendScript("getFilesForPathWithCallback(" + pathArg + ")", function(callbackResult: string) {
                            debugInfo += "콜백 결과: " + callbackResult + "\n";
                            
                            try {
                                const parsedResult = utils.safeJSONParse(callbackResult);
                                if (parsedResult && parsedResult.success && parsedResult.soundFiles) {
                                    debugInfo += "파일 " + parsedResult.soundFiles.length + "개 발견\n";
                                    uiManager.updateSoundButtons(parsedResult.soundFiles, parsedResult.folderPath);
                                    uiManager.updateStatus("폴더 새로고침이 완료되었습니다. " + parsedResult.soundFiles.length + "개 파일 발견.", true);
                                } else {
                                    debugInfo += "파일 목록 처리 실패\n";
                                    uiManager.updateStatus("파일 목록을 가져올 수 없습니다.", false);
                                }
                            } catch (parseError) {
                                debugInfo += "JSON 파싱 오류: " + (parseError as Error).message + "\n";
                                uiManager.updateStatus("파일 목록 데이터 처리 중 오류가 발생했습니다.", false);
                            }
                            
                            (window as any).lastDebugInfo = debugInfo;
                            uiManager.toggleDebugButton(true);
                        });
                    } else {
                        debugInfo += "예상치 못한 결과: " + result + "\n";
                        uiManager.updateStatus("폴더 새로고침 결과를 처리하는 중입니다...", true);
                    }
                    
                    // 디버그 정보 저장
                    (window as any).lastDebugInfo = debugInfo;
                    uiManager.toggleDebugButton(true);
                }
            );
        } else {
            if (currentPath && !utils.isValidPath(currentPath)) {
                console.warn("currentFolderPath is invalid, clearing it: " + currentPath);
                stateManager.clearFolderPath();
                uiManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
            } else {
                console.warn("currentFolderPath is empty or invalid. Aborting refresh.");
                uiManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
            }
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
                console.error('SoundEngine not available');
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
            console.error("Magnet clips failed:", (e as Error).message);
            const uiManager = getUIManager();
            const utils = getUtils();
            uiManager.updateStatus("클립 자동 정렬 중 오류가 발생했습니다.", false);
            uiManager.updateMagnetStatus(false);
            
            // 에러 정보를 디버그로 표시
            if (utils.CONFIG.DEBUG_MODE) {
                (window as any).lastDebugInfo = `Error: ${(e as Error).message}\nStack: ${(e as Error).stack}`;
                uiManager.toggleDebugButton(true);
            }
        }
    }
    
    // 개별 효과음 버튼 클릭 처리
    function handleSoundFileButtonClick(event: Event): void {
        const target = event.target as HTMLElement;
        const soundFsName = target.getAttribute("data-fsname");
        const soundDisplayName = target.textContent;

        if (soundFsName) {
            console.log("Replacing with sound file: " + soundFsName);
            const uiManager = getUIManager();
            const communication = getCommunication();
            const utils = getUtils();
            
            if (uiManager) {
                uiManager.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);
            }
            
            if (communication) {
                // 단계별 테스트: 가장 간단한 함수부터 시작
                console.log("Testing simplest ExtendScript function first...");
                communication.callExtendScript("simpleTest()", function(simpleResult: string) {
                    console.log("Simple test result: " + simpleResult);
                    
                    let debugInfo = "=== Sound File Button Click Debug ===\n";
                    debugInfo += "시간: " + new Date().toISOString() + "\n";
                    debugInfo += "파일 경로: " + soundFsName + "\n";
                    debugInfo += "파일명: " + soundDisplayName + "\n";
                    debugInfo += "\n--- 단순 테스트 결과 ---\n";
                    debugInfo += "simpleTest(): " + simpleResult + "\n";
                    
                    if (simpleResult === "HELLO_FROM_EXTENDSCRIPT") {
                        debugInfo += "✓ ExtendScript 기본 실행 성공\n";
                        
                        // 다음 단계: 중복 임포트 테스트
                        communication.callExtendScript("testDuplicateImport(" + JSON.stringify(soundFsName) + ")", function(duplicateResult: string) {
                            debugInfo += "\n--- 중복 임포트 테스트 결과 ---\n";
                            debugInfo += duplicateResult + "\n";
                            
                            // 기본 정보 테스트 (JSON 없이)
                            communication.callExtendScript("basicInfo()", function(basicResult: string) {
                                debugInfo += "\n--- 기본 정보 테스트 결과 ---\n";
                                debugInfo += "basicInfo(): " + basicResult + "\n";
                                
                                if (basicResult && basicResult.indexOf("ERROR:") !== 0) {
                                    debugInfo += "✓ 기본 정보 수집 성공\n";
                                    
                                    // 마지막 단계: 실제 클립 교체 시도
                                    debugInfo += "\n환경 테스트 통과, 클립 교체 시도...\n";
                                    communication.callExtendScript(
                                        "replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")",
                                        function(result: string) {
                                        console.log("replaceSelectedAudioClips call result: " + result);
                                        
                                        debugInfo += "\n--- 클립 교체 결과 ---\n";
                                        debugInfo += "원본 결과: " + result + "\n";
                                        
                                        // JSON 파싱 시도
                                        try {
                                            const parsedResult = utils.safeJSONParse(result);
                                            debugInfo += "JSON 파싱: SUCCESS\n";
                                            
                                            if (parsedResult) {
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
                                            }
                                        } catch (parseError) {
                                            debugInfo += "JSON 파싱 실패: " + (parseError as Error).message + "\n";
                                            
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
                                            
                                            // 효과음 삽입 완료 후 타임라인으로 포커스 이동
                                            setTimeout(() => {
                                                try {
                                                    let focusDebug = "\n--- 포커스 디버그 정보 ---\n";
                                                    
                                                    const currentElement = document.activeElement;
                                                    focusDebug += "시작 - 현재 활성 요소: " + (currentElement ? (currentElement.tagName + (currentElement.id ? "#" + currentElement.id : "") + (currentElement.textContent ? " (" + currentElement.textContent.substring(0, 20) + ")" : "")) : "없음") + "\n";
                                                    
                                                    // CEP 패널에서 포커스 제거
                                                    if (document.activeElement && (document.activeElement as HTMLElement).blur) {
                                                        (document.activeElement as HTMLElement).blur();
                                                        focusDebug += "현재 요소 blur 완료\n";
                                                    }
                                                    
                                                    // 패널의 포커스를 완전히 제거 시도
                                                    const bodyElement = document.body;
                                                    if (bodyElement) {
                                                        bodyElement.focus();
                                                        bodyElement.blur();
                                                        
                                                        // 추가: 모든 포커스 가능한 요소들을 blur
                                                        const focusableElements = document.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                                                        focusableElements.forEach(el => {
                                                            try {
                                                                (el as HTMLElement).blur();
                                                            } catch(e) { /* ignore */ }
                                                        });
                                                        
                                                        // 최종적으로 document에서 activeElement 제거 시도
                                                        try {
                                                            if (document.activeElement && (document.activeElement as HTMLElement).blur) {
                                                                (document.activeElement as HTMLElement).blur();
                                                            }
                                                            // 강제로 포커스를 제거하기 위해 임시 요소 생성 후 제거
                                                            const tempInput = document.createElement('input');
                                                            tempInput.style.position = 'absolute';
                                                            tempInput.style.left = '-9999px';
                                                            tempInput.style.opacity = '0';
                                                            document.body.appendChild(tempInput);
                                                            tempInput.focus();
                                                            tempInput.blur();
                                                            document.body.removeChild(tempInput);
                                                        } catch(e) { /* ignore */ }
                                                        
                                                        focusDebug += "완전한 포커스 제거 시도 완료\n";
                                                    }
                                                    
                                                    const finalElement = document.activeElement;
                                                    focusDebug += "blur 후 - 최종 활성 요소: " + (finalElement ? (finalElement.tagName + (finalElement.id ? "#" + finalElement.id : "") + (finalElement.textContent ? " (" + finalElement.textContent.substring(0, 20) + ")" : "")) : "없음") + "\n";
                                                    
                                                    // UI에 포커스 정보 표시
                                                    uiManager.updateStatus("효과음 삽입 완료 - 포커스 상태 확인", true);
                                                    
                                                    // Adobe 앱으로 포커스 이동 (타임라인 활성화)
                                                    const communication = getCommunication();
                                                    if (communication) {
                                                        // ExtendScript로 타임라인 포커스 명령 전송
                                                        communication.callExtendScript("focusTimeline();", function(focusResult: string) {
                                                            focusDebug += "타임라인 포커스 이동 결과: " + focusResult + "\n";
                                                            
                                                            // 최종 결과를 UI에 표시
                                                            const veryFinalElement = document.activeElement;
                                                            focusDebug += "최종 - 활성 요소: " + (veryFinalElement ? (veryFinalElement.tagName + (veryFinalElement.id ? "#" + veryFinalElement.id : "")) : "없음") + "\n";
                                                            
                                                            // 디버그 정보에 포커스 정보 추가
                                                            (window as any).lastDebugInfo = ((window as any).lastDebugInfo || "") + focusDebug;
                                                            
                                                            console.log("포커스 디버그:", focusDebug);
                                                        });
                                                    } else {
                                                        focusDebug += "Communication 객체 없음\n";
                                                        (window as any).lastDebugInfo = ((window as any).lastDebugInfo || "") + focusDebug;
                                                        console.log("포커스 디버그:", focusDebug);
                                                    }
                                                    
                                                } catch (focusError) {
                                                    const errorMsg = "포커스 이동 중 오류: " + focusError;
                                                    uiManager.updateStatus(errorMsg, false);
                                                    console.log(errorMsg);
                                                }
                                            }, 100); // 100ms 후 실행
                                        }
                                    );
                                } else {
                                    debugInfo += "✗ 기본 정보 수집 실패: " + basicResult + "\n";
                                    uiManager.updateStatus("ExtendScript 기본 정보 수집 실패", false);
                                    (window as any).lastDebugInfo = debugInfo;
                                    uiManager.toggleDebugButton(true);
                                }
                            });
                        });
                    } else {
                        debugInfo += "✗ ExtendScript 기본 실행 실패: " + simpleResult + "\n";
                        uiManager.updateStatus("ExtendScript 실행 환경에 문제가 있습니다", false);
                        (window as any).lastDebugInfo = debugInfo;
                        uiManager.toggleDebugButton(true);
                    }
                });
            }
        } else {
            console.error("Sound file path (fsName) not found on button.");
            const uiManager = getUIManager();
            if (uiManager) {
                uiManager.updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
            }
        }
    }
    
    // DI 상태 확인 함수 (디버깅용)
    function getDIStatus() {
        const dependencies: string[] = [];
        if (utilsService) 
            dependencies.push('JSCUtils (DI)');
        else if ((window as any).JSCUtils)
            dependencies.push('JSCUtils (Legacy)');
        
        if (uiService)
            dependencies.push('JSCUIManager (DI)');  
        else if ((window as any).JSCUIManager)
            dependencies.push('JSCUIManager (Legacy)');
            
        if (stateService)
            dependencies.push('JSCStateManager (DI)');
        else if ((window as any).JSCStateManager)
            dependencies.push('JSCStateManager (Legacy)');
            
        if (communicationService)
            dependencies.push('JSCCommunication (DI)');
        else if ((window as any).JSCCommunication)
            dependencies.push('JSCCommunication (Legacy)');
            
        if (soundEngineService)
            dependencies.push('SoundEngine (DI)');
        else if ((window as any).SoundEngine)
            dependencies.push('SoundEngine (Legacy)');
            
        return {
            isDIAvailable: !!diContainer,
            containerInfo: diContainer ? 'DI Container active' : 'Legacy mode',
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