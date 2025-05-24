/**
 * Sound Inserter Extension - Host Script (JSX)
 * Premiere Pro와 CEP 패널 간의 통신을 담당합니다.
 */

// 선택된 클립 사이에 랜덤 효과음 삽입 함수
function insertSoundsBetweenClips(folderPath, audioTrack) {
    try {
        var debugInfo = "작업 시작 - 폴더 경로: " + folderPath + "\n";
        $.writeln("효과음 삽입 시작 - 폴더: " + folderPath);

        folderPath = folderPath.replace(/['"`]/g, "");
        folderPath = folderPath.replace(/\\\\/g, '\\').replace(/\//g, '\\');

        var testFolder = new Folder(folderPath);
        if (!testFolder.exists) {
            debugInfo += "폴더 유효성 검사 실패: " + folderPath + "\n";
            sendEvent({
                message: "폴더를 찾을 수 없습니다: " + folderPath,
                success: false,
                debug: debugInfo
            });
            return "false";
        }
        debugInfo += "폴더 경로 유효성 확인 완료\n";

        var seq = app.project.activeSequence;
        if (!seq) {
            sendEvent("활성화된 시퀀스가 없습니다.", false);
            return "false";
        }
        debugInfo += "활성 시퀀스 확인 완료\n";

        var selectedClips = seq.getSelection();
        if (!selectedClips || selectedClips.length === 0) {
            sendEvent("효과음을 삽입하려면 하나 이상의 클립을 선택해주세요.", false);
            return "false";
        }
        debugInfo += "선택된 클립 수: " + selectedClips.length + "\n";

        var sortedClips = sortClipsByTime(selectedClips);
        if (sortedClips.length === 0) {
            sendEvent("정렬 가능한 유효한 클립이 없습니다.", false);
            return "false";
        }
        debugInfo += "정렬된 클립 수: " + sortedClips.length + "\n";

        $.writeln("===== 정렬된 클립 상세 정보 (sortedClips) =====");
        debugInfo += "===== 정렬된 클립 상세 정보 (sortedClips) =====\n";
        for (var sc_idx = 0; sc_idx < sortedClips.length; sc_idx++) {
            var sc = sortedClips[sc_idx];
            var clipName = sc.name ? File.decode(sc.name) : "이름 없음";
            var clipStart = sc.start && sc.start.seconds !== undefined ? sc.start.seconds.toFixed(2) : "시작 시간 없음";
            var clipEnd = sc.end && sc.end.seconds !== undefined ? sc.end.seconds.toFixed(2) : "종료 시간 없음";
            var mediaType = sc.mediaType ? sc.mediaType : "미디어 타입 없음";
            var logMsg = "정렬된 클립 " + sc_idx + ": '" + clipName + "', 시작: " + clipStart + "s, 종료: " + clipEnd + "s, 타입: " + mediaType;
            $.writeln(logMsg);
            debugInfo += logMsg + "\n";
        }
        $.writeln("==========================================");
        debugInfo += "==========================================\n";

        // Filter sortedClips to primarySortedClips
        var primarySortedClips = [];
        var hasVideo = false;
        $.writeln("기본 클립 필터링 시작 (sortedClips 길이: " + sortedClips.length + ")");
        debugInfo += "기본 클립 필터링 시작 (sortedClips 길이: " + sortedClips.length + ")\n";

        for (var k = 0; k < sortedClips.length; k++) {
            if (sortedClips[k] && sortedClips[k].mediaType === "Video") {
                hasVideo = true;
                break;
            }
        }
        $.writeln("비디오 클립 존재 여부: " + hasVideo);
        debugInfo += "비디오 클립 존재 여부: " + hasVideo + "\n";

        if (hasVideo) {
            for (var k = 0; k < sortedClips.length; k++) {
                if (sortedClips[k] && sortedClips[k].mediaType === "Video") {
                    primarySortedClips.push(sortedClips[k]);
                }
            }
            $.writeln("비디오 클립만 필터링하여 primarySortedClips 생성. 길이: " + primarySortedClips.length);
            debugInfo += "비디오 클립만 필터링하여 primarySortedClips 생성. 길이: " + primarySortedClips.length + "\n";
        } else { // No video clips, or only audio clips were selected
            primarySortedClips = [].concat(sortedClips); // Take all (which would be audio or other types)
            $.writeln("비디오 클립 없음. 모든 sortedClips를 primarySortedClips로 복사. 길이: " + primarySortedClips.length);
            debugInfo += "비디오 클립 없음. 모든 sortedClips를 primarySortedClips로 복사. 길이: " + primarySortedClips.length + "\n";
        }

        $.writeln("===== 기본 필터링된 클립 상세 정보 (primarySortedClips) =====");
        debugInfo += "===== 기본 필터링된 클립 상세 정보 (primarySortedClips) =====\n";
        for (var p_idx = 0; p_idx < primarySortedClips.length; p_idx++) {
            var psc = primarySortedClips[p_idx];
            var pClipName = psc.name ? File.decode(psc.name) : "이름 없음";
            var pClipStart = psc.start && psc.start.seconds !== undefined ? psc.start.seconds.toFixed(2) : "시작 시간 없음";
            var pClipEnd = psc.end && psc.end.seconds !== undefined ? psc.end.seconds.toFixed(2) : "종료 시간 없음";
            var pMediaType = psc.mediaType ? psc.mediaType : "미디어 타입 없음";
            var pLogMsg = "기본 클립 " + p_idx + ": '" + pClipName + "', 시작: " + pClipStart + "s, 종료: " + pClipEnd + "s, 타입: " + pMediaType;
            $.writeln(pLogMsg);
            debugInfo += pLogMsg + "\n";
        }
        $.writeln("==========================================================");
        debugInfo += "==========================================================\n";

        // "Default" 접두사 필터링을 사용하여 효과음 파일 목록 가져오기
        var soundFilesData = getSoundFilesFromFolder(folderPath, true);

        // getSoundFilesFromFolder로부터 받은 객체 및 내부 files 배열 유효성 검사
        if (!soundFilesData || !soundFilesData.files || typeof soundFilesData.files.length !== 'number') {
            sendEvent("지정된 폴더에서 'Default'로 시작하는 사용 가능한 효과음 파일을 찾을 수 없거나, 파일 목록 형식이 잘못되었습니다.", false);
            debugInfo += "getSoundFilesFromFolder 결과가 유효하지 않음. 수신 데이터: " + (soundFilesData ? JSON.stringify(soundFilesData) : "null 또는 undefined") + "\n";
            $.writeln("getSoundFilesFromFolder 결과가 유효하지 않음. 수신 데이터: " + (soundFilesData ? JSON.stringify(soundFilesData) : "null 또는 undefined"));
            return "false";
        }

        var soundFiles = soundFilesData.files;

        if (soundFiles.length === 0) {
            sendEvent("지정된 폴더에서 'Default'로 시작하는 사용 가능한 효과음 파일을 찾을 수 없습니다 (파일 없음).", false);
            debugInfo += "'Default'로 시작하는 효과음 파일 없음. 폴더: " + folderPath + "\n";
            $.writeln("'Default'로 시작하는 효과음 파일 없음. 폴더: " + folderPath);
            return "false";
        }

        debugInfo += "효과음 파일 수: " + soundFiles.length + "\n";
        if (soundFiles.length > 0 && soundFiles[0] && soundFiles[0].name) {
            debugInfo += "첫 번째 효과음 파일 (샘플): " + File.decode(soundFiles[0].name) + "\n";
        }

        var importedSoundItemsCache = {};

        var targetAudioTrack = null;
        debugInfo += "오디오 트랙 결정 시작. 요청 트랙: " + audioTrack + "\n";
        $.writeln("오디오 트랙 결정 시작. 요청 트랙: " + audioTrack);

        if (audioTrack === "auto") {
            var foundEmptyTrack = false;
            debugInfo += "자동 오디오 트랙 검색 시작:\n";
            $.writeln("자동 오디오 트랙 검색 시작:");
            // A1 트랙부터 순차적으로 빈 트랙 검색 (인덱스 0부터 시작)
            for (var tk = 0; tk < seq.audioTracks.numTracks; tk++) {
                var currentTrack = seq.audioTracks[tk];
                var trackName = currentTrack.name ? File.decode(currentTrack.name) : ("트랙 " + (tk + 1));
                var isMuted = currentTrack.isMuted();
                var isLocked = currentTrack.isLocked();
                var numClips = currentTrack.clips.numItems;

                var logMessage = "  트랙 검사 중: " + trackName + " (인덱스: " + tk + "), 클립 수: " + numClips + ", 음소거: " + isMuted + ", 잠김: " + isLocked;

                if (tk === 1) { // A2 트랙 (인덱스 1)에 대한 특별 로깅
                    logMessage += " [A2 트랙 상세 검사] numClips === 0 결과: " + (numClips === 0) + ", !isLocked 결과: " + (!isLocked) + ", !isMuted 결과: " + (!isMuted);
                }
                debugInfo += logMessage + "\n";
                $.writeln(logMessage);

                if (numClips === 0 && !isLocked && !isMuted) { // 잠기지 않고, 음소거되지 않고, 클립이 없는 트랙
                    targetAudioTrack = currentTrack;
                    var selectionReason = "    => 자동 오디오 트랙 선택: 빈 (잠기지 않고, 음소거되지 않은) 트랙 " + trackName + " (인덱스: " + targetAudioTrack.index + ") 발견됨.";
                    if (tk === 1) {
                        selectionReason += " [A2 트랙이 이 조건으로 선택됨]";
                    }
                    debugInfo += selectionReason + "\n";
                    $.writeln(selectionReason);
                    foundEmptyTrack = true;
                    break;
                }
            }

            // "완전히 빈 트랙" (우선순위 1)을 찾지 못한 경우 바로 알림
            if (!foundEmptyTrack) {
                var noSuitableTrackMsg = "자동으로 삽입할 완전히 비어있는 오디오 트랙을 찾지 못했습니다. (클립이 없으며, 잠겨있거나 음소거되지 않은 트랙)\n";
                debugInfo += "    => 오류: " + noSuitableTrackMsg + "\n";
                $.writeln("    => 오류: " + noSuitableTrackMsg);
                var alertMessage = noSuitableTrackMsg + "새 효과음을 삽입할 오디오 트랙을 직접 선택하거나, 타임라인을 정리해주세요.";
                sendEvent(JSON.stringify({
                    message: alertMessage,
                    success: false,
                    debug: debugInfo
                }));
                alert(alertMessage); // Premiere Pro 네이티브 alert 추가
                return "false"; // 작업 중단
            }
        } else {
            var trackIndex = parseInt(audioTrack) - 1;
            if (trackIndex >= 0 && trackIndex < seq.audioTracks.numTracks) {
                targetAudioTrack = seq.audioTracks[trackIndex];
                debugInfo += "선택된 오디오 트랙: 트랙 " + (targetAudioTrack.index + 1) + "\n";
                $.writeln("선택된 오디오 트랙: 트랙 " + (targetAudioTrack.index + 1));
            } else {
                sendEvent("지정한 오디오 트랙(" + audioTrack + ")이 유효하지 않습니다. 가용 트랙: " + seq.audioTracks.numTracks + "개", false);
                return "false";
            }
        }

        if (!targetAudioTrack) {
            sendEvent("효과음을 삽입할 대상 오디오 트랙을 결정할 수 없습니다.", false);
            return "false";
        }
        debugInfo += "최종 선택된 대상 오디오 트랙: " + (targetAudioTrack.index + 1) + " (ID: " + targetAudioTrack.id + ")\n";
        $.writeln("최종 선택된 대상 오디오 트랙: " + (targetAudioTrack.index + 1) + " (ID: " + targetAudioTrack.id + ")");

        var insertedSounds = [];
        var insertionCount = 0;

        debugInfo += "삽입 로직: 각 선택 클립의 시작 지점 (첫 클립은 제외)\n";

        // Use primarySortedClips instead of sortedClips for length check
        if (primarySortedClips.length < 2) {
            sendEvent("효과음을 삽입하려면 필터링 후 최소 2개 이상의 주요 클립을 선택해주세요. (현재 로직은 두 번째 클립부터 적용, 필터링된 클립 수: " + primarySortedClips.length + ")", false);
            return "false";
        }

        // Use primarySortedClips instead of sortedClips for the loop
        for (var i = 0; i < primarySortedClips.length; i++) {
            var clip = primarySortedClips[i]; // Get clip from primarySortedClips
            var insertionTime = clip.start.seconds;

            if (i === 0) {
                debugInfo += "첫 번째 클립 '" + File.decode(clip.name) + "' 건너뜀.\n";
                $.writeln("첫 번째 클립 '" + File.decode(clip.name) + "' 건너뜀.");
                continue;
            }

            $.writeln("처리 중인 클립: '" + File.decode(clip.name) + "' 시작 시간: " + insertionTime.toFixed(2) + "초");

            // 매 삽입마다 새로운 랜덤 효과음 선택
            if (!soundFiles || soundFiles.length === 0) {
                $.writeln("오류: 루프 내에서 효과음 파일을 찾을 수 없습니다. 삽입 건너뜀.");
                debugInfo += "오류: 루프 내에서 효과음 파일을 찾을 수 없어 현재 클립 삽입 건너뜀.\n";
                continue;
            }
            var randomSoundIndex = Math.floor(Math.random() * soundFiles.length);
            var soundFile = soundFiles[randomSoundIndex];
            var soundFilePath = soundFile.fsName;
            var decodedSoundFileName = File.decode(soundFile.name);

            $.writeln("삽입 시도할 효과음 파일 (매번 랜덤 선택): " + decodedSoundFileName + " (경로: " + soundFilePath + ")");
            var projectSoundItem = importedSoundItemsCache[soundFilePath];

            if (!projectSoundItem || projectSoundItem.treePath === undefined) {
                $.writeln("캐시에 없거나 유효하지 않음. '" + decodedSoundFileName + "' 임포트 시도...");
                var importResultArray = app.project.importFiles([soundFilePath]);
                if (importResultArray && importResultArray.length > 0 && importResultArray[0]) {
                    projectSoundItem = importResultArray[0];
                    importedSoundItemsCache[soundFilePath] = projectSoundItem;
                    $.writeln("임포트 성공 및 캐시 저장: " + projectSoundItem.name + " (ID: " + (projectSoundItem.nodeId ? projectSoundItem.nodeId : "N/A") + ")");
                } else {
                    $.writeln("importFiles 실패. 루트에서 이름으로 재검색 시도: " + decodedSoundFileName);
                    var foundInRoot = false;
                    for (var j = 0; j < app.project.rootItem.children.numItems; j++) {
                        var pi = app.project.rootItem.children[j];
                        if (pi.name === decodedSoundFileName) {
                            projectSoundItem = pi;
                            importedSoundItemsCache[soundFilePath] = projectSoundItem;
                            $.writeln("이름으로 재검색 성공 및 캐시 저장: " + projectSoundItem.name);
                            foundInRoot = true;
                            break;
                        }
                    }
                    if (!foundInRoot) {
                        $.writeln("임포트 및 재검색 모두 실패: " + decodedSoundFileName);
                        projectSoundItem = null;
                    }
                }
            } else {
                $.writeln("캐시에서 '" + projectSoundItem.name + "' 사용.");
            }

            if (projectSoundItem && projectSoundItem.name !== undefined) {
                $.writeln("삽입할 ProjectItem: " + projectSoundItem.name + ", 삽입 시간: " + insertionTime.toFixed(2) + "초, 대상 트랙 ID: " + (targetAudioTrack ? targetAudioTrack.id : "N/A") + ", 트랙 이름: " + (targetAudioTrack ? targetAudioTrack.name : "N/A"));
                var successfullyInserted = false;
                try {
                    if (targetAudioTrack && projectSoundItem.isSequence() === false) {
                        var time = new Time();
                        time.seconds = insertionTime;
                        targetAudioTrack.insertClip(projectSoundItem, time);
                        $.writeln("효과음 삽입 성공: " + projectSoundItem.name + " at " + time.seconds.toFixed(2) + "s on track " + (targetAudioTrack.index + 1));

                        var justInsertedClip = null;
                        if (targetAudioTrack.clips.numItems > 0) {
                            justInsertedClip = targetAudioTrack.clips[targetAudioTrack.clips.numItems - 1];
                            // 간단한 검증: 시작 시간 및 원본 파일 이름이 일치하는가?
                            if (Math.abs(justInsertedClip.start.seconds - time.seconds) > 0.01 ||
                                (justInsertedClip.projectItem && projectSoundItem.name !== justInsertedClip.projectItem.name)) {
                                $.writeln("경고: 마지막 클립이 방금 삽입한 오디오 클립과 정확히 일치하지 않을 수 있습니다. Name: " + (justInsertedClip.projectItem ? justInsertedClip.projectItem.name : "N/A") + ", Expected: " + projectSoundItem.name);
                                // 더 강력한 검증: 모든 클립을 순회하며 시작 시간과 projectItem으로 찾기 (필요시 구현)
                                // justInsertedClip = findNewlyInsertedClip(targetAudioTrack, projectSoundItem, time); // 예시 함수 호출
                            }
                        }

                        if (justInsertedClip) {
                            var referenceClipDurationSeconds = clip.duration.seconds; // clip은 primarySortedClips[i]
                            $.writeln("길이조정 기준 클립 '" + File.decode(clip.name) + "'의 길이: " + referenceClipDurationSeconds.toFixed(2) + "초");
                            $.writeln("삽입된 효과음 '" + File.decode(justInsertedClip.name) + "'의 원본 시작: " + justInsertedClip.start.seconds.toFixed(2) + "s, 원본 끝: " + justInsertedClip.end.seconds.toFixed(2) + "s, 원본 길이: " + justInsertedClip.duration.seconds.toFixed(2) + "초");

                            var targetDuration = referenceClipDurationSeconds;
                            var newClipEndTime = new Time();
                            newClipEndTime.seconds = justInsertedClip.start.seconds + targetDuration;
                            justInsertedClip.end = newClipEndTime;

                            var finalDuration = justInsertedClip.duration.seconds; // 변경 후 실제 길이

                            $.writeln("효과음 '" + File.decode(justInsertedClip.name) + "'의 새 끝점 설정 시도. 목표 길이: " + targetDuration.toFixed(2) + "초. 실제 적용된 길이: " + finalDuration.toFixed(2) + "초");

                            var lengthAdjustmentMessage = "";
                            if (Math.abs(finalDuration - targetDuration) > 0.01 && finalDuration < targetDuration) {
                                lengthAdjustmentMessage = " (길이조정됨: " + finalDuration.toFixed(2) + "s, 원본길이 제한)";
                                debugInfo += "효과음 '" + File.decode(justInsertedClip.name) + "' 길이가 원본 미디어 제한으로 목표보다 짧게 조정됨 (목표: " + targetDuration.toFixed(2) + "s, 실제: " + finalDuration.toFixed(2) + "s).\n";
                            } else {
                                lengthAdjustmentMessage = " (길이: " + finalDuration.toFixed(2) + "s)";
                                debugInfo += "효과음 '" + File.decode(justInsertedClip.name) + "' 길이가 " + finalDuration.toFixed(2) + "s로 조정됨.\n";
                            }
                            insertedSounds.push(File.decode(projectSoundItem.name) + lengthAdjustmentMessage);

                        } else {
                            $.writeln("삽입된 효과음 클립을 타임라인에서 찾지 못하여 길이 조정을 건너뜁니다.");
                            debugInfo += "효과음 '" + File.decode(projectSoundItem.name) + "' 삽입됨 (길이 조정 실패 - 클립 못찾음).\n";
                            insertedSounds.push(File.decode(projectSoundItem.name)); // 이름만 추가
                        }

                        insertionCount++;
                        successfullyInserted = true;
                    } else {
                        if (!targetAudioTrack) $.writeln("삽입 실패: 대상 트랙 객체가 유효하지 않음.");
                        else if (projectSoundItem.isSequence()) $.writeln("삽입 실패: 가져온 항목이 시퀀스임.");
                        else $.writeln("삽입 실패: 알 수 없는 이유 (대상 트랙 또는 아이템 문제).");
                    }
                } catch (e) {
                    $.writeln("클립 삽입 중 예외 발생: " + e.toString() + " (Item: " + projectSoundItem.name + ")");
                }
                if (successfullyInserted) {
                    debugInfo += "효과음 삽입 성공: " + projectSoundItem.name + "\\n";
                } else {
                    debugInfo += "효과음 삽입 실패 (삽입 단계): " + decodedSoundFileName + "\\n";
                }
            } else {
                $.writeln("'" + decodedSoundFileName + "'에 대한 유효한 ProjectItem을 얻지 못해 삽입 건너뜀.");
                debugInfo += "효과음 파일 준비 실패: " + decodedSoundFileName + "\\n";
            }
        }

        debugInfo += "총 처리 결과: " + insertionCount + "개 효과음 삽입 완료\\n";
        sendEvent(JSON.stringify({
            message: insertionCount + "개의 효과음이 성공적으로 삽입되었습니다.",
            success: true,
            soundList: insertedSounds,
            debug: debugInfo
        }));
        return "true";

    } catch (e) {
        var errorLine = e.line ? " (라인: " + e.line + ")" : "";
        var errorFile = e.fileName && typeof e.fileName === 'string' ? " (파일: " + File.decode(e.fileName) + ")" : "";
        var errorMsg = "최종 오류 발생: " + e.toString() + errorLine + errorFile;
        $.writeln("오류: " + errorMsg);
        sendEvent(JSON.stringify({
            message: errorMsg,
            success: false,
            debug: debugInfo + "\n\n" + errorMsg
        }));
        return "false";
    }
}

// 클립을 시간순으로 정렬하는 함수
function sortClipsByTime(clips) {
    var clipsArray = [];

    // 클립을 배열로 변환
    for (var i = 0; i < clips.length; i++) {
        try {
            if (clips[i] && clips[i].start !== undefined && clips[i].end !== undefined) {
                clipsArray.push(clips[i]);
            } else {
                $.writeln("정렬 제외된 클립 " + i + ": 시작/종료 시간 없음");
            }
        } catch (e) {
            $.writeln("클립 속성 접근 오류 " + i + ": " + e.toString());
        }
    }

    // 시작 시간으로 정렬
    clipsArray.sort(function(a, b) {
        return a.start.seconds - b.start.seconds;
    });

    return clipsArray;
}

// 폴더에서 사운드 파일 목록 가져오기
function getSoundFilesFromFolder(folderPath, filterByDefaultPrefix) {
    try {
        folderPath = folderPath.replace(/^\s+|\s+$/g, '');
        folderPath = folderPath.replace(/\\/g, '\\').replace(/\//g, '\\');
        $.writeln("효과음 검색 시도 폴더: " + folderPath + ", Default 필터: " + filterByDefaultPrefix);
        var folder = new Folder(folderPath);

        if (!folder.exists) {
            $.writeln("폴더가 존재하지 않음: " + folderPath);
            return null;
        }

        var audioExtensions = [".wav", ".mp3", ".aif", ".aiff", ".m4a",
            ".WAV", ".MP3", ".AIF", ".AIFF", ".M4A"
        ];
        var files = folder.getFiles();
        if (!files || files.length === 0) {
            $.writeln("폴더에 파일이 없음: " + folderPath);
            return null;
        }
        $.writeln("폴더 내 총 파일 수: " + files.length);

        var soundFileDetails = [];
        var debugFileLog = "";

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file instanceof File) {
                var decodedFileName = File.decode(file.name);
                var fileNameLower = decodedFileName.toLowerCase();
                var extension = "";
                var lastDotIndex = fileNameLower.lastIndexOf(".");
                if (lastDotIndex !== -1) {
                    extension = fileNameLower.substring(lastDotIndex);
                }

                var isAudioFile = false;
                for (var j = 0; j < audioExtensions.length; j++) {
                    if (audioExtensions[j].toLowerCase() === extension) {
                        isAudioFile = true;
                        break;
                    }
                }

                if (isAudioFile) {
                    debugFileLog += "\n - " + decodedFileName + " (오디오 파일)";
                    // filterByDefaultPrefix 플래그에 따라 "Default" 접두사 확인
                    if (filterByDefaultPrefix) {
                        if (decodedFileName.indexOf("Default") === 0) {
                            $.writeln("'Default' 필터 통과 (필터 활성): " + decodedFileName);
                            soundFileDetails.push({
                                name: decodedFileName,
                                fsName: file.fsName
                            });
                            debugFileLog += " -> Default 필터 통과";
                        } else {
                            $.writeln("'Default' 필터 제외 (필터 활성): " + decodedFileName);
                            debugFileLog += " -> Default 필터 제외";
                        }
                    } else {
                        // filterByDefaultPrefix가 false이면 "Default" 검사 없이 모든 오디오 파일 추가
                        $.writeln("'Default' 필터 비활성, 오디오 파일 추가: " + decodedFileName);
                        soundFileDetails.push({
                            name: decodedFileName,
                            fsName: file.fsName
                        });
                        debugFileLog += " -> Default 필터 비활성, 추가됨";
                    }
                }
            }
        }
        $.writeln("발견 및 필터링된 파일 로그:" + debugFileLog);
        var finalMsg = filterByDefaultPrefix ? "최종 필터링된 'Default' 오디오 파일 수: " : "최종 필터링된 전체 오디오 파일 수: ";
        $.writeln(finalMsg + soundFileDetails.length);

        // if (soundFileDetails.length === 0) {
        //     $.writeln("조건을 만족하는 오디오 파일을 찾지 못함");
        //     return null;
        // }
        // return soundFileDetails; // 이전에는 배열 또는 null 반환

        // 항상 객체 반환: { files: Array, path: String }
        // 조건 만족하는 오디오 파일 없더라도, 폴더 자체는 유효했으므로 빈 배열과 경로 반환
        if (soundFileDetails.length === 0) {
            $.writeln("조건을 만족하는 오디오 파일을 찾지 못함. 검색 대상 폴더: " + folderPath);
        }
        return {
            files: soundFileDetails,
            path: folderPath
        };

    } catch (e) {
        $.writeln("폴더 내 사운드 파일 검색 오류 (getSoundFilesFromFolder): " + e.toString());
        return null;
    }
}

// 파일 이름만 추출하는 함수
function getFileName(item) {
    if (!item) return "";
    if (item.name !== undefined) {
        return item.name;
    }
    return "";
}

// 효과음 파일을 프로젝트에 가져오고 시퀀스에 추가하는 함수
// function importAndAddToSequence(file, targetTrack, insertTime, adjustTime, debugInfo) { ... }

// 효과음 폴더 찾기 대화상자
function browseSoundFolder() {
    try {
        var folder = Folder.selectDialog("효과음 폴더 선택");
        if (folder) {
            var path = folder.fsName;
            $.writeln("선택된 폴더: " + path);

            // "Default" 필터링 없이 모든 오디오 파일 목록 가져오기 (UI 버튼용)
            var soundFilesData = getSoundFilesFromFolder(path, false); // 객체를 반환받음

            var filesForEvent = []; // 기본값은 빈 배열
            var pathToUse = path; // 기본값은 선택된 경로

            if (soundFilesData && soundFilesData.files) { // 반환된 객체와 files 속성 유효성 검사
                filesForEvent = soundFilesData.files;
                if (soundFilesData.path) { // 경로도 객체에서 가져옴 (일관성 유지)
                    pathToUse = soundFilesData.path;
                }
            } else {
                $.writeln("browseSoundFolder: getSoundFilesFromFolder가 유효한 객체를 반환하지 않음. 경로: " + path);
                // 이 경우에도 FileListEvent는 빈 파일 목록과 함께 전송될 수 있음
            }

            var eventData = {
                folderPath: pathToUse,
                soundFiles: filesForEvent // 실제 파일 배열을 전달
            };

            var eventObj = new CSXSEvent();
            eventObj.type = "com.adobe.soundInserter.events.FileListEvent";
            eventObj.data = JSON.stringify(eventData);
            eventObj.dispatch();
            $.writeln("FileListEvent 발송 (모든 오디오 파일): " + JSON.stringify(eventData));

            return path;
        }
    } catch (e) {
        $.writeln("폴더 선택 오류: " + e.toString());
    }
    return "";
}

// 이벤트 전송 함수
function sendEvent(message, success) {
    try {
        var eventObj = new CSXSEvent();
        eventObj.type = "com.adobe.soundInserter.events.SoundEvent";

        if (typeof message === "object") {
            try {
                var jsonString = JSON.stringify(message);
                if (jsonString === "[object Object]") {
                    var safeObj = {};
                    for (var key in message) {
                        if (message.hasOwnProperty(key)) {
                            try {
                                safeObj[key] = String(message[key]);
                            } catch (propErr) {
                                safeObj[key] = "[변환 불가 데이터]";
                            }
                        }
                    }
                    eventObj.data = JSON.stringify(safeObj);
                } else {
                    eventObj.data = jsonString;
                }
            } catch (jsonErr) {
                $.writeln("객체 JSON 변환 오류: " + jsonErr.toString());
                eventObj.data = JSON.stringify({
                    message: "객체 처리 오류: " + (message.message || "알 수 없는 오류"),
                    success: false
                });
            }
        } else {
            if (success !== undefined) {
                try {
                    eventObj.data = JSON.stringify({
                        message: String(message),
                        success: !!success
                    });
                } catch (jsonErr) {
                    $.writeln("JSON 변환 오류: " + jsonErr.toString());
                    eventObj.data = String(message) + " (success: " + (!!success) + ")";
                }
            } else {
                eventObj.data = String(message);
            }
        }

        eventObj.dispatch();
    } catch (e) {
        $.writeln("이벤트 전송 오류: " + e.toString());
    }
}

// 앱의 활성 상태 확인
function isAppOnline() {
    return "true";
}

// 새로운 함수: 선택된 오디오 클립을 특정 효과음으로 대체
function replaceSelectedAudioClips(soundFilePathToImport) {
    var mainFunctionName = "replaceSelectedAudioClips";
    var overallDebugInfo = ""; // Initialize debug info string for the main function
    var errors = [];
    var replacementCount = 0;

    function logToBoth(message, isError) {
        if (typeof $ !== 'undefined' && $.writeln) {
            $.writeln((isError ? "ERROR: " : "") + "[" + mainFunctionName + "] " + message);
        }
        overallDebugInfo += "[" + mainFunctionName + "] " + message + "\n";
    }

    try {
        logToBoth("Execution started. Sound file to import: " + soundFilePathToImport);

        var seq = app.project.activeSequence;
        if (!seq) {
            logToBoth("No active sequence. Aborting.", true);
            sendEvent(JSON.stringify({
                message: "클립 대체를 위해 활성화된 시퀀스가 없습니다.",
                success: false,
                debug: overallDebugInfo
            }));
            return "false";
        }
        logToBoth("Active sequence: " + (seq.name || "Unnamed Sequence"));

        var selectedClipsOnTimeline = seq.getSelection();
        if (!selectedClipsOnTimeline || selectedClipsOnTimeline.length === 0) {
            logToBoth("No clips selected on the timeline. Aborting.", true);
            sendEvent(JSON.stringify({
                message: "대체할 클립을 하나 이상 선택해주세요.",
                success: false,
                debug: overallDebugInfo
            }));
            return "false";
        }
        logToBoth("Number of selected timeline clips: " + selectedClipsOnTimeline.length);

        var importedSoundItemsCache = {}; // Cache for imported project items

        for (var i = 0; i < selectedClipsOnTimeline.length; i++) {
            var timelineClip = selectedClipsOnTimeline[i];
            var clipProcessingResult = processSingleTimelineClip(timelineClip, soundFilePathToImport, importedSoundItemsCache, seq, i, overallDebugInfo);

            if (clipProcessingResult) {
                if (clipProcessingResult.success) {
                    replacementCount++;
                }
                if (clipProcessingResult.error) {
                    errors.push(clipProcessingResult.error);
                }
                overallDebugInfo = clipProcessingResult.debugInfo; // Update debug info from sub-function
            }
        }

        var finalMessage = replacementCount + "개의 클립을 성공적으로 덮어썼습니다.";
        if (errors.length > 0) {
            finalMessage = replacementCount + "개 클립 덮어쓰기 성공, " + errors.length + "개 오류/경고: " + errors.join("; ");
        } else if (replacementCount === 0 && selectedClipsOnTimeline && selectedClipsOnTimeline.length > 0) {
            finalMessage = "선택된 클립에 대해 덮어쓰기 작업이 수행되지 않았습니다. " + (errors.length > 0 ? "상세 오류: " + errors.join("; ") : "로그를 확인하세요.");
        }

        logToBoth("Final result: " + finalMessage);
        sendEvent(JSON.stringify({
            message: finalMessage,
            success: errors.length === 0 && replacementCount > 0,
            debug: overallDebugInfo
        }));
        return errors.length === 0 && replacementCount > 0 ? "true" : "false";

    } catch (e) {
        logClipMsg("CRITICAL ERROR in " + functionName + ": " + e.toString() + (e.line ? " (Line: " + e.line + ")" : ""), true);
        // errorMessages.push already handled by logClipMsg
        return {
            success: false,
            error: "클립 처리 중 예외: " + e.toString(),
            debugInfo: debugInfo
        };
    }
}


// Helper function to process a single timeline clip
function processSingleTimelineClip(timelineClip, soundFilePathToImport, importedSoundItemsCache, seq, clipIndex, parentDebugInfo) {
    var functionName = "processSingleTimelineClip";
    var debugInfo = parentDebugInfo; // Continue with parent's debug info
    var errorMessages = [];
    var clipSuccessfullyProcessed = false;

    function logClipMsg(message, isError) {
        var clipName = (timelineClip && timelineClip.name) ? File.decode(timelineClip.name) : "N/A";
        var logEntry = "[" + functionName + "][Clip " + clipIndex + ": '" + clipName + "'] " + message;
        if (typeof $ !== 'undefined' && $.writeln) {
            $.writeln((isError ? "ERROR: " : "") + logEntry);
        }
        debugInfo += logEntry + "\n";
        if (isError) {
            errorMessages.push("클립'" + clipName + "': " + message);
        }
    }

    try {
        logClipMsg("Processing started. Type: " + (timelineClip ? timelineClip.mediaType : "N/A"));

        if (!timelineClip || typeof timelineClip.name === 'undefined') {
            logClipMsg("Timeline clip is invalid or has no name. Skipping.", true);
            return {
                success: false,
                error: "선택된 항목 처리 불가 (인덱스: " + clipIndex + ", 유효하지 않은 클립 객체)",
                debugInfo: debugInfo
            };
        }

        // Step 1: Determine targetAudioTrackItem
        var targetAudioTrackItem = null;
        if (timelineClip.mediaType === "Video" && timelineClip.components && timelineClip.components.numItems > 0) {
            logClipMsg("Selected clip is Video. Searching for linked audio...");
            var foundLinkedAudio = findLinkedAudioTrackItem(seq, timelineClip, null); // Assuming findLinkedAudioTrackItem is defined elsewhere
            if (foundLinkedAudio) {
                targetAudioTrackItem = foundLinkedAudio;
                logClipMsg("Found linked audio clip: '" + (targetAudioTrackItem.name ? File.decode(targetAudioTrackItem.name) : "Unnamed") + "'. Setting as target.");
            } else {
                logClipMsg("No linked audio clip found for video clip. Skipping.", true);
                return {
                    success: false,
                    error: "클립 '" + File.decode(timelineClip.name) + "'(비디오): 연결된 오디오 없음.",
                    debugInfo: debugInfo
                };
            }
        } else if (timelineClip.mediaType === "Audio") {
            targetAudioTrackItem = timelineClip;
            logClipMsg("Selected clip is Audio. Setting as target.");
        } else {
            logClipMsg("Clip is not Audio or Video (Type: " + timelineClip.mediaType + "). Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 지원되지 않는 타입 (" + timelineClip.mediaType + ").",
                debugInfo: debugInfo
            };
        }

        if (!targetAudioTrackItem || typeof targetAudioTrackItem.name === 'undefined' ||
            !targetAudioTrackItem.duration || typeof targetAudioTrackItem.duration.seconds !== 'number' ||
            !targetAudioTrackItem.start || typeof targetAudioTrackItem.start.seconds !== 'number') {
            logClipMsg("Target audio track item is invalid or missing essential properties (name, duration, start). Skipping.", true);
            var problemClipName = timelineClip.name ? File.decode(timelineClip.name) : "(타임라인에서 선택된 초기 클립)";
            return {
                success: false,
                error: "클립 '" + problemClipName + "': 유효한 오디오 대상 설정 실패 또는 필수 속성 누락.",
                debugInfo: debugInfo
            };
        }

        var originalDuration = targetAudioTrackItem.duration.seconds;
        var originalStartTime = targetAudioTrackItem.start.seconds;
        logClipMsg("Target clip details: Original Name='" + File.decode(targetAudioTrackItem.name) + "', Start=" + originalStartTime.toFixed(2) + "s, Duration=" + originalDuration.toFixed(2) + "s.");

        // Step 2: Find the track for the targetAudioTrackItem
        var targetAudioTrackForInsertion = null;
        // Simplified track finding logic - assuming targetAudioTrackItem.track exists and is valid
        // The complex iteration can be a separate helper if needed again
        if (targetAudioTrackItem.track && targetAudioTrackItem.track.index >= 0) { // Basic check
            targetAudioTrackForInsertion = targetAudioTrackItem.track;
            logClipMsg("Track found for target audio item: Track Index=" + (targetAudioTrackForInsertion.index + 1) + ", ID=" + targetAudioTrackForInsertion.id);
        } else {
            // Fallback to iterative search if .track is not reliable
            logClipMsg("targetAudioTrackItem.track is not reliable. Falling back to iterative search...");
            if (seq && seq.audioTracks) {
                for (var tk_idx = 0; tk_idx < seq.audioTracks.numTracks; tk_idx++) {
                    var currentSeqTrack = seq.audioTracks[tk_idx];
                    if (currentSeqTrack && currentSeqTrack.clips) {
                        for (var cl_idx = 0; cl_idx < currentSeqTrack.clips.numItems; cl_idx++) {
                            var clipOnTrack = currentSeqTrack.clips[cl_idx];
                            if (clipOnTrack && clipOnTrack.projectItem && targetAudioTrackItem.projectItem &&
                                typeof clipOnTrack.projectItem.nodeId === 'string' &&
                                typeof targetAudioTrackItem.projectItem.nodeId === 'string' &&
                                clipOnTrack.projectItem.nodeId === targetAudioTrackItem.projectItem.nodeId &&
                                Math.abs(clipOnTrack.start.seconds - originalStartTime) < 0.01 &&
                                Math.abs(clipOnTrack.duration.seconds - originalDuration) < 0.01) {
                                targetAudioTrackForInsertion = currentSeqTrack;
                                logClipMsg("Track found via iteration: Track Index=" + (targetAudioTrackForInsertion.index + 1) + ", ID=" + targetAudioTrackForInsertion.id);
                                break;
                            }
                        }
                    }
                    if (targetAudioTrackForInsertion) break;
                }
            }
        }

        if (!targetAudioTrackForInsertion) {
            logClipMsg("Could not find the audio track for the target clip. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': 속한 트랙 찾기 실패.",
                debugInfo: debugInfo
            };
        }

        // Step 3: Get or import the sound project item
        var projectSoundItem = null;
        var importedFileNameForLog = "";
        try {
            importedFileNameForLog = File.decode(new File(soundFilePathToImport).name);
        } catch (fne) {
            /* ignore if file name cannot be decoded */
        }

        if (importedSoundItemsCache[soundFilePathToImport] && typeof importedSoundItemsCache[soundFilePathToImport].nodeId !== 'undefined') {
            projectSoundItem = importedSoundItemsCache[soundFilePathToImport];
            logClipMsg("Using cached ProjectItem: '" + (projectSoundItem.name ? File.decode(projectSoundItem.name) : importedFileNameForLog) + "'");
        } else {
            logClipMsg("Attempting to import ProjectItem: '" + importedFileNameForLog + "'");
            var importResultArray = app.project.importFiles([soundFilePathToImport]);
            if (importResultArray && importResultArray.length > 0 && importResultArray[0] && typeof importResultArray[0].nodeId !== 'undefined') {
                projectSoundItem = importResultArray[0];
                importedSoundItemsCache[soundFilePathToImport] = projectSoundItem; // Cache it
                logClipMsg("Import successful and cached: '" + (projectSoundItem.name ? File.decode(projectSoundItem.name) : importedFileNameForLog) + "' (nodeId: " + projectSoundItem.nodeId + ")");
            } else {
                logClipMsg("importFiles API failed or returned invalid item. Searching in root by name: '" + importedFileNameForLog + "'");
                var foundInRoot = false;
                if (app.project.rootItem && app.project.rootItem.children) {
                    for (var pi_idx = 0; pi_idx < app.project.rootItem.children.numItems; pi_idx++) {
                        var pi_child = app.project.rootItem.children[pi_idx];
                        if (pi_child && pi_child.name === importedFileNameForLog && typeof pi_child.nodeId !== 'undefined') {
                            projectSoundItem = pi_child;
                            importedSoundItemsCache[soundFilePathToImport] = projectSoundItem; // Cache it
                            logClipMsg("Found in root by name and cached: '" + File.decode(projectSoundItem.name) + "'");
                            foundInRoot = true;
                            break;
                        }
                    }
                }
                if (!foundInRoot) {
                    logClipMsg("Import and root search failed for: '" + importedFileNameForLog + "'. Skipping.", true);
                    return {
                        success: false,
                        error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': 새 사운드 임포트/검색 실패 (" + importedFileNameForLog + ")",
                        debugInfo: debugInfo
                    };
                }
            }
        }

        if (!projectSoundItem || typeof projectSoundItem.nodeId === 'undefined') {
            logClipMsg("Failed to obtain a valid ProjectItem for the sound file. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': 새 사운드 아이템 유효성 문제.",
                debugInfo: debugInfo
            };
        }
        if (typeof projectSoundItem.isSequence === 'function' && projectSoundItem.isSequence() === true) {
            logClipMsg("ProjectItem to insert is a sequence, which is not allowed for overwrite. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': 가져온 항목이 시퀀스임.",
                debugInfo: debugInfo
            };
        }


        // Step 4: Get new sound's actual media duration
        var newSoundActualMediaDuration = Infinity; // Default to Infinity if not obtainable
        if (projectSoundItem && typeof projectSoundItem.getDuration === 'function') {
            try {
                var durationObj = projectSoundItem.getDuration();
                if (durationObj && typeof durationObj.seconds === 'number') {
                    newSoundActualMediaDuration = durationObj.seconds;
                    logClipMsg("Original media duration of new sound ('" + (projectSoundItem.name ? File.decode(projectSoundItem.name) : importedFileNameForLog) + "'): " + newSoundActualMediaDuration.toFixed(4) + "s");
                } else {
                    logClipMsg("Warning: getDuration() for new sound did not return valid seconds. Media length limit might not apply.", false); // Not an error, but a warning
                }
            } catch (e_getDuration) {
                logClipMsg("Warning: Error calling getDuration() on new sound: " + e_getDuration.toString() + ". Media length limit might not apply.", false);
            }
        } else if (projectSoundItem) {
            logClipMsg("Warning: New sound ProjectItem does not have a getDuration method. Media length limit might not apply.", false);
        }

        // Step 5: Perform overwrite and adjust clip (This will be a call to another sub-helper function later)
        var time = new Time();
        time.seconds = originalStartTime;

        var clipToModify = null;
        var skipOverwriteDueToSameSource = (targetAudioTrackItem.projectItem && typeof targetAudioTrackItem.projectItem.nodeId === 'string' &&
            projectSoundItem.nodeId === targetAudioTrackItem.projectItem.nodeId);

        if (skipOverwriteDueToSameSource) {
            logClipMsg("New sound's ProjectItem ID is same as current clip's. Skipping 'overwriteClip', will modify existing timeline clip.");
            clipToModify = targetAudioTrackItem;
        } else {
            logClipMsg("Preparing to call overwriteClip: Track ID='" + targetAudioTrackForInsertion.id + "', ProjectItem='" + (projectSoundItem.name ? File.decode(projectSoundItem.name) : importedFileNameForLog) + "', Time=" + time.seconds.toFixed(2) + "s");
            var returnedClipFromAPI = null;
            if (targetAudioTrackForInsertion && typeof targetAudioTrackForInsertion.overwriteClip === 'function') {
                try {
                    returnedClipFromAPI = targetAudioTrackForInsertion.overwriteClip(projectSoundItem, time);
                } catch (owError) {
                    logClipMsg("Error during overwriteClip: " + owError.toString(), true);
                    return {
                        success: false,
                        error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': overwriteClip 실패(" + owError.toString() + ")",
                        debugInfo: debugInfo
                    };
                }
            } else {
                logClipMsg("targetAudioTrackForInsertion or overwriteClip method is invalid. Skipping overwrite.", true);
                return {
                    success: false,
                    error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': overwriteClip 메서드 접근 불가",
                    debugInfo: debugInfo
                };
            }

            if (returnedClipFromAPI && typeof returnedClipFromAPI.name !== 'undefined') {
                clipToModify = returnedClipFromAPI;
                logClipMsg("overwriteClip API returned a clip: '" + (clipToModify.name ? File.decode(clipToModify.name) : "Unnamed") + "'");
            } else {
                logClipMsg("Warning: overwriteClip API did not return a valid clip. Attempting to find it on timeline...");
                // Fallback search on timeline
                if (targetAudioTrackForInsertion && targetAudioTrackForInsertion.clips) {
                    for (var c_idx = 0; c_idx < targetAudioTrackForInsertion.clips.numItems; c_idx++) {
                        var clipOnTrack = targetAudioTrackForInsertion.clips[c_idx];
                        if (clipOnTrack && clipOnTrack.start && typeof clipOnTrack.start.seconds === 'number' &&
                            clipOnTrack.projectItem && typeof clipOnTrack.projectItem.nodeId === 'string' &&
                            projectSoundItem && typeof projectSoundItem.nodeId === 'string' &&
                            Math.abs(clipOnTrack.start.seconds - originalStartTime) < 0.01 &&
                            clipOnTrack.projectItem.nodeId === projectSoundItem.nodeId) {
                            clipToModify = clipOnTrack;
                            logClipMsg("Found overwritten clip on timeline by searching: '" + (clipToModify.name ? File.decode(clipToModify.name) : "Unnamed") + "'");
                            break;
                        }
                    }
                }
                if (!clipToModify) {
                    logClipMsg("Failed to find the overwritten clip on the timeline after API call. Skipping further processing for this clip.", true);
                    return {
                        success: false,
                        error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': 덮어쓴 클립 찾기 실패",
                        debugInfo: debugInfo
                    };
                }
            }
        }

        if (!clipToModify || typeof clipToModify.name === 'undefined' ||
            !clipToModify.start || typeof clipToModify.start.seconds !== 'number' ||
            !clipToModify.end || typeof clipToModify.end.seconds !== 'number' ||
            !clipToModify.duration || typeof clipToModify.duration.seconds !== 'number') {
            logClipMsg("Clip to modify is invalid or missing essential properties after overwrite/selection. Skipping length adjustment.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(targetAudioTrackItem.name) + "': 수정 대상 클립 유효성 문제",
                debugInfo: debugInfo
            };
        }

        logClipMsg("Adjusting length for clip: '" + File.decode(clipToModify.name) + "'. Current Start: " + clipToModify.start.seconds.toFixed(2) + "s");
        var clipStartSec = clipToModify.start.seconds;

        // Find nextClipOnTrackStartTime
        var nextClipOnTrackStartTime = Infinity;
        if (targetAudioTrackForInsertion && targetAudioTrackForInsertion.clips) {
            for (var nc_idx = 0; nc_idx < targetAudioTrackForInsertion.clips.numItems; nc_idx++) {
                var nextClipCandidate = targetAudioTrackForInsertion.clips[nc_idx];
                var isSelf = (nextClipCandidate && nextClipCandidate.projectItem && clipToModify.projectItem &&
                    nextClipCandidate.projectItem.nodeId === clipToModify.projectItem.nodeId &&
                    Math.abs(nextClipCandidate.start.seconds - clipStartSec) < 0.001);
                if (isSelf) continue;

                if (nextClipCandidate && nextClipCandidate.start.seconds > clipStartSec + 0.001) {
                    if (nextClipCandidate.start.seconds < nextClipOnTrackStartTime) {
                        nextClipOnTrackStartTime = nextClipCandidate.start.seconds;
                    }
                }
            }
        }
        if (isFinite(nextClipOnTrackStartTime)) {
            logClipMsg("Next clip on same track starts at: " + nextClipOnTrackStartTime.toFixed(4) + "s");
        } else {
            logClipMsg("No subsequent clip found on the same track.");
        }

        // Calculate finalEffectiveDuration
        var finalEffectiveDuration = originalDuration; // Target original duration first
        logClipMsg("Calculating final effective duration. Base (originalDuration): " + finalEffectiveDuration.toFixed(4) + "s");

        finalEffectiveDuration = Math.min(finalEffectiveDuration, newSoundActualMediaDuration);
        logClipMsg("After new sound media length (" + newSoundActualMediaDuration.toFixed(4) + "s) limit: " + finalEffectiveDuration.toFixed(4) + "s");

        var durationToNextClip = Infinity;
        if (isFinite(nextClipOnTrackStartTime)) {
            durationToNextClip = nextClipOnTrackStartTime - clipStartSec;
            if (durationToNextClip < 0) durationToNextClip = 0;
            finalEffectiveDuration = Math.min(finalEffectiveDuration, durationToNextClip);
            logClipMsg("After next clip (" + durationToNextClip.toFixed(4) + "s away) limit: " + finalEffectiveDuration.toFixed(4) + "s");
        }
        finalEffectiveDuration = Math.max(0.001, finalEffectiveDuration); // Ensure a very small positive duration
        logClipMsg("Final determined effective duration: " + finalEffectiveDuration.toFixed(4) + "s");

        // Set clipToModify.end
        var newEndSec = clipStartSec + finalEffectiveDuration;
        var newEndTime = new Time();
        newEndTime.seconds = newEndSec;
        logClipMsg("Calculated new end time (seconds): " + newEndSec.toFixed(4) + "s. Attempting to set clip.end.");

        try {
            clipToModify.end = newEndTime;
            logClipMsg("clip.end set. Actual new End: " + clipToModify.end.seconds.toFixed(4) + "s, Actual new Duration: " + clipToModify.duration.seconds.toFixed(4) + "s");
            clipSuccessfullyProcessed = true;

            var finalActualDurationOnTimeline = clipToModify.duration.seconds;
            if (Math.abs(finalActualDurationOnTimeline - finalEffectiveDuration) > 0.01) {
                logClipMsg("Warning: Final timeline duration (" + finalActualDurationOnTimeline.toFixed(2) + "s) differs from target effective duration (" + finalEffectiveDuration.toFixed(2) + "s). API limitation?", false);
                errorMessages.push("클립 '" + File.decode(clipToModify.name) + "': 길이 부분 조정됨 (실제: " + finalActualDurationOnTimeline.toFixed(2) + "s, 목표: " + finalEffectiveDuration.toFixed(2) + "s)");
            } else {
                logClipMsg("Clip length adjustment successful.");
            }
            // Add specific warnings if capped
            if (isFinite(newSoundActualMediaDuration) && finalEffectiveDuration < originalDuration && Math.abs(finalEffectiveDuration - newSoundActualMediaDuration) < 0.01) {
                errorMessages.push("클립 '" + File.decode(clipToModify.name) + "': 길이가 새 효과음의 원본 미디어 최대 길이(" + newSoundActualMediaDuration.toFixed(2) + "s)로 제한됨");
            } else if (isFinite(durationToNextClip) && finalEffectiveDuration < originalDuration && Math.abs(finalEffectiveDuration - durationToNextClip) < 0.01) {
                errorMessages.push("클립 '" + File.decode(clipToModify.name) + "': 다음 클립과의 간섭을 피하기 위해 길이가 " + durationToNextClip.toFixed(2) + "s로 제한됨");
            }


        } catch (e_setEnd) {
            logClipMsg("Error setting clip.end: " + e_setEnd.toString(), true);
            // errorMessages.push already handled by logClipMsg
            return {
                success: false,
                error: "클립 '" + File.decode(clipToModify.name) + "': 새 끝점 설정 실패 (" + e_setEnd.toString() + ")",
                debugInfo: debugInfo
            };
        }

        logClipMsg("Processing finished for this clip.");
        return {
            success: clipSuccessfullyProcessed,
            error: errorMessages.length > 0 ? errorMessages.join("; ") : null,
            debugInfo: debugInfo
        };

    } catch (e) {
        logClipMsg("CRITICAL ERROR in " + functionName + ": " + e.toString() + (e.line ? " (Line: " + e.line + ")" : ""), true);
        // errorMessages.push already handled by logClipMsg
        return {
            success: false,
            error: "클립 처리 중 예외: " + e.toString(),
            debugInfo: debugInfo
        };
    }
}


// Helper function to find linked audio
// 기존 findLinkedAudioTrackItem 함수는 유지 (필요시 수정)
function findLinkedAudioTrackItem(sequence, videoClip, audioComponent) { // audioComponent 파라미터는 현재 사용 안함, videoClip만으로 탐색
    try {
        if (!videoClip || !videoClip.components) {
            $.writeln("findLinkedAudioTrackItem: videoClip 또는 components가 유효하지 않음.");
            return null;
        }

        for (var compIdx = 0; compIdx < videoClip.components.numItems; compIdx++) {
            var component = videoClip.components[compIdx];
            if (component && component.mediaType === "Audio") {
                // 비디오 클립에 연결된 오디오 컴포넌트의 시작 시간과 유사한 오디오 트랙 아이템을 찾습니다.
                // 이 방법은 완벽하지 않을 수 있으며, 여러 오디오 클립이 링크된 경우 첫 번째 매칭되는 것을 반환할 수 있습니다.
                for (var i = 0; i < sequence.audioTracks.numTracks; i++) {
                    var track = sequence.audioTracks[i];
                    for (var j = 0; j < track.clips.numItems; j++) {
                        var audioTrackItem = track.clips[j];
                        // 컴포넌트의 projectItem과 트랙 아이템의 projectItem이 동일한지 확인 (더 정확한 방법)
                        if (component.projectItem && audioTrackItem.projectItem && component.projectItem.nodeId === audioTrackItem.projectItem.nodeId) {
                            // 또한, 비디오 클립의 시간 범위와 오디오 클립의 시간 범위가 겹치는지 확인
                            var videoStart = videoClip.start.seconds;
                            var videoEnd = videoClip.end.seconds;
                            var audioStart = audioTrackItem.start.seconds;
                            var audioEnd = audioTrackItem.end.seconds;

                            // 대략적인 시간 일치 확인 (컴포넌트 시작 시간과 트랙 아이템 시작 시간)
                            // 또는 비디오 클립 범위 내에 오디오 클립이 시작하는지 등
                            if (Math.abs(videoStart - audioStart) < 0.1 || (audioStart >= videoStart && audioStart < videoEnd)) {
                                $.writeln("findLinkedAudioTrackItem: 연결된 오디오 후보 '" + File.decode(audioTrackItem.name) + "' 발견 on track " + (i + 1));
                                return audioTrackItem;
                            }
                        }
                    }
                }
            }
        }
        $.writeln("findLinkedAudioTrackItem: 비디오 '" + File.decode(videoClip.name) + "'에 대해 연결된 오디오 클립을 찾지 못함.");
    } catch (e) {
        $.writeln("findLinkedAudioTrackItem 오류: " + e.toString());
    }
    return null;
}

// 새 함수: JS에서 경로를 받아 해당 경로의 파일 목록을 가져와 FileListEvent를 발생시키는 함수
function getFilesForPathCS(folderPathFromJS) {
    var functionName = "getFilesForPathCS"; // For log prefix
    var logPrefix = "[" + functionName + "] ";
    try {
        $.writeln(logPrefix + "Execution started.");
        $.writeln(logPrefix + "Received folderPathFromJS: '" + folderPathFromJS + "' (Type: " + typeof folderPathFromJS + ")");

        if (!folderPathFromJS || typeof folderPathFromJS !== 'string' || folderPathFromJS.replace(/\s/g, '').length === 0) {
            var errMsgInvalidPath = "Error: folderPathFromJS is invalid or empty. Value: '" + folderPathFromJS + "'";
            $.writeln(logPrefix + errMsgInvalidPath);
            return "error: JSX exception - Invalid folder path received: " + folderPathFromJS;
        }

        var pathForFolderObject = folderPathFromJS.toString();
        $.writeln(logPrefix + "Path to be used for new Folder(): '" + pathForFolderObject + "'");

        var folder = new Folder(pathForFolderObject);

        $.writeln(logPrefix + "Folder object created. Checking existence for: " + folder.fsName);
        if (!folder.exists) {
            var errMsgFolderNotExist = "Error: Folder does not exist at path: '" + pathForFolderObject + "'. Resolved path: " + (folder.resolve ? folder.resolve() : "N/A");
            $.writeln(logPrefix + errMsgFolderNotExist);
            return "error: JSX exception - Folder does not exist: " + folder.fsName;
        }

        $.writeln(logPrefix + "Folder exists: " + folder.fsName);

        var soundFilesResult = getSoundFilesFromFolder(pathForFolderObject, false);

        // getSoundFilesFromFolder는 이제 항상 객체 { files: [], path: "" } 를 반환 (폴더 존재 시)
        // null 체크는 getSoundFilesFromFolder 내부에서 폴더 미존재 등 심각한 오류 발생 시에만 해당됨
        // 하지만 방어적으로 체크 추가
        if (!soundFilesResult || typeof soundFilesResult.files === 'undefined' || typeof soundFilesResult.path === 'undefined') {
            $.writeln(logPrefix + "Error: getSoundFilesFromFolder did not return a valid object. Result: " + soundFilesResult);
            // 이 경우 FileListEvent를 보내지 않거나, 오류를 명시하는 이벤트를 보낼 수 있음
            // 여기서는 일단 오류를 반환하고 JS쪽에서 처리하도록 함
            return "error: JSX exception - Failed to retrieve file list structure from getSoundFilesFromFolder";
        }

        $.writeln(logPrefix + "Found " + soundFilesResult.files.length + " files from getSoundFilesFromFolder for path: " + soundFilesResult.path);

        var event = new CSXSEvent();
        event.type = "com.adobe.soundInserter.events.FileListEvent";
        event.data = JSON.stringify({
            soundFiles: soundFilesResult.files, // soundFilesResult.files 사용
            folderPath: soundFilesResult.path // soundFilesResult.path 사용
        });
        event.scope = "APPLICATION";
        // Ensure csInterface is accessible here
        // event.appId = csInterface.getApplicationID(); // 주석 처리
        // event.extensionId = csInterface.getExtensionID(); // 주석 처리
        // csInterface.dispatchEvent(event); // 주석 처리
        event.dispatch(); // CSXSEvent 객체의 dispatch 메소드 사용으로 변경

        $.writeln(logPrefix + "Dispatched FileListEvent for path: " + soundFilesResult.path);
        return "success_getFilesForPathCS";

    } catch (e) {
        var errorMsg = logPrefix + "CRITICAL ERROR: " + e.name + " - " + e.message + " (Line: " + e.line + ", File: " + e.fileName + ")";
        $.writeln(errorMsg);
        if (e.stack) {
            $.writeln(logPrefix + "Stack: " + e.stack);
        }
        return "error: JSX exception - " + e.name + ": " + e.message;
    }
}