// console.log("main.js loaded"); // 로그 주석 처리
// alert("main.js loaded - alert"); // alert 주석 처리
/**
 * 효과음 삽입 도구 - 메인 JavaScript
 */

// CSInterface 인스턴스 생성
var csInterface = new CSInterface();

// 설정 저장 및 불러오기를 위한 키
var SOUND_FOLDER_KEY = "soundInserter_folder";

// 전역 변수 추가
var currentFolderPath = ""; // 현재 선택된 폴더 경로 저장

// 초기화 함수
function init() {
    // console.log("init() called"); // 로그 주석 처리
    // alert("init() called - alert"); // alert 주석 처리
    // 테마 색상 설정
    updateThemeWithAppSkinInfo();

    // 이전에 저장된 폴더 경로 불러오기 및 currentFolderPath, 새로고침 버튼 상태 설정
    var savedFolder = localStorage.getItem(SOUND_FOLDER_KEY);
    if (savedFolder) {
        document.getElementById("sound-folder").value = savedFolder;
        currentFolderPath = savedFolder; // currentFolderPath에 저장된 경로 반영
        document.getElementById("refreshSounds").disabled = false; // 저장된 경로 있으면 새로고침 버튼 활성화
    } else {
        document.getElementById("refreshSounds").disabled = true; // 저장된 경로 없으면 비활성화
    }

    // 이벤트 리스너 등록
    setupEventListeners();

    // 호스트와 통신 준비
    csInterface.addEventListener(
        "com.adobe.soundInserter.events.SoundEvent",
        function (event) {
            try {
                // Check if data is a string
                var data = event.data;
                console.log("Received event data:", data);
                console.log("Type of event.data:", typeof data);

                // Handle non-string data
                if (typeof data !== "string") {
                    console.warn("Received data is not a string:", data);
                    try {
                        // 객체일 가능성이 있으므로 JSON.stringify 시도
                        data = JSON.stringify(data);
                        console.log(
                            "Converted non-string data to JSON string:",
                            data
                        );
                    } catch (e) {
                        // stringify 실패 시, 원래 문제였던 [object Object] 문제를 표시하거나,
                        // 혹은 더 구체적인 오류 로깅
                        var errorDisplay =
                            typeof data === "object" && data !== null
                                ? "[object Object] (raw object received)"
                                : String(data);
                        updateStatus(
                            "데이터 처리 오류 (비문자열): " + errorDisplay,
                            false
                        );
                        console.error(
                            "Failed to stringify non-string data:",
                            e
                        );
                        return;
                    }
                }

                // [object Object] 오류 검사
                if (data === "[object Object]") {
                    console.log("[object Object] 오류 발생");
                    updateStatus(
                        "데이터 처리 오류: JSON 직렬화 문제가 발생했습니다.",
                        false
                    );
                    return;
                }

                // Try parsing JSON
                var resultData;
                try {
                    resultData = JSON.parse(data);
                } catch (parseError) {
                    // If not JSON, handle as string
                    console.log("Failed to parse data:", parseError.toString());
                    console.log("Raw data:", data);
                    updateStatus(data, false);
                    return;
                }

                // Save debug info
                if (resultData.debug) {
                    window.lastDebugInfo = resultData.debug;
                    // Show debug button
                    toggleDebugButton(true);
                }

                if (
                    resultData.soundList &&
                    Array.isArray(resultData.soundList)
                ) {
                    displaySoundList(resultData.soundList);
                }

                if (resultData.message) {
                    updateStatus(resultData.message, resultData.success);
                }
            } catch (e) {
                // Handle overall process errors
                console.error("Event processing error:", e.toString());
                updateStatus(
                    "Error occurred during processing: " + e.toString(),
                    false
                );
            }
        }
    );

    // 새로 추가된 FileListEvent 리스너
    csInterface.addEventListener(
        "com.adobe.soundInserter.events.FileListEvent",
        handleFileListEvent
    );

    // 디버그 UI 요소 추가
    setupDebugUI();
}

