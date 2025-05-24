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
    try {
        var seq = app.project.activeSequence;
        var initialDebugInfo = "클립 대체 작업 시작. 대상 효과음: " + File.decode(new File(soundFilePathToImport).name) + " (" + soundFilePathToImport + ")\n";
        $.writeln(initialDebugInfo.replace(/\n/g, "")); // 로그에는 줄바꿈 없이 출력
        var debugInfo = initialDebugInfo;

        if (!seq) {
            debugInfo += "오류: 활성화된 시퀀스가 없습니다.\n";
            sendEvent(JSON.stringify({
                message: "클립 대체를 위해 활성화된 시퀀스가 없습니다.",
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
                message: "대체할 클립을 하나 이상 선택해주세요.",
                success: false,
                debug: debugInfo
            }));
            return "false";
        }
        debugInfo += "선택된 타임라인 클립 수: " + selectedClipsOnTimeline.length + "\n";
        for (var sel_idx = 0; sel_idx < selectedClipsOnTimeline.length; sel_idx++) {
            var s_clip = selectedClipsOnTimeline[sel_idx];
            debugInfo += "  선택된 클립[" + sel_idx + "]: " + (s_clip && s_clip.name ? File.decode(s_clip.name) : "이름없음/유효하지않음") + ", 타입: " + (s_clip ? s_clip.mediaType : "타입없음") + ", 트랙인덱스: " + (s_clip && s_clip.trackIndex !== undefined ? s_clip.trackIndex : " 정의안됨") + "\n";
        }

        var importedSoundItemsCache = {}; // 나중에 사용될 임포트 캐시
        var replacementCount = 0;
        var errors = [];

        for (var i = 0; i < selectedClipsOnTimeline.length; i++) {
            var timelineClip = selectedClipsOnTimeline[i];
            var currentClipDebug = "\n처리 시작: 선택된 클립 루프 인덱스 " + i + ", 이름: '" + (timelineClip && timelineClip.name ? File.decode(timelineClip.name) : "N/A") + "', 타입: " + (timelineClip ? timelineClip.mediaType : "N/A") + "\n";
            $.writeln(currentClipDebug.replace(/\n/g, ""));
            debugInfo += currentClipDebug;

            var targetAudioTrackItem = null;
            var originalAudioClipToRemove = null; // 제거 대상이 될 실제 TrackItem
            var originalDuration = null;
            var originalStartTime = null;
            var targetAudioTrackForInsertion = null; // 새 클립이 삽입될 AudioTrack

            if (!timelineClip || typeof timelineClip.name === 'undefined') { // name 속성 존재 여부로 유효성 검사 강화
                debugInfo += "  루프 아이템 timelineClip이 유효하지 않거나 이름이 없습니다. 건너뜀.\n";
                errors.push("선택된 항목 처리 불가 (인덱스: " + i + ", 유효하지 않은 클립 객체)");
                continue;
            }

            if (timelineClip.mediaType === "Video" && timelineClip.components) {
                debugInfo += "  선택된 클립 '" + File.decode(timelineClip.name) + "'은 비디오 클립. 연결된 오디오 검색...\n";
                var foundLinkedAudio = findLinkedAudioTrackItem(seq, timelineClip, null); // audioComponent를 null로 전달하여 내부 로직 활용 또는 수정 필요
                if (foundLinkedAudio) {
                    targetAudioTrackItem = foundLinkedAudio;
                    originalAudioClipToRemove = foundLinkedAudio;
                    debugInfo += "    연결된 오디오 클립 '" + File.decode(targetAudioTrackItem.name) + "' 발견. 이 클립을 대상으로 설정.\n";
                } else {
                    debugInfo += "    비디오 클립 '" + File.decode(timelineClip.name) + "'에 연결된 처리 가능한 오디오 클립을 찾지 못했습니다. 건너뜀.\n";
                    errors.push("클립 '" + File.decode(timelineClip.name) + "'(비디오): 연결된 오디오 없음.");
                    continue;
                }
            } else if (timelineClip.mediaType === "Audio") {
                targetAudioTrackItem = timelineClip;
                originalAudioClipToRemove = timelineClip;
                debugInfo += "  선택된 오디오 클립 '" + File.decode(targetAudioTrackItem.name) + "' 직접 처리. 이 클립을 대상으로 설정.\n";
            } else {
                debugInfo += "  선택된 항목 '" + File.decode(timelineClip.name) + "'은(는) 오디오 또는 비디오 클립이 아닙니다 (타입: " + timelineClip.mediaType + "). 건너뜀.\n";
                errors.push("클립 '" + File.decode(timelineClip.name) + "': 지원되지 않는 타입 (" + timelineClip.mediaType + ").");
                continue;
            }

            if (targetAudioTrackItem && typeof targetAudioTrackItem.name !== 'undefined') {
                originalDuration = targetAudioTrackItem.duration.seconds;
                originalStartTime = targetAudioTrackItem.start.seconds;

                var foundTrackOfClip = null;
                var clipTrackIndex = -1; // AudioTrack 배열에서의 인덱스
                for (var tk_idx = 0; tk_idx < seq.audioTracks.numTracks; tk_idx++) {
                    var currentSeqTrack = seq.audioTracks[tk_idx];
                    for (var cl_idx = 0; cl_idx < currentSeqTrack.clips.numItems; cl_idx++) {
                        var clipOnTrack = currentSeqTrack.clips[cl_idx];
                        // targetAudioTrackItem (선택에서 가져온 클립)과 트랙 위의 클립(clipOnTrack) 비교
                        if (clipOnTrack.projectItem && targetAudioTrackItem.projectItem && // 두 클립 모두 projectItem을 가져야 함
                            clipOnTrack.projectItem.nodeId === targetAudioTrackItem.projectItem.nodeId &&
                            Math.abs(clipOnTrack.start.seconds - targetAudioTrackItem.start.seconds) < 0.01 &&
                            Math.abs(clipOnTrack.duration.seconds - targetAudioTrackItem.duration.seconds) < 0.01) {
                            foundTrackOfClip = currentSeqTrack;
                            clipTrackIndex = tk_idx;
                            // originalAudioClipToRemove = clipOnTrack; // <--- 이 라인을 주석 처리하여, originalAudioClipToRemove가 트랙 검색 결과로 덮어씌워지지 않도록 함
                            break;
                        }
                    }
                    if (foundTrackOfClip) break;
                }

                if (foundTrackOfClip && clipTrackIndex >= 0) {
                    targetAudioTrackForInsertion = foundTrackOfClip;
                    debugInfo += "  대상 클립 정보 확정 (targetAudioTrackItem): 원본 이름='" + File.decode(targetAudioTrackItem.name) + "', 시작=" + originalStartTime.toFixed(2) + "s, 길이=" + originalDuration.toFixed(2) + "s. 이 클립이 위치한 트랙 ID='" + targetAudioTrackForInsertion.id + "' (배열 인덱스: " + clipTrackIndex + ")\n";

                    // === 1. 원본 오디오 클립 길이를 0으로 만들어 사실상 제거 시도 ===
                    var originalClipMadeZeroLength = false;
                    if (targetAudioTrackItem && typeof targetAudioTrackItem.start !== 'undefined' && typeof targetAudioTrackItem.end !== 'undefined') {
                        try {
                            var originalClipNameForLog = File.decode(targetAudioTrackItem.name);
                            debugInfo += "    원본 오디오 클립 '" + originalClipNameForLog + "'의 길이를 0으로 설정 시도 (시작: " + targetAudioTrackItem.start.seconds.toFixed(2) + "s, 현재 끝: " + targetAudioTrackItem.end.seconds.toFixed(2) + "s)...\n";
                            $.writeln("    원본 오디오 클립 '" + originalClipNameForLog + "'의 길이를 0으로 설정 시도...");

                            var originalClipStartPoint = new Time();
                            originalClipStartPoint.seconds = targetAudioTrackItem.start.seconds;

                            targetAudioTrackItem.end = originalClipStartPoint;

                            if (typeof targetAudioTrackItem.setSelected === 'function') targetAudioTrackItem.setSelected(false, true);

                            debugInfo += "      원본 클립 '" + originalClipNameForLog + "'의 end를 start와 동일하게 설정 완료 (이론상 길이 0). 다음 단계 진행.\n";
                            $.writeln("      원본 클립 '" + originalClipNameForLog + "'의 end를 start와 동일하게 설정 완료.");
                            originalClipMadeZeroLength = true;

                        } catch (e_zero) {
                            debugInfo += "    경고: 원본 오디오 클립의 길이를 0으로 설정 중 오류 발생: " + e_zero.toString() + "\n";
                            $.writeln("    경고: 원본 오디오 클립의 길이를 0으로 설정 중 오류 발생: " + e_zero.toString());
                            errors.push("클립 '" + File.decode(targetAudioTrackItem.name) + "': 길이 0 설정 실패 (" + e_zero.toString() + ")");
                            continue;
                        }
                    } else {
                        debugInfo += "    경고: 원본 오디오 클립의 start/end 속성이 유효하지 않아 길이 0 설정 불가.\n";
                        errors.push("클립 '" + (targetAudioTrackItem && targetAudioTrackItem.name ? File.decode(targetAudioTrackItem.name) : "알수없는클립") + "': start/end 유효하지 않음.");
                        continue;
                    }

                    // === 2. 새 효과음 파일 가져오기 (캐시 사용) ===
                    if (originalClipMadeZeroLength) {
                        var projectSoundItem = importedSoundItemsCache[soundFilePathToImport];
                        if (!projectSoundItem || projectSoundItem.treePath === undefined) {
                            debugInfo += "    캐시에 없거나 유효하지 않음. '" + File.decode(new File(soundFilePathToImport).name) + "' 임포트 시도...\n";
                            var importResultArray = app.project.importFiles([soundFilePathToImport]);
                            if (importResultArray && importResultArray.length > 0 && importResultArray[0]) {
                                projectSoundItem = importResultArray[0];
                                importedSoundItemsCache[soundFilePathToImport] = projectSoundItem;
                                debugInfo += "      임포트 성공 및 캐시 저장: " + File.decode(projectSoundItem.name) + " (nodeId: " + (projectSoundItem.nodeId ? projectSoundItem.nodeId : "N/A") + ")\n";
                            } else {
                                var importedFileName = File.decode(new File(soundFilePathToImport).name);
                                debugInfo += "      importFiles API 실패. 루트에서 이름으로 재검색 시도: " + importedFileName + "\n";
                                var foundInRoot = false;
                                for (var pi_idx = 0; pi_idx < app.project.rootItem.children.numItems; pi_idx++) {
                                    var pi_child = app.project.rootItem.children[pi_idx];
                                    if (pi_child.name === importedFileName) {
                                        projectSoundItem = pi_child;
                                        importedSoundItemsCache[soundFilePathToImport] = projectSoundItem;
                                        debugInfo += "        이름으로 재검색 성공 및 캐시 저장: " + File.decode(projectSoundItem.name) + "\n";
                                        foundInRoot = true;
                                        break;
                                    }
                                }
                                if (!foundInRoot) {
                                    debugInfo += "      임포트 및 이름으로 재검색 모두 실패: " + importedFileName + "\n";
                                    errors.push("클립 '" + File.decode(targetAudioTrackItem.name) + "': 새 사운드 임포트 실패 (" + importedFileName + ")");
                                    continue;
                                }
                            }
                        } else {
                            debugInfo += "    캐시에서 '" + File.decode(projectSoundItem.name) + "' 사용.\n";
                        }

                        // === 3. 새 효과음 삽입 (overwriteClip) 및 길이 조절 ===
                        if (projectSoundItem && projectSoundItem.name !== undefined) {
                            if (targetAudioTrackForInsertion && projectSoundItem.isSequence() === false) {
                                var time = new Time();
                                time.seconds = originalStartTime;

                                debugInfo += "    overwriteClip 호출 준비: 대상 트랙 ID='" + targetAudioTrackForInsertion.id + "', ProjectItem 이름='" + File.decode(projectSoundItem.name) + "', 삽입 시간=" + time.seconds.toFixed(2) + "s\n";
                                $.writeln("    overwriteClip 호출 준비: 대상 트랙 ID='" + targetAudioTrackForInsertion.id + "', ProjectItem 이름='" + File.decode(projectSoundItem.name) + "', 삽입 시간=" + time.seconds.toFixed(2) + "s");

                                targetAudioTrackForInsertion.overwriteClip(projectSoundItem, time);
                                debugInfo += "    overwriteClip 호출 완료. 효과음 '" + File.decode(projectSoundItem.name) + "'을(를) " + time.seconds.toFixed(2) + "s에 덮어쓰기 시도.\n";
                                $.writeln("    overwriteClip 호출 완료. 효과음 '" + File.decode(projectSoundItem.name) + "'을(를) " + time.seconds.toFixed(2) + "s에 덮어쓰기 시도.");

                                // --- overwriteClip 후 트랙 상태 상세 로깅 시작 ---
                                debugInfo += "      overwriteClip 후 트랙 (ID: " + targetAudioTrackForInsertion.id + ") 클립 상세 정보 로깅 시작:\n";
                                $.writeln("      overwriteClip 후 트랙 (ID: " + targetAudioTrackForInsertion.id + ") 클립 상세 정보 로깅 시작:");
                                if (targetAudioTrackForInsertion.clips.numItems > 0) {
                                    for (var logIdx = 0; logIdx < targetAudioTrackForInsertion.clips.numItems; logIdx++) {
                                        var logClip = targetAudioTrackForInsertion.clips[logIdx];
                                        var clipName = logClip.name ? File.decode(logClip.name) : "N/A";
                                        var clipStart = logClip.start ? logClip.start.seconds.toFixed(4) : "N/A";
                                        var clipDuration = logClip.duration ? logClip.duration.seconds.toFixed(4) : "N/A";
                                        var clipNodeId = (logClip.projectItem && logClip.projectItem.nodeId) ? logClip.projectItem.nodeId : "N/A";
                                        var clipProjectItemName = (logClip.projectItem && logClip.projectItem.name) ? File.decode(logClip.projectItem.name) : "N/A";

                                        debugInfo += "        클립[" + logIdx + "]: 이름='" + clipName + "', 시작=" + clipStart + "s, 길이=" + clipDuration + "s, ProjectItem이름='" + clipProjectItemName + "', NodeID=" + clipNodeId + "\n";
                                        $.writeln("        클립[" + logIdx + "]: 이름='" + clipName + "', 시작=" + clipStart + "s, 길이=" + clipDuration + "s, PIName='" + clipProjectItemName + "', NodeID=" + clipNodeId);
                                    }
                                } else {
                                    debugInfo += "        트랙에 클립이 없습니다.\n";
                                    $.writeln("        트랙에 클립이 없습니다.");
                                }
                                debugInfo += "      예상되는 덮어쓴 클립의 projectSoundItem.nodeId: " + (projectSoundItem ? projectSoundItem.nodeId : "N/A") + ", 이름: " + (projectSoundItem ? File.decode(projectSoundItem.name) : "N/A") + "\n";
                                debugInfo += "      예상되는 덮어쓴 클립의 originalStartTime: " + originalStartTime.toFixed(4) + "\n";
                                $.writeln("      예상되는 덮어쓴 클립의 projectSoundItem.nodeId: " + (projectSoundItem ? projectSoundItem.nodeId : "N/A") + ", 이름: " + (projectSoundItem ? File.decode(projectSoundItem.name) : "N/A"));
                                $.writeln("      예상되는 덮어쓴 클립의 originalStartTime: " + originalStartTime.toFixed(4));
                                debugInfo += "      --- 트랙 클립 상세 로깅 끝 ---\n";
                                // --- overwriteClip 후 트랙 상태 상세 로깅 끝 ---

                                var justOverwrittenClip = null;
                                for (var clipIdx = 0; clipIdx < targetAudioTrackForInsertion.clips.numItems; clipIdx++) {
                                    var currentClip = targetAudioTrackForInsertion.clips[clipIdx];
                                    if (currentClip.projectItem && currentClip.projectItem.nodeId === projectSoundItem.nodeId &&
                                        Math.abs(currentClip.start.seconds - originalStartTime) < 0.01) {
                                        justOverwrittenClip = currentClip;
                                        debugInfo += "      덮어쓴 클립 확인: '" + File.decode(justOverwrittenClip.name) + "', 시작: " + justOverwrittenClip.start.seconds.toFixed(2) + "s\n";
                                        $.writeln("      덮어쓴 클립 확인: '" + File.decode(justOverwrittenClip.name) + "', 시작: " + justOverwrittenClip.start.seconds.toFixed(2) + "s");
                                        break;
                                    }
                                }

                                if (justOverwrittenClip) {
                                    debugInfo += "      덮어쓴 클립 '" + File.decode(justOverwrittenClip.name) + "'의 원본 길이: " + justOverwrittenClip.duration.seconds.toFixed(2) + "s. 목표 길이(원본 오디오 클립 기준): " + originalDuration.toFixed(2) + "s\n";
                                    justOverwrittenClip.end = justOverwrittenClip.start.seconds + originalDuration;
                                    var finalDuration = justOverwrittenClip.duration.seconds;
                                    debugInfo += "        덮어쓴 클립 길이 조정 완료. 새 길이: " + finalDuration.toFixed(2) + "s\n";
                                    $.writeln("        덮어쓴 클립 길이 조정 완료. 새 길이: " + finalDuration.toFixed(2) + "s");

                                    replacementCount++;
                                } else {
                                    debugInfo += "    오류: 덮어쓴 클립을 타임라인에서 찾지 못해 길이 조정을 실패했습니다.\n";
                                    errors.push("클립 '" + File.decode(targetAudioTrackItem.name) + "': 덮어쓴 클립 확인/길이조정 실패.");
                                }
                            } else {
                                if (!targetAudioTrackForInsertion) debugInfo += "    오류: 새 클립을 삽입할 대상 오디오 트랙이 유효하지 않습니다.\n";
                                if (projectSoundItem.isSequence()) debugInfo += "    오류: 가져온 항목이 시퀀스이므로 오디오 트랙에 삽입할 수 없습니다.\n";
                                errors.push("클립 '" + File.decode(targetAudioTrackItem.name) + "': 삽입 대상 트랙 또는 사운드 아이템 문제.");
                            }
                        } else {
                            debugInfo += "    오류: 유효한 projectSoundItem을 가져오지 못했습니다. 삽입 건너뜀.\n";
                            errors.push("클립 '" + File.decode(targetAudioTrackItem.name) + "': 새 사운드 아이템 준비 실패.");
                        }
                    }
                } else {
                    debugInfo += "  오류: 대상 오디오 클립('" + File.decode(targetAudioTrackItem.name) + "')이 속한 정확한 오디오 트랙을 찾지 못했습니다. 건너뜀.\n";
                    errors.push("클립 '" + File.decode(targetAudioTrackItem.name) + "': 정확한 트랙 정보 찾기 실패.");
                    continue;
                }
            } else {
                debugInfo += "  오류: 유효한 대상 오디오 클립(targetAudioTrackItem)을 설정하지 못했습니다. 건너뜀.\n";
                var problemClipName = timelineClip.name ? File.decode(timelineClip.name) : "(타임라인에서 선택된 초기 클립)";
                errors.push("클립 '" + problemClipName + "': 유효한 오디오 대상 설정 실패.");
                continue;
            }
        } // end of for loop

        var finalMessage = replacementCount + "개의 클립 제거 시도 완료.";
        if (errors.length > 0) {
            finalMessage += " (오류: " + errors.length + "개 - " + errors.join(", ") + ")";
        } else if (replacementCount > 0) {
            finalMessage += " 모두 성공.";
        } else if (selectedClipsOnTimeline && selectedClipsOnTimeline.length > 0) { // 선택된 클립이 있었으나 아무것도 처리(제거)되지 않은 경우
            finalMessage = "선택된 클립에 대해 제거 작업이 수행되지 않았습니다. 로그를 확인하세요.";
        } else { // 애초에 선택된 클립이 없는 경우 (이 경우는 함수 초반에 걸러지만 방어적으로)
            finalMessage = "제거할 대상 클립이 없거나 처리 중 문제가 발생했습니다.";
        }

        $.writeln("최종 결과 (클립 제거 시도): " + finalMessage);
        sendEvent(JSON.stringify({
            message: finalMessage,
            success: errors.length === 0 && replacementCount > 0, // 성공 조건: 오류 없고, 하나 이상 제거됨
            debug: debugInfo + "\n최종 결과: " + finalMessage
        }));
        return errors.length === 0 && replacementCount > 0 ? "true" : "false";

    } catch (e) {
        var errorMsg = "replaceSelectedAudioClips 실행 중 심각한 오류 발생: " + e.toString() + (e.line ? " (라인: " + e.line + ")" : "");
        $.writeln(errorMsg);
        sendEvent(JSON.stringify({
            message: errorMsg,
            success: false,
            debug: (typeof debugInfo !== 'undefined' ? debugInfo : "") + "\n" + errorMsg
        }));
        return "false";
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