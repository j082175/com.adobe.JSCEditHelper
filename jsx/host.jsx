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
        var soundFiles = getSoundFilesFromFolder(folderPath, true);
        if (!soundFiles || soundFiles.length === 0) {
            sendEvent("지정된 폴더에서 'Default'로 시작하는 사용 가능한 효과음 파일을 찾을 수 없습니다.", false);
            return "false";
        }
        debugInfo += "효과음 파일 수: " + soundFiles.length + "\n";
        if (soundFiles.length > 0 && soundFiles[0]) {
            debugInfo += "첫 번째 효과음 파일 (샘플): " + File.decode(soundFiles[0].name) + "\n";
        }

        var importedSoundItemsCache = {};

        var targetAudioTrack = null;
        debugInfo += "오디오 트랙 결정 시작. 요청 트랙: " + audioTrack + "\n";
        $.writeln("오디오 트랙 결정 시작. 요청 트랙: " + audioTrack);

        if (audioTrack === "auto") {
            var foundEmptyTrack = false;
            for (var tk = 1; tk < seq.audioTracks.numTracks; tk++) {
                var currentTrack = seq.audioTracks[tk];
                if (currentTrack.clips.numItems === 0) {
                    targetAudioTrack = currentTrack;
                    debugInfo += "자동 오디오 트랙 선택: 빈 트랙 " + (targetAudioTrack.index + 1) + "\n";
                    $.writeln("자동 오디오 트랙 선택: 빈 트랙 " + (targetAudioTrack.index + 1));
                    foundEmptyTrack = true;
                    break;
                }
            }
            if (!foundEmptyTrack) {
                if (seq.audioTracks.numTracks > 0) {
                    targetAudioTrack = seq.audioTracks[0];
                    debugInfo += "자동 오디오 트랙: 빈 A2+ 트랙 없어 트랙 1 사용.\n";
                    $.writeln("자동 오디오 트랙: 빈 A2+ 트랙 없어 트랙 1 사용.");
                } else {
                    sendEvent("시퀀스에 오디오 트랙이 없습니다 (자동 선택 중).", false);
                    return "false";
                }
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
                            justInsertedClip.end = justInsertedClip.start.seconds + targetDuration;
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
            debug: debugInfo + "\\n\\n" + errorMsg
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

        if (soundFileDetails.length === 0) {
            $.writeln("조건을 만족하는 오디오 파일을 찾지 못함");
            return null;
        }
        return soundFileDetails;
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
            var allSoundFiles = getSoundFilesFromFolder(path, false);

            var eventData = {
                folderPath: path,
                soundFiles: allSoundFiles ? allSoundFiles : []
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
    try {
        var debugInfo = "replaceSelectedAudioClips 호출됨. 사운드 파일 경로: " + soundFilePathToImport + "\n";
        $.writeln("replaceSelectedAudioClips 호출됨. 사운드 파일 경로: " + soundFilePathToImport);

        var seq = app.project.activeSequence;
        if (!seq) {
            debugInfo += "오류: 활성화된 시퀀스가 없습니다.\n";
            sendEvent(JSON.stringify({
                message: "replaceSelectedAudioClips: 활성화된 시퀀스가 없습니다.",
                success: false,
                debug: debugInfo
            }));
            return "false";
        }
        debugInfo += "활성 시퀀스: " + seq.name + "\n";

        var selectedClipsOnTimeline = seq.getSelection();
        if (!selectedClipsOnTimeline || selectedClipsOnTimeline.length === 0) {
            debugInfo += "오류: 대체할 클립이 선택되지 않았습니다.\n";
            sendEvent(JSON.stringify({
                message: "replaceSelectedAudioClips: 대체할 클립을 하나 이상 선택해주세요.",
                success: false,
                debug: debugInfo
            }));
            return "false";
        }
        debugInfo += "선택된 타임라인 클립 수: " + selectedClipsOnTimeline.length + "\n";
        var firstClipName = "N/A";
        if (selectedClipsOnTimeline[0] && selectedClipsOnTimeline[0].name) {
            firstClipName = File.decode(selectedClipsOnTimeline[0].name);
        }
        debugInfo += "첫 번째 선택된 클립 이름: " + firstClipName + "\n";

        var message = "replaceSelectedAudioClips: " + selectedClipsOnTimeline.length + "개 클립 선택됨 (실제 동작 없음 - UI 테스트용).";
        $.writeln(message);

        // UI 테스트를 위해 임시로 항상 성공으로 처리하고, 간단한 정보만 포함된 이벤트를 전송합니다.
        sendEvent(JSON.stringify({
            message: message,
            success: true, // 중요: UI 업데이트를 위해 success: true로 설정
            debug: debugInfo + "\n최종 결과: " + message
        }));
        return "true";

    } catch (e) {
        var errorMsg = "replaceSelectedAudioClips 실행 중 심각한 오류 발생: " + e.toString() + (e.line ? " (라인: " + e.line + ")" : "");
        $.writeln(errorMsg);
        sendEvent(JSON.stringify({
            message: errorMsg,
            success: false,
            debug: errorMsg
        }));
        return "false";
    }
}

// Helper function to find linked audio (this is a simplified example)
// Premiere Pro's ExtendScript API for reliably finding a specific TrackItem linked to a video component can be tricky.
// This helper might need significant improvement or alternative approaches for robustness.
function findLinkedAudioTrackItem(sequence, videoClip, audioComponent) {
    try {
        var videoClipProjectItemName = videoClip.projectItem ? videoClip.projectItem.name : null;
        var audioComponentProjectItemName = audioComponent.projectItem ? audioComponent.projectItem.name : null;

        if (!audioComponentProjectItemName) return null;

        for (var i = 0; i < sequence.audioTracks.numTracks; i++) {
            var track = sequence.audioTracks[i];
            for (var j = 0; j < track.clips.numItems; j++) {
                var audioTrackItem = track.clips[j];
                // Check if the audio track item's projectItem matches the audio component's projectItem
                // And if its time range overlaps with the video clip's time range
                var audioTrackItemProjectItemName = audioTrackItem.projectItem ? audioTrackItem.projectItem.name : null;

                if (audioTrackItemProjectItemName === audioComponentProjectItemName) {
                    // Basic time overlap check (can be made more precise)
                    var videoStart = videoClip.start.seconds;
                    var videoEnd = videoClip.end.seconds;
                    var audioStart = audioTrackItem.start.seconds;
                    var audioEnd = audioTrackItem.end.seconds;

                    // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
                    if (videoStart < audioEnd && videoEnd > audioStart) {
                        // A more specific check might involve ensuring the linked audio is *primarily* associated with this video clip,
                        // especially if audio clips can span multiple video clips or are longer.
                        // For now, first match is returned.
                        $.writeln("연결된 오디오 후보 발견: '" + File.decode(audioTrackItem.name) + "' on track " + (i + 1) + " for video '" + File.decode(videoClip.name) + "'");
                        return audioTrackItem;
                    }
                }
            }
        }
    } catch (e) {
        $.writeln("findLinkedAudioTrackItem 오류: " + e.toString());
    }
    $.writeln("비디오 '" + File.decode(videoClip.name) + "'에 대해 연결된 오디오 클립을 찾지 못함 (컴포넌트: " + (audioComponentProjectItemName ? File.decode(audioComponentProjectItemName) : "N/A") + ")");
    return null;
}