// 디버그 UI 요소 설정
function setupDebugUI() {
    // 이미 존재하는지 확인
    if (document.getElementById("debug-button")) {
        return;
    }

    // 결과 영역에 디버그 버튼과 디버그 정보 영역 추가
    var resultSection = document.querySelector(".result-section");

    // 디버그 버튼 생성
    var debugButton = document.createElement("button");
    debugButton.id = "debug-button";
    debugButton.innerHTML = "디버그 정보 보기";
    debugButton.style.display = "none";
    debugButton.style.marginTop = "10px";
    debugButton.style.padding = "5px 10px";
    debugButton.style.backgroundColor = "#555";
    debugButton.style.color = "white";
    debugButton.style.border = "none";
    debugButton.style.borderRadius = "3px";
    debugButton.style.cursor = "pointer";

    // 디버그 정보 영역 생성
    var debugInfo = document.createElement("div");
    debugInfo.id = "debug-info";
    debugInfo.style.display = "none";
    debugInfo.style.marginTop = "10px";
    debugInfo.style.padding = "10px";
    debugInfo.style.backgroundColor = "#333";
    debugInfo.style.border = "1px solid #555";
    debugInfo.style.borderRadius = "3px";
    debugInfo.style.maxHeight = "150px";
    debugInfo.style.overflowY = "auto";
    debugInfo.style.whiteSpace = "pre-wrap";
    debugInfo.style.fontSize = "11px";
    debugInfo.style.fontFamily = "monospace";

    // 디버그 정보 닫기 버튼
    var closeDebugButton = document.createElement("button");
    closeDebugButton.id = "close-debug-button";
    closeDebugButton.innerHTML = "닫기";
    closeDebugButton.style.marginTop = "5px";
    closeDebugButton.style.padding = "3px 8px";
    closeDebugButton.style.backgroundColor = "#666";
    closeDebugButton.style.color = "white";
    closeDebugButton.style.border = "none";
    closeDebugButton.style.borderRadius = "3px";
    closeDebugButton.style.cursor = "pointer";
    closeDebugButton.style.display = "none";

    // 요소 추가
    resultSection.appendChild(debugButton);
    resultSection.appendChild(debugInfo);
    resultSection.appendChild(closeDebugButton);

    // 이벤트 리스너 추가
    debugButton.addEventListener("click", function () {
        showDebugInfo();
    });

    closeDebugButton.addEventListener("click", function () {
        document.getElementById("debug-info").style.display = "none";
        this.style.display = "none";
    });
}

// 디버그 버튼 표시/숨김 설정
function toggleDebugButton(show) {
    var debugButton = document.getElementById("debug-button");
    if (debugButton) {
        debugButton.style.display = show ? "block" : "none";
    }
}

