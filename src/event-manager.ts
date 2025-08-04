/**
 * JSCEditHelper - Event Manager
 * 사용자 이벤트 처리를 담당하는 모듈
 */

interface JSCEventManagerInterface {
    setupEventListeners(): void;
    handleSoundFileButtonClick(event: Event): void;
}

const JSCEventManager = (function(): JSCEventManagerInterface {
    'use strict';
    
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
            window.JSCUtils.debugLog("Event listener added to browseFolder button");
        } else {
            console.error("Button with ID 'browseFolder' not found.");
        }
    }
    
    // 새로고침 버튼 이벤트
    function setupRefreshButton(): void {
        const refreshButton = document.getElementById("refreshSounds");
        if (refreshButton) {
            refreshButton.addEventListener("click", refreshSoundButtons);
            window.JSCUtils.debugLog("Event listener added to refreshSounds button");
        } else {
            console.error("Button with ID 'refreshSounds' not found.");
        }
    }
    
    // 마그넷 버튼 이벤트
    function setupMagnetButton(): void {
        const magnetButton = document.getElementById("magnetClips");
        if (magnetButton) {
            magnetButton.addEventListener("click", magnetClips);
            window.JSCUtils.debugLog("Event listener added to magnetClips button");
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
                window.JSCUtils.debugLog("Folder input changed: " + inputPath);
                
                if (inputPath && window.JSCUtils && window.JSCUtils.isValidPath(inputPath)) {
                    if (window.JSCStateManager) {
                        window.JSCStateManager.saveFolderPath(inputPath);
                        console.log("Valid path stored: " + inputPath);
                    }
                } else {
                    if (inputPath) {
                        console.warn("Invalid path entered: " + inputPath);
                        if (window.JSCUIManager) {
                            window.JSCUIManager.updateStatus("입력된 폴더 경로가 유효하지 않습니다.", false);
                        }
                        if (window.JSCStateManager) {
                            this.value = window.JSCStateManager.getCurrentFolderPath(); // 이전 유효한 경로로 복원
                        }
                    } else {
                        if (window.JSCStateManager) {
                            window.JSCStateManager.clearFolderPath();
                        }
                        console.log("Path cleared");
                    }
                }
            });
            window.JSCUtils.debugLog("Event listener added to sound-folder input");
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
                window.JSCUIManager.showDebugInfo();
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
            if (!window.SoundEngine) {
                debugInfo += "❌ SoundEngine이 로드되지 않았습니다\n";
                window.JSCUIManager.updateStatus("SoundEngine이 로드되지 않았습니다", false);
                window.lastDebugInfo = debugInfo;
                window.JSCUIManager.toggleDebugButton(true);
                return;
            }
            debugInfo += "✅ SoundEngine 로드됨\n";
            
            // 2. SoundEngine 상태 확인
            const engineStatus = window.SoundEngine.getEngineStatus();
            debugInfo += `엔진 상태: ${engineStatus.isReady ? "준비완료" : "준비안됨"}\n`;
            if (!engineStatus.isReady) {
                debugInfo += `누락 의존성: ${engineStatus.dependencies.join(', ')}\n`;
            }
            
            // 3. 기본 모듈들 확인
            debugInfo += `JSCStateManager: ${window.JSCStateManager ? "✅" : "❌"}\n`;
            debugInfo += `ClipTimeCalculator: ${window.ClipTimeCalculator ? "✅" : "❌"}\n`;
            debugInfo += `JSCCommunication: ${window.JSCCommunication ? "✅" : "❌"}\n`;
            
            // 4. 상태 검증
            if (window.JSCStateManager) {
                const validation = window.JSCStateManager.validateState();
                debugInfo += `상태 유효성: ${validation.isValid ? "✅" : "❌"}\n`;
                if (!validation.isValid) {
                    debugInfo += `오류: ${validation.errors.join(', ')}\n`;
                }
                
                const settings = window.JSCStateManager.getSettings();
                debugInfo += `폴더 경로: ${settings.folderPath || "설정되지 않음"}\n`;
                debugInfo += `오디오 트랙: ${settings.audioTrack}\n`;
            }
            
            window.JSCUIManager.updateStatus("SoundEngine 테스트 완료", true);
            
        } catch (error) {
            debugInfo += `❌ 테스트 중 오류: ${(error as Error).message}\n`;
            window.JSCUIManager.updateStatus("SoundEngine 테스트 실패", false);
        }
        
        window.lastDebugInfo = debugInfo;
        window.JSCUIManager.toggleDebugButton(true);
    }
    
    // 효과음 삽입 처리 (새로운 SoundEngine 사용)
    async function insertSounds(): Promise<void> {
        let debugInfo = "=== 효과음 삽입 디버그 ===\n";
        debugInfo += `시작 시간: ${new Date().toISOString()}\n`;
        
        try {
            debugInfo += "1. JSCStateManager 확인...\n";
            if (!window.JSCStateManager) {
                debugInfo += "❌ JSCStateManager 없음\n";
                console.error('JSCStateManager not available');
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ JSCStateManager 정상\n";
            
            debugInfo += "2. SoundEngine 확인...\n";
            // Check if SoundEngine is available
            if (!(window as any).SoundEngine) {
                debugInfo += "❌ SoundEngine 모듈 없음\n";
                window.JSCUIManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                console.error('SoundEngine not available');
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ SoundEngine 정상\n";
            
            debugInfo += "3. SoundEngine 상태 확인...\n";
            // 엔진 상태 확인
            const engineStatus = (window as any).SoundEngine.getEngineStatus();
            debugInfo += `엔진 준비 상태: ${engineStatus.isReady}\n`;
            if (!engineStatus.isReady) {
                debugInfo += `❌ 누락 의존성: ${engineStatus.dependencies.join(', ')}\n`;
                window.JSCUIManager.updateStatus(
                    `필요한 모듈이 로드되지 않았습니다: ${engineStatus.dependencies.join(', ')}`, 
                    false
                );
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ 엔진 상태 정상\n";
            
            debugInfo += "4. 상태 검증...\n";
            // 상태 검증
            const validation = window.JSCStateManager.validateState();
            debugInfo += `상태 유효성: ${validation.isValid}\n`;
            if (!validation.isValid) {
                debugInfo += `❌ 검증 오류: ${validation.errors.join(', ')}\n`;
                window.JSCUIManager.updateStatus(validation.errors[0], false);
                (window as any).lastDebugInfo = debugInfo;
                return;
            }
            debugInfo += "✅ 상태 검증 통과\n";
            
            const settings = window.JSCStateManager.getSettings();
            debugInfo += `설정 - 폴더: ${settings.folderPath}\n`;
            debugInfo += `설정 - 오디오 트랙: ${settings.audioTrack}\n`;
            
            debugInfo += "5. UI 상태 업데이트...\n";
            // UI 상태 업데이트
            window.JSCUIManager.updateStatus("효과음 삽입 중...", true);
            window.JSCUIManager.displaySoundList([]);
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
            const result = await (window as any).SoundEngine.executeSoundInsertion(engineConfig);
            
            debugInfo += "8. 결과 처리...\n";
            debugInfo += `결과 성공: ${result.success}\n`;
            debugInfo += `결과 메시지: ${result.message}\n`;
            if (result.data) {
                debugInfo += `결과 데이터: ${JSON.stringify(result.data)}\n`;
            }
            
            // 결과 처리
            if (result.success) {
                window.JSCUIManager.updateStatus(result.message, true);
                
                // 삽입된 효과음 목록 표시 (있다면)
                if (result.data && result.data.files) {
                    const fileNames = Array.isArray(result.data.files) 
                        ? result.data.files.map((f: any) => typeof f === 'string' ? f : f.name)
                        : [];
                    window.JSCUIManager.displaySoundList(fileNames);
                    debugInfo += `표시된 파일 목록: ${fileNames.length}개\n`;
                }
            } else {
                window.JSCUIManager.updateStatus(result.message, false);
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
                window.JSCUtils.logInfo(`효과음 삽입 완료 - 소요 시간: ${result.executionTime.toFixed(2)}ms`);
            }
            
            debugInfo += "✅ insertSounds() 함수 완료\n";
            
        } catch (e) {
            debugInfo += `❌ 예외 발생: ${(e as Error).message}\n`;
            debugInfo += `스택 추적:\n${(e as Error).stack}\n`;
            console.error("Sound insertion failed:", (e as Error).message);
            window.JSCUIManager.updateStatus("효과음 삽입 중 오류가 발생했습니다.", false);
        }
        
        // 디버그 정보 항상 표시
        (window as any).lastDebugInfo = debugInfo;
        // window.JSCUIManager.toggleDebugButton(true); // 항상 표시되므로 필요없음
    }
    
    // 폴더 찾기 처리
    function browseSoundFolder(): void {
        if (window.JSCCommunication) {
            window.JSCCommunication.callExtendScript("browseSoundFolder()", function(result: string) {
                console.log("Browse folder result: " + result);
                
                if (result && result !== "undefined" && result !== "" && 
                    window.JSCUtils && window.JSCUtils.isValidPath(result)) {
                    if (window.JSCStateManager) {
                        window.JSCStateManager.saveFolderPath(result);
                        console.log("Valid path set: " + result);
                    }
                } else {
                    if (result && result !== "undefined" && result !== "") {
                        console.warn("Invalid path received from ExtendScript: " + result);
                        if (window.JSCUIManager) {
                            window.JSCUIManager.updateStatus("올바른 폴더를 선택해주세요.", false);
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
        const currentPath = window.JSCStateManager.getCurrentFolderPath();
        window.JSCUtils.debugLog("refreshSoundButtons() called. currentFolderPath: " + currentPath);
        
        if (currentPath && window.JSCUtils.isValidPath(currentPath)) {
            window.JSCUIManager.updateSoundButtons([], currentPath); // 기존 버튼 비우기
            window.JSCUIManager.updateStatus(
                "'" + window.JSCUtils.getShortPath(currentPath) + "' 폴더의 효과음 목록을 새로고침합니다...",
                true
            );
            
            const pathArg = JSON.stringify(currentPath);
            window.JSCUtils.debugLog("Calling getFilesForPathCS with pathArg: " + pathArg);
            
            window.JSCCommunication.callExtendScript(
                "getFilesForPathCS(" + pathArg + ")",
                function(result: string) {
                    window.JSCUtils.debugLog("refreshSoundButtons: evalScript callback result: " + result);
                    
                    // 디버그 정보 생성
                    let debugInfo = "=== Refresh Sound Buttons Debug ===\n";
                    debugInfo += "시간: " + new Date().toISOString() + "\n";
                    debugInfo += "폴더 경로: " + currentPath + "\n";
                    debugInfo += "JSX 결과: " + result + "\n";
                    debugInfo += "결과 타입: " + typeof result + "\n";
                    
                    if (typeof result === "string" && result.indexOf("error:") === 0) {
                        debugInfo += "오류 발생: " + result.substring(6) + "\n";
                        window.JSCUIManager.updateStatus("폴더 새로고침 중 오류가 발생했습니다: " + result.substring(6), false);
                    } else if (result === "success") {
                        debugInfo += "성공적으로 완료됨\n";
                        debugInfo += "콜백 방식으로 파일 목록 가져오기 시도...\n";
                        
                        // 콜백 방식으로 직접 파일 목록 가져오기
                        window.JSCCommunication.callExtendScript("getFilesForPathWithCallback(" + pathArg + ")", function(callbackResult: string) {
                            debugInfo += "콜백 결과: " + callbackResult + "\n";
                            
                            try {
                                const parsedResult = window.JSCUtils.safeJSONParse(callbackResult);
                                if (parsedResult && parsedResult.success && parsedResult.soundFiles) {
                                    debugInfo += "파일 " + parsedResult.soundFiles.length + "개 발견\n";
                                    window.JSCUIManager.updateSoundButtons(parsedResult.soundFiles, parsedResult.folderPath);
                                    window.JSCUIManager.updateStatus("폴더 새로고침이 완료되었습니다. " + parsedResult.soundFiles.length + "개 파일 발견.", true);
                                } else {
                                    debugInfo += "파일 목록 처리 실패\n";
                                    window.JSCUIManager.updateStatus("파일 목록을 가져올 수 없습니다.", false);
                                }
                            } catch (parseError) {
                                debugInfo += "JSON 파싱 오류: " + (parseError as Error).message + "\n";
                                window.JSCUIManager.updateStatus("파일 목록 데이터 처리 중 오류가 발생했습니다.", false);
                            }
                            
                            (window as any).lastDebugInfo = debugInfo;
                            window.JSCUIManager.toggleDebugButton(true);
                        });
                    } else {
                        debugInfo += "예상치 못한 결과: " + result + "\n";
                        window.JSCUIManager.updateStatus("폴더 새로고침 결과를 처리하는 중입니다...", true);
                    }
                    
                    // 디버그 정보 저장
                    (window as any).lastDebugInfo = debugInfo;
                    window.JSCUIManager.toggleDebugButton(true);
                }
            );
        } else {
            if (currentPath && !window.JSCUtils.isValidPath(currentPath)) {
                console.warn("currentFolderPath is invalid, clearing it: " + currentPath);
                window.JSCStateManager.clearFolderPath();
                window.JSCUIManager.updateStatus("폴더 경로가 올바르지 않습니다. 다시 선택해주세요.", false);
            } else {
                console.warn("currentFolderPath is empty or invalid. Aborting refresh.");
                window.JSCUIManager.updateStatus("먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.", false);
            }
        }
    }
    
    // 클립 자동 정렬 처리 (새로운 SoundEngine 사용)
    async function magnetClips(): Promise<void> {
        try {
            window.JSCUtils.debugLog("magnetClips() called");
            
            // Check if SoundEngine is available
            if (!(window as any).SoundEngine) {
                window.JSCUIManager.updateStatus("SoundEngine 모듈이 로드되지 않았습니다. 페이지를 새로고침하세요.", false);
                console.error('SoundEngine not available');
                return;
            }
            
            // 엔진 상태 확인
            const engineStatus = (window as any).SoundEngine.getEngineStatus();
            if (!engineStatus.isReady) {
                window.JSCUIManager.updateStatus(
                    `필요한 모듈이 로드되지 않았습니다: ${engineStatus.dependencies.join(', ')}`, 
                    false
                );
                return;
            }
            
            // UI 상태 업데이트
            window.JSCUIManager.updateStatus("클립 자동 정렬 중...", true);
            window.JSCUIManager.resetDebugUI();
            
            const magnetStatus = document.getElementById("magnetStatus");
            if (magnetStatus) {
                magnetStatus.textContent = "처리 중...";
                magnetStatus.style.color = "#007acc";
            }
            
            // SoundEngine으로 마그넷 기능 실행
            const result = await (window as any).SoundEngine.executeMagnetClips();
            
            // 결과 처리
            if (result.success) {
                window.JSCUIManager.updateStatus(result.message, true);
                
                // 마그넷 상태 업데이트
                if (result.data) {
                    window.JSCUIManager.updateMagnetStatus(
                        true,
                        result.data.clipsMoved || 0,
                        result.data.gapsRemoved || 0
                    );
                }
            } else {
                window.JSCUIManager.updateStatus(result.message, false);
                window.JSCUIManager.updateMagnetStatus(false);
            }
            
            // 디버그 정보 표시
            if (result.debug && window.JSCUtils.CONFIG.DEBUG_MODE) {
                (window as any).lastDebugInfo = result.debug;
                window.JSCUIManager.toggleDebugButton(true);
            }
            
            // 실행 시간 로깅
            if (result.executionTime) {
                window.JSCUtils.logInfo(`클립 자동 정렬 완료 - 소요 시간: ${result.executionTime.toFixed(2)}ms`);
            }
            
        } catch (e) {
            console.error("Magnet clips failed:", (e as Error).message);
            window.JSCUIManager.updateStatus("클립 자동 정렬 중 오류가 발생했습니다.", false);
            window.JSCUIManager.updateMagnetStatus(false);
            
            // 에러 정보를 디버그로 표시
            if (window.JSCUtils.CONFIG.DEBUG_MODE) {
                (window as any).lastDebugInfo = `Error: ${(e as Error).message}\nStack: ${(e as Error).stack}`;
                window.JSCUIManager.toggleDebugButton(true);
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
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("클립을 '" + soundDisplayName + "' (으)로 대체 중...", true);
            }
            
            if (window.JSCCommunication) {
                // 단계별 테스트: 가장 간단한 함수부터 시작
                console.log("Testing simplest ExtendScript function first...");
                window.JSCCommunication.callExtendScript("simpleTest()", function(simpleResult: string) {
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
                        window.JSCCommunication.callExtendScript("testDuplicateImport(" + JSON.stringify(soundFsName) + ")", function(duplicateResult: string) {
                            debugInfo += "\n--- 중복 임포트 테스트 결과 ---\n";
                            debugInfo += duplicateResult + "\n";
                            
                            // 기본 정보 테스트 (JSON 없이)
                            window.JSCCommunication.callExtendScript("basicInfo()", function(basicResult: string) {
                                debugInfo += "\n--- 기본 정보 테스트 결과 ---\n";
                                debugInfo += "basicInfo(): " + basicResult + "\n";
                                
                                if (basicResult && basicResult.indexOf("ERROR:") !== 0) {
                                    debugInfo += "✓ 기본 정보 수집 성공\n";
                                    
                                    // 마지막 단계: 실제 클립 교체 시도
                                    debugInfo += "\n환경 테스트 통과, 클립 교체 시도...\n";
                                    window.JSCCommunication.callExtendScript(
                                        "replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")",
                                        function(result: string) {
                                        console.log("replaceSelectedAudioClips call result: " + result);
                                        
                                        debugInfo += "\n--- 클립 교체 결과 ---\n";
                                        debugInfo += "원본 결과: " + result + "\n";
                                        
                                        // JSON 파싱 시도
                                        try {
                                            const parsedResult = window.JSCUtils.safeJSONParse(result);
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
                                                    window.JSCUIManager.updateStatus("클립 교체 완료: " + parsedResult.message, true);
                                                } else {
                                                    window.JSCUIManager.updateStatus("클립 교체 실패: " + parsedResult.message, false);
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
                                                    window.JSCUIManager.updateStatus("클립 교체 완료: " + message, true);
                                                } else if (result.indexOf("error:") === 0) {
                                                    const errorMessage = result.substring(6);
                                                    window.JSCUIManager.updateStatus("클립 교체 실패: " + errorMessage, false);
                                                } else {
                                                    window.JSCUIManager.updateStatus("클립 교체 결과: " + result, true);
                                                }
                                            }
                                        }
                                        
                                            // 디버그 정보 저장
                                            (window as any).lastDebugInfo = debugInfo;
                                            window.JSCUIManager.toggleDebugButton(true);
                                        }
                                    );
                                } else {
                                    debugInfo += "✗ 기본 정보 수집 실패: " + basicResult + "\n";
                                    window.JSCUIManager.updateStatus("ExtendScript 기본 정보 수집 실패", false);
                                    (window as any).lastDebugInfo = debugInfo;
                                    window.JSCUIManager.toggleDebugButton(true);
                                }
                            });
                        });
                    } else {
                        debugInfo += "✗ ExtendScript 기본 실행 실패: " + simpleResult + "\n";
                        window.JSCUIManager.updateStatus("ExtendScript 실행 환경에 문제가 있습니다", false);
                        (window as any).lastDebugInfo = debugInfo;
                        window.JSCUIManager.toggleDebugButton(true);
                    }
                });
            }
        } else {
            console.error("Sound file path (fsName) not found on button.");
            if (window.JSCUIManager) {
                window.JSCUIManager.updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
            }
        }
    }
    
    // 공개 API
    return {
        setupEventListeners: setupEventListeners,
        handleSoundFileButtonClick: handleSoundFileButtonClick
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.JSCEventManager = JSCEventManager;
}