/**
 * 효과음 삽입 도구 - 메인 JavaScript
 */

// CSInterface 인스턴스 생성
var csInterface = new CSInterface();

// 설정 저장 및 불러오기를 위한 키
var SOUND_FOLDER_KEY = "soundInserter_folder";

// 초기화 함수
function init() {
    // 테마 색상 설정
    updateThemeWithAppSkinInfo();

    // 이전에 저장된 폴더 경로 불러오기
    var savedFolder = localStorage.getItem(SOUND_FOLDER_KEY);
    if (savedFolder) {
        document.getElementById("sound-folder").value = savedFolder;
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
    // 효과음 삽입 버튼
    var insertButton = document.getElementById("insert-sounds");
    insertButton.addEventListener("click", insertSounds);

    // 폴더 찾기 버튼
    var browseButton = document.getElementById("browse-folder");
    browseButton.addEventListener("click", browseSoundFolder);

    // 폴더 경로 변경 시 저장
    var folderInput = document.getElementById("sound-folder");
    folderInput.addEventListener("change", function () {
        localStorage.setItem(SOUND_FOLDER_KEY, this.value);
    });
}

// 효과음 폴더 찾기 대화상자
function browseSoundFolder() {
    csInterface.evalScript("browseSoundFolder()", function (result) {
        if (result && result !== "undefined" && result !== "") {
            document.getElementById("sound-folder").value = result;
            localStorage.setItem(SOUND_FOLDER_KEY, result);
        }
    });
}

// Insert sound effects function
function insertSounds() {
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

    // Escape backslashes for JSX string
    folderPath = folderPath.replace(/\\/g, "\\\\");

    // uc624ub958 ubc29uc9c0ub97c uc704ud55c ud30cub77cubbf8ud130 uc804ub2ec ubc29uc2dd ubcc0uacbd
    var jsxParams = JSON.stringify({
        folderPath: folderPath,
        audioTrack: audioTrack,
    });

    // ucd94uac00 uc774uc2a4ucf00uc774ud551 ucc98ub9ac
    jsxParams = jsxParams.replace(/\"/g, '\\"');

    console.log("Sending params to JSX:", jsxParams);

    // Call JSX function with JSON parameters
    var jsxCode =
        'insertSoundsBetweenClips("' + folderPath + '", "' + audioTrack + '")';

    console.log("Executing JSX code:", jsxCode);

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

// 새로 추가된 함수: FileListEvent 처리
function handleFileListEvent(event) {
    try {
        console.log(
            "FileListEvent received. typeof event.data:",
            typeof event.data
        );
        // console.log("event.data raw content:", event.data); // 필요시 상세 내용 로깅

        var parsedData;
        if (typeof event.data === "string") {
            if (event.data.trim() === "") {
                console.error("Received empty string data for FileListEvent.");
                updateStatus(
                    "효과음 목록 데이터를 받지 못했습니다 (빈 문자열).",
                    false
                );
                return;
            }
            try {
                parsedData = JSON.parse(event.data);
            } catch (e) {
                console.error("Error parsing event.data string:", e);
                console.error("Malformed JSON string was:", event.data);
                updateStatus(
                    "효과음 목록 데이터 파싱 오류: " + e.toString(),
                    false
                );
                return;
            }
        } else if (typeof event.data === "object" && event.data !== null) {
            parsedData = event.data; // 이미 객체 형태인 경우 그대로 사용
            console.log("event.data is already an object, using directly.");
        } else {
            console.error(
                "Received event.data is not a string or a valid object. Type:" +
                    typeof event.data
            );
            updateStatus(
                "효과음 목록 데이터 타입 오류. 수신 데이터: " +
                    String(event.data),
                false
            );
            return;
        }

        if (!parsedData) {
            console.error("Parsed data is null or undefined after type check.");
            updateStatus("효과음 목록 데이터를 처리할 수 없습니다.", false);
            return;
        }

        var soundFiles = parsedData.soundFiles;
        var folderPath = parsedData.folderPath; // folderPath도 사용될 수 있으므로 유지

        var container = document.getElementById(
            "individualSoundButtonsContainer"
        );
        var placeholder = document.getElementById("soundButtonPlaceholder");
        container.innerHTML = ""; // 기존 버튼이나 메시지 초기화

        if (soundFiles && Array.isArray(soundFiles) && soundFiles.length > 0) {
            soundFiles.forEach(function (soundFile) {
                if (
                    soundFile &&
                    typeof soundFile.name === "string" &&
                    typeof soundFile.fsName === "string"
                ) {
                    var button = document.createElement("button");
                    button.textContent = soundFile.name;
                    button.setAttribute("data-fsname", soundFile.fsName);
                    button.classList.add("sound-file-button");
                    button.addEventListener("click", onSoundFileButtonClick);
                    container.appendChild(button);
                } else {
                    console.warn("Invalid soundFile item:", soundFile);
                }
            });
        } else {
            var messageText =
                "선택된 폴더에 사용 가능한 효과음 파일이 없습니다.";
            if (parsedData && !Array.isArray(soundFiles)) {
                messageText = "수신된 효과음 목록이 올바르지 않습니다.";
            }
            if (placeholder) {
                container.appendChild(placeholder);
                placeholder.textContent = messageText;
            } else {
                var p = document.createElement("p");
                p.id = "soundButtonPlaceholder";
                p.textContent = messageText;
                container.appendChild(p);
            }
        }
    } catch (e) {
        console.error("Error handling FileListEvent (outer catch):", e);
        updateStatus(
            "효과음 목록 표시 중 예기치 않은 오류 발생: " + e.toString(),
            false
        );
        var errorContainer = document.getElementById(
            "individualSoundButtonsContainer"
        );
        if (errorContainer) {
            errorContainer.innerHTML =
                "<p>효과음 목록을 불러오는데 실패했습니다. (catch)</p>";
        }
    }
}

// 새로 추가된 함수: 개별 효과음 버튼 클릭 처리
function onSoundFileButtonClick(event) {
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