// 디버그 정보 표시
function showDebugInfo() {
    var debugInfo = document.getElementById("debug-info");
    var closeButton = document.getElementById("close-debug-button");

    if (debugInfo && window.lastDebugInfo) {
        debugInfo.textContent = window.lastDebugInfo;
        debugInfo.style.display = "block";
        closeButton.style.display = "block";
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // console.log("setupEventListeners() called"); // 로그 주석 처리
    // alert("setupEventListeners() called - alert"); // alert 주석 처리

    // 효과음 삽입 버튼
    var insertButton = document.getElementById("insert-sounds");
    if (insertButton) {
        insertButton.addEventListener("click", insertSounds);
        // console.log("Event listener added to insert-sounds button:", insertButton); // 로그 주석 처리
        // alert("Event listener added to insert-sounds button"); // alert 주석 처리
    } else {
        // console.error("Button with ID 'insert-sounds' not found.");
        // alert("Error: Button with ID 'insert-sounds' not found."); // alert 주석 처리
    }

    // 폴더 찾기 버튼 ID 수정
    var browseButton = document.getElementById("browseFolder"); // "browse-folder"에서 "browseFolder"로 수정
    if (browseButton) {
        browseButton.addEventListener("click", browseSoundFolder);
        // console.log("Event listener added to browseFolder button:", browseButton); // 로그 주석 처리
        // alert("Event listener added to browseFolder button"); // alert 주석 처리
    } else {
        // console.error("Button with ID 'browseFolder' not found.");
        // alert("Error: Button with ID 'browseFolder' not found."); // alert 주석 처리
    }

    // 새로고침 버튼 리스너 (추가된 부분)
    var refreshButton = document.getElementById("refreshSounds");
    if (refreshButton) {
        refreshButton.addEventListener("click", refreshSoundButtons);
        // console.log("Event listener added to refreshSounds button:", refreshButton); // 로그 주석 처리
        // alert("Event listener added to refreshSounds button"); // alert 주석 처리
    } else {
        // console.error("Button with ID 'refreshSounds' not found.");
        // alert("Error: Button with ID 'refreshSounds' not found."); // alert 주석 처리
    }

    // 폴더 경로 input 변경 시 저장 및 새로고침 버튼 상태 업데이트
    var folderInput = document.getElementById("sound-folder");
    if (folderInput) {
        folderInput.addEventListener("change", function () {
            localStorage.setItem(SOUND_FOLDER_KEY, this.value);
            currentFolderPath = this.value; // currentFolderPath도 업데이트
            document.getElementById("refreshSounds").disabled = !this.value; // 경로 유무에 따라 새로고침 버튼 활성화/비활성화
        });
        // console.log("Event listener added to sound-folder input:", folderInput); // 로그 주석 처리
        // alert("Event listener added to sound-folder input"); // alert 주석 처리
    } else {
        // console.error("Input with ID 'sound-folder' not found.");
        // alert("Error: Input with ID 'sound-folder' not found."); // alert 주석 처리
    }
}

// 효과음 폴더 찾기 대화상자
function browseSoundFolder() {
    // alert("browseSoundFolder() called - alert"); // alert 주석 처리
    csInterface.evalScript("browseSoundFolder()", function (result) {
        if (result && result !== "undefined" && result !== "") {
            document.getElementById("sound-folder").value = result;
            localStorage.setItem(SOUND_FOLDER_KEY, result);
        }
    });
}

// Insert sound effects function
function insertSounds() {
    // alert("insertSounds() called - alert"); // alert 주석 처리
    // Get folder path
    var folderPath = document.getElementById("sound-folder").value;
    if (!folderPath) {
        updateStatus("효과음 폴더 경로를 설정해주세요.", false);
        return;
    }

    // Get option settings
    var audioTrack = document.getElementById("audio-track").value;

    // Update status message
    updateStatus("효과음 삽입 중...");

    // Reset sound list
    document.getElementById("sound-list").innerHTML = "";

    // Reset debug info
    window.lastDebugInfo = null;
    toggleDebugButton(false);
    document.getElementById("debug-info").style.display = "none";
    document.getElementById("close-debug-button").style.display = "none";

    // Clean and escape the folder path
    folderPath = folderPath.trim();

    // uacbdub85c uc720ud6a8uc131 uac80uc0ac ubc0f ucc98ub9ac
    if (folderPath.indexOf('"') !== -1 || folderPath.indexOf("'") !== -1) {
        // uae30uc874 ub530uc634ud45c uc81cuac70
        folderPath = folderPath.replace(/["']/g, "");
    }

    // folderPath = folderPath.replace(/\\/g, "\\\\"); // JSON.stringify가 이스케이프를 처리하므로 주석 처리

    // var jsxParams = JSON.stringify({
    //     folderPath: folderPath,
    //     audioTrack: audioTrack,
    // });
    // jsxParams = jsxParams.replace(/\"/g, '\\'); // JSON.stringify를 사용하면 이 부분도 필요 없음
    // console.log("Sending params to JSX:", jsxParams);

    // JSON.stringify를 사용하여 각 인자를 안전하게 전달하도록 수정
    var jsxCode =
        "insertSoundsBetweenClips(" +
        JSON.stringify(folderPath) +
        ", " +
        JSON.stringify(audioTrack) +
        ")";

    console.log("Executing JSX code:", jsxCode); // 이 로그는 디버깅에 도움이 되므로 유지하는 것이 좋습니다.

    csInterface.evalScript(jsxCode, function (result) {
        console.log("JSX result:", result);

        // Handle errors that might not be caught by the event listener
        if (result === "false") {
            // No specific action needed here as the event listener should handle errors
            console.log(
                "Sound insertion failed - check the event listener for details"
            );
        }
    });
}

// 효과음 목록 표시
function displaySoundList(soundList) {
    var listContainer = document.getElementById("sound-list");
    listContainer.innerHTML = "";

    if (soundList.length === 0) {
        listContainer.innerHTML = "<p>삽입된 효과음이 없습니다.</p>";
        return;
    }

    for (var i = 0; i < soundList.length; i++) {
        var soundItem = document.createElement("div");
        soundItem.className = "sound-item";
        soundItem.textContent = i + 1 + ". " + soundList[i];
        listContainer.appendChild(soundItem);
    }
}

// 상태 메시지 업데이트
function updateStatus(message, isSuccess) {
    var statusElement = document.getElementById("status-message");

    // 기존 클래스 제거
    statusElement.classList.remove("success", "error");

    // 성공/실패에 따른 클래스 추가
    if (isSuccess === true) {
        statusElement.classList.add("success");
    } else if (isSuccess === false) {
        statusElement.classList.add("error");

        // 오류 발생 시 디버그 버튼 표시 (디버그 정보가 있을 경우)
        if (window.lastDebugInfo) {
            toggleDebugButton(true);
        }
    }

    statusElement.textContent = message;
}

// Adobe 앱 테마 정보로 UI 업데이트
function updateThemeWithAppSkinInfo() {
    var appSkinInfo = csInterface.hostEnvironment.appSkinInfo;
    var panelBgColor = appSkinInfo.panelBackgroundColor.color;

    // 어두운 테마인지 확인
    var isDarkTheme = panelBgColor.red < 128;

    // 필요에 따라 테마 스타일 전환
    if (!isDarkTheme) {
        // 밝은 테마 스타일 적용
        document.body.classList.add("light-theme");
    }
}

// FileListEvent 핸들러 수정
function handleFileListEvent(event) {
    console.log("[JS] handleFileListEvent received event. Type:", event.type); // 로그 추가
    // console.log("[JS] handleFileListEvent raw event.data:", event.data); // 필요시 주석 해제

    var statusPanel = document.getElementById("statusPanel");
    var container = document.getElementById("individualSoundButtonsContainer");
    container.innerHTML = ""; // 이전 버튼들 제거

    try {
        var eventDataString = event.data;
        console.log(
            "[JS] handleFileListEvent: eventDataString (type: " +
                typeof eventDataString +
                "):",
            eventDataString
        ); // 로그 추가
        var parsedData;

        if (typeof eventDataString === "string") {
            if (eventDataString.trim() === "") {
                console.error(
                    "[JS] handleFileListEvent: Received empty string data."
                ); // 로그 변경
                updateStatus(
                    "효과음 목록 이벤트 수신: 데이터 비어 있음.",
                    "error"
                );
                return;
            }
            try {
                parsedData = JSON.parse(eventDataString);
                console.log(
                    "[JS] handleFileListEvent: Parsed JSON data:",
                    parsedData
                ); // 로그 추가
            } catch (e) {
                console.error(
                    "[JS] handleFileListEvent: JSON parsing error:",
                    e
                ); // 로그 변경
                console.error(
                    "[JS] handleFileListEvent: Original data causing parse error:",
                    eventDataString
                );
                updateStatus(
                    "효과음 목록 JSON 파싱 오류: " +
                        e.message +
                        "<br>수신데이터: " +
                        escapeHtml(eventDataString),
                    "error"
                );
                return;
            }
        } else if (
            typeof eventDataString === "object" &&
            eventDataString !== null
        ) {
            // If already an object (e.g. if CSInterface auto-parses JSON, though typically it's a string)
            parsedData = eventDataString;
            console.log(
                "[JS] handleFileListEvent: Received data as object (no parsing needed):",
                parsedData
            ); // 로그 추가
        } else {
            console.error(
                "[JS] handleFileListEvent: Unknown data type received.",
                typeof eventDataString
            ); // 로그 변경
            updateStatus(
                "효과음 목록 이벤트: 알 수 없는 데이터 타입 - " +
                    typeof eventDataString,
                "error"
            );
            return;
        }

        if (!parsedData || !parsedData.soundFiles) {
            console.error(
                "[JS] handleFileListEvent: Invalid data structure (soundFiles missing). Parsed data:",
                parsedData
            ); // 로그 변경
            updateStatus(
                "효과음 목록 데이터 형식이 잘못되었습니다 (soundFiles 누락).",
                "error"
            );
            return;
        }

        var soundFiles = parsedData.soundFiles;
        var folderPathFromEvent = parsedData.folderPath;
        console.log(
            "[JS] handleFileListEvent: soundFiles count:",
            soundFiles.length,
            "folderPathFromEvent:",
            folderPathFromEvent
        ); // 로그 추가

        if (folderPathFromEvent) {
            currentFolderPath = folderPathFromEvent; // 경로 저장
            localStorage.setItem(SOUND_FOLDER_KEY, currentFolderPath); // localStorage에도 저장
            console.log(
                "[JS] handleFileListEvent: Updated currentFolderPath to:",
                currentFolderPath
            ); // 로그 추가

            var folderPathSpanEl = document.getElementById("folderPathSpan");
            if (folderPathSpanEl) {
                // console.log("Path for 짧은경로 in handleFileListEvent:", currentFolderPath); // 이 로그는 이미 있음
                folderPathSpanEl.textContent = 짧은경로(currentFolderPath);
            } else {
                console.warn(
                    "[JS] handleFileListEvent: Element with ID 'folderPathSpan' not found. Cannot display folder path."
                );
            }

            var refreshButton = document.getElementById("refreshSounds");
            if (refreshButton) {
                refreshButton.disabled = false; // 새로고침 버튼 활성화
            }
        } else if (currentFolderPath === "") {
            // This case might be redundant if folderPathFromEvent is always expected
            console.warn(
                "[JS] handleFileListEvent: folderPathFromEvent is missing, and currentFolderPath is also empty."
            );
            var refreshButton = document.getElementById("refreshSounds");
            if (refreshButton) {
                refreshButton.disabled = true; // 경로 없으면 비활성화
            }
        }

        if (soundFiles && soundFiles.length > 0) {
            console.log(
                "[JS] handleFileListEvent: Generating sound buttons..."
            ); // 로그 추가
            soundFiles.forEach(function (soundFile, index) {
                console.log(
                    "[JS] handleFileListEvent: Processing soundFile " +
                        index +
                        ":",
                    soundFile
                ); // 로그 추가
                if (soundFile && soundFile.name && soundFile.fsName) {
                    var button = document.createElement("button");
                    button.textContent = soundFile.name; // 이미 디코딩된 이름일 것으로 예상 (host.jsx의 getSoundFilesFromFolder 확인 필요)
                    button.setAttribute("data-fsname", soundFile.fsName);
                    button.addEventListener("click", onSoundFileButtonClick);
                    container.appendChild(button);
                    console.log(
                        "[JS] handleFileListEvent: Appended button for:",
                        soundFile.name
                    ); // 로그 추가
                } else {
                    console.warn(
                        "[JS] handleFileListEvent: Invalid soundFile object at index " +
                            index +
                            ":",
                        soundFile
                    ); // 로그 추가
                }
            });
            updateStatus(
                soundFiles.length + "개의 효과음 파일을 폴더에서 로드했습니다.",
                "success"
            );
        } else {
            console.info(
                "[JS] handleFileListEvent: No sound files to display. Folder path:",
                folderPathFromEvent || currentFolderPath
            ); // 로그 추가
            updateStatus("선택된 폴더에 오디오 파일이 없습니다.", "info");
        }
    } catch (e) {
        console.error(
            "[JS] handleFileListEvent: CRITICAL ERROR during event processing:",
            e
        ); // 로그 변경
        updateStatus("효과음 목록 표시 중 오류 발생: " + e.toString(), "error");
    }
}

// 새로고침 버튼 로직
function refreshSoundButtons() {
    // alert("refreshSoundButtons() called - alert"); // alert 주석 처리
    console.log(
        "[JS] refreshSoundButtons() called. currentFolderPath:",
        currentFolderPath
    ); // 로그 추가

    if (currentFolderPath && currentFolderPath !== "") {
        var container = document.getElementById(
            "individualSoundButtonsContainer"
        );
        container.innerHTML = ""; // 기존 버튼 비우기
        updateStatus(
            "'" +
                짧은경로(currentFolderPath) + // 이 부분 전에 currentFolderPath 로그 추가
                "' 폴더의 효과음 목록을 새로고침합니다...",
            "info"
        );
        // console.log("Path for 짧은경로 in refreshSoundButtons before updateStatus:", currentFolderPath); // 로그 주석 처리 또는 유지

        var pathArg = JSON.stringify(currentFolderPath);
        console.log(
            "[JS] refreshSoundButtons: Calling getFilesForPathCS with pathArg:",
            pathArg
        ); // 로그 추가

        csInterface.evalScript(
            "getFilesForPathCS(" + pathArg + ")", // 준비된 인자 사용
            function (result) {
                console.log(
                    "[JS] refreshSoundButtons: evalScript callback result for getFilesForPathCS:",
                    result
                ); // 로그 추가
                if (
                    typeof result === "string" &&
                    result.indexOf("error:") === 0
                ) {
                    updateStatus(
                        "새로고침 중 ExtendScript 오류: " + result,
                        "error"
                    );
                }
                // 성공 시 별도 처리는 FileListEvent 핸들러에서 담당
            }
        );
    } else {
        console.warn(
            "[JS] refreshSoundButtons: currentFolderPath is empty or invalid. Aborting refresh."
        ); // 로그 추가
        updateStatus(
            "먼저 '폴더 찾아보기'를 통해 효과음 폴더를 선택해주세요.",
            "warning"
        );
        document.getElementById("refreshSounds").disabled = true;
    }
}

// 경로 짧게 표시하는 헬퍼
function 짧은경로(path) {
    if (typeof path !== "string") return "알 수 없는 경로";
    var parts = path.split(/[\\/]/);
    if (parts.length > 2) {
        return ".../" + parts[parts.length - 2] + "/" + parts[parts.length - 1];
    }
    return path;
}

// 새로 추가된 함수: 개별 효과음 버튼 클릭 처리
function onSoundFileButtonClick(event) {
    // alert("onSoundFileButtonClick() called - alert"); // alert 주석 처리
    var soundFsName = event.target.getAttribute("data-fsname");
    var soundDisplayName = event.target.textContent; // 버튼의 텍스트 (디코딩된 파일 이름)를 사용

    if (soundFsName) {
        console.log("Replacing with sound file:", soundFsName);
        // File.decode는 ExtendScript 함수이므로 JavaScript에서 직접 사용 불가.
        // 버튼의 textContent (soundFile.name)를 사용합니다.
        updateStatus(
            "클립을 '" + soundDisplayName + "' (으)로 대체 중...",
            true
        );
        // host.jsx의 replaceSelectedAudioClips 함수 호출
        // 함수 시그니처: replaceSelectedAudioClips(soundFilePathToImport)
        csInterface.evalScript(
            "replaceSelectedAudioClips(" + JSON.stringify(soundFsName) + ")",
            function (result) {
                // 결과 처리는 SoundEvent 리스너에서 함 (message, success, debug 포함)
                console.log(
                    "replaceSelectedAudioClips call result (raw):",
                    result
                );
            }
        );
    } else {
        console.error("Sound file path (fsName) not found on button.");
        updateStatus("효과음 파일 경로를 찾을 수 없습니다.", false);
    }
}

// 초기화 실행
window.onload = init;