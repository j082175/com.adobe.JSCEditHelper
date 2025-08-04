/**
 * JSCEditHelper Extension - Host Script (JSX)
 * Premiere Pro와 CEP 패널 간의 통신을 담당합니다.
 */

// 디버그 모드 설정 (개발 중에는 true, 배포 시에는 false)
var DEBUG_MODE = true; // 임시로 활성화하여 문제 해결

// 조건부 로깅 함수
function debugWriteln(message) {
    if (DEBUG_MODE && $) {
        $.writeln("[SoundInserter Debug] " + message);
    }
}

// PlugPlugExternalObject 라이브러리 로드 시도 (선택사항)
var plugPlugLib = null;
var plugPlugLoaded = false;

// 여러 경로에서 PlugPlugExternalObject 로드 시도
var plugPlugPaths = [
    "lib:PlugPlugExternalObject", // 기본 시스템 라이브러리
    $.fileName.replace(/[^\/\\]*$/, "") + "lib/PlugPlugExternalObject.dll", // 확장프로그램 로컬 경로 (Windows)
    $.fileName.replace(/[^\/\\]*$/, "") + "lib/PlugPlugExternalObject.bundle" // 확장프로그램 로컬 경로 (macOS)
];

for (var i = 0; i < plugPlugPaths.length; i++) {
    try {
        debugWriteln("PlugPlugExternalObject 로드 시도: " + plugPlugPaths[i]);
        plugPlugLib = new ExternalObject(plugPlugPaths[i]);
        if (plugPlugLib) {
            plugPlugLoaded = true;
            debugWriteln("PlugPlugExternalObject 라이브러리 로드 성공: " + plugPlugPaths[i]);
            break;
        }
    } catch (e) {
        debugWriteln("PlugPlugExternalObject 로드 실패 (" + plugPlugPaths[i] + "): " + e.toString());
        continue;
    }
}

if (!plugPlugLoaded) {
    $.writeln("PlugPlugExternalObject 로드 실패 - CEP 기본 CSXSEvent 사용 시도");
}

// CSXSEvent는 CEP 환경에서 기본적으로 사용 가능 (PlugPlugExternalObject 없이도)
var csxsEventAvailable = true;
$.writeln("CSXSEvent 초기화 완료 (PlugPlugExternalObject: " + (plugPlugLoaded ? "로드됨" : "없음") + ")");

// CSXSEvent를 안전하게 사용하는 헬퍼 함수
function safeCSXSEvent(eventType, eventData, scope) {
    if (!csxsEventAvailable) {
        $.writeln("CSXSEvent 비활성화 상태 - 이벤트 무시: " + eventType);
        return false;
    }

    try {
        var event = new CSXSEvent();
        event.type = eventType;
        event.data = eventData;
        if (scope) {
            event.scope = scope;
        }
        event.dispatch();
        return true;
    } catch (e) {
        $.writeln("CSXSEvent 발송 실패 (" + eventType + "): " + e.toString());
        // 첫 번째 실패 시 csxsEventAvailable을 false로 설정하여 향후 시도 방지
        csxsEventAvailable = false;
        $.writeln("CSXSEvent 비활성화됨 - 향후 이벤트 무시됨");
        return false;
    }
}

// 선택된 클립 사이에 랜덤 효과음 삽입 함수
function insertSoundsBetweenClips(folderPath, audioTrack) {
    try {
        $.writeln("🔥🔥🔥 CODE SUCCESSFULLY UPDATED 2025-01-02 🔥🔥🔥");
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
        var finalTrackIndex = -1; // 최종 선택된 트랙 인덱스 저장용
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
                    finalTrackIndex = tk; // 루프 인덱스를 최종 트랙 인덱스로 저장
                    var selectionReason = "    => 자동 오디오 트랙 선택: 빈 (잠기지 않고, 음소거되지 않은) 트랙 " + trackName + " (인덱스: " + finalTrackIndex + ") 발견됨.";
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
                finalTrackIndex = trackIndex; // 수동 선택된 트랙 인덱스 저장
                debugInfo += "선택된 오디오 트랙: 트랙 " + (finalTrackIndex + 1) + "\n";
                $.writeln("선택된 오디오 트랙: 트랙 " + (finalTrackIndex + 1));
            } else {
                sendEvent("지정한 오디오 트랙(" + audioTrack + ")이 유효하지 않습니다. 가용 트랙: " + seq.audioTracks.numTracks + "개", false);
                return "false";
            }
        }

        if (!targetAudioTrack) {
            sendEvent("효과음을 삽입할 대상 오디오 트랙을 결정할 수 없습니다.", false);
            return "false";
        }
        debugInfo += "최종 선택된 대상 오디오 트랙: " + (finalTrackIndex + 1) + " (ID: " + targetAudioTrack.id + ")\n";
        $.writeln("최종 선택된 대상 오디오 트랙: " + (finalTrackIndex + 1) + " (ID: " + targetAudioTrack.id + ")");

        var insertedSounds = [];
        var insertionCount = 0;

        debugInfo += "삽입 로직: 각 선택 클립의 시작 지점 (첫 클립은 제외)\n";
        debugInfo += "*** 코드 업데이트 확인: 2025-01-02 ***\n";
        debugInfo += "길이 검사: primarySortedClips.length = " + primarySortedClips.length + "\n";
        debugInfo += "최소 필요 길이: 2\n";
        debugInfo += "길이 조건: " + (primarySortedClips.length < 2 ? "실패 (부족)" : "통과") + "\n";
        
        if (primarySortedClips.length < 2) {
            debugInfo += "길이 부족으로 함수 종료\n";
            sendEvent("효과음을 삽입하려면 필터링 후 최소 2개 이상의 주요 클립을 선택해주세요. (현재 로직은 두 번째 클립부터 적용, 필터링된 클립 수: " + primarySortedClips.length + ")", false);
            return "false";
        }
        
        debugInfo += "길이 검사 통과. 루프 시작 준비...\n";

        // Use primarySortedClips instead of sortedClips for the loop
        debugInfo += "===== 주요 삽입 루프 시작 =====\n";
        debugInfo += "primarySortedClips.length: " + primarySortedClips.length + "\n";
        
        for (var i = 0; i < primarySortedClips.length; i++) {
            debugInfo += ">> 루프 반복 " + i + " 시작\n";
            
            try {
                var clip = primarySortedClips[i]; // Get clip from primarySortedClips
                debugInfo += "클립 객체 상태: " + (clip ? "존재" : "null") + "\n";
                
                if (!clip) {
                    debugInfo += "오류: 클립 객체가 null임. 건너뜀.\n";
                    continue;
                }
                
                var insertionTime = clip.start.seconds;
                debugInfo += "삽입 시간: " + insertionTime + "\n";

                if (i === 0) {
                    debugInfo += "첫 번째 클립 '" + File.decode(clip.name) + "' 건너뜀.\n";
                    $.writeln("첫 번째 클립 '" + File.decode(clip.name) + "' 건너뜀.");
                    continue;
                }

                debugInfo += "처리 중인 클립: '" + File.decode(clip.name) + "' 시작 시간: " + insertionTime.toFixed(2) + "초\n";
            } catch (loopError) {
                debugInfo += "루프 초기화 중 오류: " + loopError.toString() + "\n";
                continue;
            }

            // 매 삽입마다 새로운 랜덤 효과음 선택
            debugInfo += "효과음 파일 배열 상태 확인:\n";
            debugInfo += "  soundFiles 존재: " + (soundFiles ? "예" : "아니오") + "\n";
            debugInfo += "  soundFiles.length: " + (soundFiles ? soundFiles.length : "N/A") + "\n";
            
            if (!soundFiles || soundFiles.length === 0) {
                debugInfo += "오류: 루프 내에서 효과음 파일을 찾을 수 없어 현재 클립 삽입 건너뜀.\n";
                continue;
            }
            var randomSoundIndex = Math.floor(Math.random() * soundFiles.length);
            var soundFile = soundFiles[randomSoundIndex];
            var soundFilePath = soundFile.fsName;
            var decodedSoundFileName = File.decode(soundFile.name);

            debugInfo += "랜덤 선택된 효과음: " + decodedSoundFileName + "\n";
            debugInfo += "파일 경로: " + soundFilePath + "\n";
            
            var projectSoundItem = importedSoundItemsCache[soundFilePath];
            debugInfo += "캐시에서 검색 결과: " + (projectSoundItem ? "발견됨" : "없음") + "\n";
            
            $.writeln("=== 캐시 및 프로젝트 검색 시작 ===");
            $.writeln("캐시에서 찾은 아이템: " + (projectSoundItem ? projectSoundItem.name || "이름없음" : "없음"));
            
            // 캐시에 없으면 프로젝트에서 먼저 검색 (임포트 시도 전에)
            if (!projectSoundItem || typeof projectSoundItem.name === 'undefined') {
                debugInfo += "임포트 전 프로젝트에서 기존 파일 검색 중...\n";
                
                // 프로젝트의 모든 아이템 검색
                for (var preIdx = 0; preIdx < app.project.rootItem.children.numItems; preIdx++) {
                    var preItem = app.project.rootItem.children[preIdx];
                    if (preItem && preItem.name) {
                        var preItemName = File.decode(preItem.name);
                        var preItemBaseName = preItemName.replace(/\.[^.]*$/, '');
                        var targetBaseName = decodedSoundFileName.replace(/\.[^.]*$/, '');
                        
                        debugInfo += "  검사[" + preIdx + "]: '" + preItemName + "'\n";
                        
                        // 다양한 매칭 시도
                        var found = false;
                        
                        // 1. 정확한 이름 매칭
                        if (preItemName === decodedSoundFileName) {
                            found = true;
                            debugInfo += "    → 정확한 이름 매칭!\n";
                        }
                        // 2. 기본 이름 매칭 (확장자 제외)
                        else if (preItemBaseName === targetBaseName && preItemBaseName.length > 3) {
                            found = true;
                            debugInfo += "    → 기본 이름 매칭!\n";
                        }
                        // 3. 오디오 파일 + 부분 매칭
                        else if ((preItemName.toLowerCase().indexOf('.wav') !== -1 || 
                                  preItemName.toLowerCase().indexOf('.mp3') !== -1 ||
                                  preItemName.toLowerCase().indexOf('.aiff') !== -1) &&
                                 targetBaseName.length > 5 &&
                                 (preItemName.indexOf(targetBaseName.substring(0, Math.min(10, targetBaseName.length))) !== -1 ||
                                  targetBaseName.indexOf(preItemBaseName.substring(0, Math.min(10, preItemBaseName.length))) !== -1)) {
                            found = true;
                            debugInfo += "    → 오디오 파일 부분 매칭!\n";
                        }
                        
                        if (found) {
                            projectSoundItem = preItem;
                            importedSoundItemsCache[soundFilePath] = projectSoundItem;
                            debugInfo += "임포트 전 검색에서 기존 파일 발견: " + preItemName + "\n";
                            debugInfo += "기존 파일 사용으로 임포트 과정 생략\n";
                            break;
                        }
                    }
                }
                
                if (!projectSoundItem) {
                    debugInfo += "임포트 전 검색에서 파일을 찾지 못함. 모든 오디오 파일 목록 출력...\n";
                    debugInfo += "=== 프로젝트의 모든 오디오 파일 ===\n";
                    
                    var audioFiles = [];
                    var audioItems = [];
                    for (var audioIdx = 0; audioIdx < app.project.rootItem.children.numItems; audioIdx++) {
                        var audioItem = app.project.rootItem.children[audioIdx];
                        if (audioItem && audioItem.name) {
                            var audioItemName = File.decode(audioItem.name);
                            // 오디오 파일인지 확인
                            if (audioItemName.toLowerCase().indexOf('.wav') !== -1 || 
                                audioItemName.toLowerCase().indexOf('.mp3') !== -1 ||
                                audioItemName.toLowerCase().indexOf('.aiff') !== -1 ||
                                audioItemName.toLowerCase().indexOf('.flac') !== -1) {
                                audioFiles.push(audioItemName);
                                audioItems.push(audioItem);
                                debugInfo += "  오디오[" + audioIdx + "]: '" + audioItemName + "'\n";
                            }
                        }
                    }
                    
                    // 랜덤하게 오디오 파일 선택
                    if (audioItems.length > 0) {
                        var randomIndex = Math.floor(Math.random() * audioItems.length);
                        projectSoundItem = audioItems[randomIndex];
                        // 캐시에 저장하지 않음 (매번 랜덤 선택하기 위해)
                        debugInfo += "*** 랜덤 선택된 오디오 파일: " + File.decode(projectSoundItem.name) + " (인덱스: " + randomIndex + ") ***\n";
                    }
                    debugInfo += "총 " + audioFiles.length + "개의 오디오 파일 발견\n";
                    debugInfo += "===================================\n";
                    
                    if (!projectSoundItem) {
                        debugInfo += "프로젝트에 오디오 파일이 없음. 임포트 시도...\n";
                    }
                }
                debugInfo += "프로젝트에서 기존 아이템 검색 중... (총 " + app.project.rootItem.children.numItems + "개 아이템)\n";
                var foundInProject = false;
                for (var searchIdx = 0; searchIdx < app.project.rootItem.children.numItems; searchIdx++) {
                    var existingItem = app.project.rootItem.children[searchIdx];
                    if (existingItem && existingItem.name === decodedSoundFileName) {
                        projectSoundItem = existingItem;
                        importedSoundItemsCache[soundFilePath] = projectSoundItem;
                        debugInfo += "프로젝트에서 기존 아이템 발견: " + projectSoundItem.name + "\n";
                        foundInProject = true;
                        break;
                    }
                }
                if (!foundInProject) {
                    debugInfo += "프로젝트에서 기존 아이템 찾지 못함\n";
                }
            }

            if (!projectSoundItem || typeof projectSoundItem.name === 'undefined') {
                debugInfo += "임포트 시도: " + decodedSoundFileName + "\n";
                debugInfo += "임포트할 파일 전체 경로: " + soundFilePath + "\n";
                
                // 파일 존재 여부 확인
                var fileToImport = new File(soundFilePath);
                if (!fileToImport.exists) {
                    debugInfo += "파일 존재하지 않음: " + soundFilePath + "\n";
                    continue;
                }
                debugInfo += "파일 존재 확인됨\n";
                
                // 임포트 전 프로젝트 아이템 수 저장
                var beforeImportCount = app.project.rootItem.children.numItems;
                debugInfo += "임포트 전 프로젝트 아이템 수: " + beforeImportCount + "\n";
                
                var importResultArray = app.project.importFiles([soundFilePath]);
                debugInfo += "importFiles 호출 결과:\n";
                debugInfo += "  - 반환 객체: " + (importResultArray ? "존재" : "null") + "\n";
                debugInfo += "  - typeof: " + typeof importResultArray + "\n";
                debugInfo += "  - 값: " + importResultArray + "\n";
                
                // 임포트 후 프로젝트 아이템 수 확인
                var afterImportCount = app.project.rootItem.children.numItems;
                debugInfo += "임포트 후 프로젝트 아이템 수: " + afterImportCount + "\n";
                
                // 새로 추가된 아이템이 있는지 확인
                if (afterImportCount > beforeImportCount) {
                    debugInfo += "새 아이템이 추가됨! 최신 아이템을 찾는 중...\n";
                    // 가장 최근에 추가된 아이템을 찾기
                    for (var newIdx = afterImportCount - 1; newIdx >= beforeImportCount; newIdx--) {
                        var newItem = app.project.rootItem.children[newIdx];
                        if (newItem && newItem.name) {
                            var newItemName = File.decode(newItem.name);
                            debugInfo += "  - 새 아이템 [" + newIdx + "]: '" + newItemName + "'\n";
                            
                            // 오디오 파일인지 확인
                            if (newItemName.toLowerCase().indexOf('.wav') !== -1 || 
                                newItemName.toLowerCase().indexOf('.mp3') !== -1 ||
                                newItemName.toLowerCase().indexOf('.aiff') !== -1) {
                                projectSoundItem = newItem;
                                importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                debugInfo += "  - 최신 오디오 파일을 ProjectItem으로 사용: " + newItemName + "\n";
                                break;
                            }
                        }
                    }
                } else {
                    debugInfo += "새 아이템이 추가되지 않음\n";
                }
                
                // 임포트 후 즉시 프로젝트에서 검색 (임포트가 성공했지만 객체가 반환되지 않은 경우)
                if (!projectSoundItem && (typeof importResultArray === 'boolean' || !importResultArray)) {
                    debugInfo += "  - 임포트 후 즉시 프로젝트 검색 시작...\n";
                    debugInfo += "  - 검색 대상: '" + decodedSoundFileName + "'\n";
                    
                    // 최신 프로젝트 아이템 수 확인
                    var newItemCount = app.project.rootItem.children.numItems;
                    debugInfo += "  - 현재 프로젝트 아이템 수: " + newItemCount + "\n";
                    
                    for (var searchIdx = 0; searchIdx < newItemCount; searchIdx++) {
                        var searchItem = app.project.rootItem.children[searchIdx];
                        if (searchItem && searchItem.name) {
                            var searchItemName = File.decode(searchItem.name);
                            var rawItemName = searchItem.name; // 인코딩 전 원본 이름
                            
                            debugInfo += "    검색[" + searchIdx + "]: '" + searchItemName + "' (원본: '" + rawItemName + "')\n";
                            
                            // 여러 방식으로 매칭 시도
                            var targetBaseName = decodedSoundFileName.replace(/\.[^.]*$/, ''); // 확장자 제거
                            var itemBaseName = searchItemName.replace(/\.[^.]*$/, ''); // 확장자 제거
                            
                            var isMatch = false;
                            var matchType = "";
                            
                            // 1. 정확한 매칭
                            if (searchItemName === decodedSoundFileName) {
                                isMatch = true;
                                matchType = "정확한 이름";
                            }
                            // 2. 원본 이름 매칭
                            else if (rawItemName === decodedSoundFileName) {
                                isMatch = true;
                                matchType = "원본 이름";
                            }
                            // 3. 기본 이름 매칭 (확장자 제외)
                            else if (itemBaseName === targetBaseName) {
                                isMatch = true;
                                matchType = "기본 이름";
                            }
                            // 4. 부분 매칭 (파일명 포함)
                            else if (searchItemName.indexOf(targetBaseName) !== -1 || targetBaseName.indexOf(itemBaseName) !== -1) {
                                isMatch = true;
                                matchType = "부분 매칭";
                            }
                            // 5. 오디오 파일 타입 매칭 (최후의 수단)
                            else if (searchItem.type === ProjectItemType.FILE && 
                                     searchItem.getMediaPath && 
                                     (searchItemName.toLowerCase().indexOf('.wav') !== -1 || 
                                      searchItemName.toLowerCase().indexOf('.mp3') !== -1) &&
                                     targetBaseName.length > 3 &&
                                     (searchItemName.toLowerCase().indexOf(targetBaseName.toLowerCase().substring(0, 5)) !== -1)) {
                                isMatch = true;
                                matchType = "오디오 타입 + 부분";
                            }
                            
                            if (isMatch) {
                                projectSoundItem = searchItem;
                                importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                debugInfo += "  - 임포트 후 검색으로 파일 발견 (" + matchType + "): " + searchItemName + "\n";
                                break;
                            }
                        }
                    }
                    
                    if (!projectSoundItem) {
                        debugInfo += "  - 임포트 후 검색에서도 파일을 찾지 못함\n";
                    }
                }
                
                // boolean 반환 분석: true=이미 존재, false=실패
                if (typeof importResultArray === 'boolean') {
                    if (importResultArray === true) {
                        debugInfo += "  - importFiles가 true 반환 = 파일이 이미 프로젝트에 존재\n";
                        debugInfo += "  - 기존 파일을 프로젝트에서 찾는 중...\n";
                        
                        // 기존 파일을 프로젝트에서 검색
                        debugInfo += "  - 찾는 파일명: '" + decodedSoundFileName + "'\n";
                        debugInfo += "  - 프로젝트 아이템 목록:\n";
                        
                        for (var j = 0; j < app.project.rootItem.children.numItems; j++) {
                            var pi = app.project.rootItem.children[j];
                            if (pi && pi.name) {
                                var itemDecodedName = File.decode(pi.name);
                                debugInfo += "    [" + j + "] '" + itemDecodedName + "'\n";
                                
                                if (itemDecodedName === decodedSoundFileName) {
                                    projectSoundItem = pi;
                                    importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                    debugInfo += "  - 정확한 이름 매칭으로 기존 파일 찾음: " + itemDecodedName + "\n";
                                    break;
                                }
                                
                                // 부분 매칭도 시도 (파일명이 포함되어 있는지)
                                if (itemDecodedName.indexOf(decodedSoundFileName) !== -1 || 
                                    decodedSoundFileName.indexOf(itemDecodedName) !== -1) {
                                    if (!projectSoundItem) { // 정확한 매칭이 없을 때만
                                        projectSoundItem = pi;
                                        importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                        debugInfo += "  - 부분 매칭으로 기존 파일 찾음: " + itemDecodedName + "\n";
                                    }
                                }
                            }
                        }
                        
                        if (!projectSoundItem) {
                            debugInfo += "  - 기존 파일을 찾지 못함 (실제로 프로젝트에 없음)\n";
                            debugInfo += "  - 강제 임포트 시도 중...\n";
                            
                            // importFiles가 true를 잘못 반환한 경우, 강제로 새 파일로 임포트
                            try {
                                var tempPath = soundFilePath + "?time=" + new Date().getTime(); // 캐시 우회
                                var forceImportResult = app.project.importFiles([soundFilePath], true); // 두 번째 인자로 강제 임포트
                                
                                if (forceImportResult && typeof forceImportResult === 'object' && forceImportResult.numItems > 0) {
                                    projectSoundItem = forceImportResult[0];
                                    importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                    debugInfo += "  - 강제 임포트 성공: " + File.decode(projectSoundItem.name) + "\n";
                                } else {
                                    debugInfo += "  - 강제 임포트도 실패\n";
                                }
                            } catch (forceError) {
                                debugInfo += "  - 강제 임포트 오류: " + forceError.toString() + "\n";
                            }
                            
                            // 최후의 수단: File 객체를 직접 사용한 임포트
                            if (!projectSoundItem) {
                                debugInfo += "  - File 객체 직접 임포트 시도...\n";
                                try {
                                    var fileObj = new File(soundFilePath);
                                    if (fileObj.exists) {
                                        var directImportResult = app.project.importFiles([fileObj]);
                                        if (directImportResult && typeof directImportResult === 'object' && directImportResult.numItems > 0) {
                                            projectSoundItem = directImportResult[0];
                                            importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                            debugInfo += "  - File 객체 직접 임포트 성공: " + File.decode(projectSoundItem.name) + "\n";
                                        } else {
                                            debugInfo += "  - File 객체 직접 임포트도 실패 (결과: " + typeof directImportResult + ")\n";
                                        }
                                    } else {
                                        debugInfo += "  - File 객체 생성 실패: 파일이 존재하지 않음\n";
                                    }
                                } catch (fileError) {
                                    debugInfo += "  - File 객체 임포트 오류: " + fileError.toString() + "\n";
                                }
                                
                                // 마지막 시도: 경로를 URI 형식으로 변환
                                if (!projectSoundItem) {
                                    debugInfo += "  - URI 경로 변환 임포트 시도...\n";
                                    try {
                                        var fileUri = new File(soundFilePath);
                                        var uriPath = fileUri.fsName; // 시스템 경로 형식으로 변환
                                        debugInfo += "    - 변환된 URI 경로: " + uriPath + "\n";
                                        
                                        var uriImportResult = app.project.importFiles([uriPath]);
                                        debugInfo += "    - URI 임포트 결과 타입: " + typeof uriImportResult + "\n";
                                        
                                        if (uriImportResult && typeof uriImportResult === 'object' && uriImportResult.numItems > 0) {
                                            projectSoundItem = uriImportResult[0];
                                            importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                            debugInfo += "  - URI 경로 임포트 성공: " + File.decode(projectSoundItem.name) + "\n";
                                        } else if (typeof uriImportResult === 'boolean' && uriImportResult === false) {
                                            debugInfo += "  - URI 경로 임포트 실패 (false 반환)\n";
                                        } else {
                                            debugInfo += "  - URI 경로 임포트 예상치 못한 결과\n";
                                        }
                                    } catch (uriError) {
                                        debugInfo += "  - URI 변환 임포트 오류: " + uriError.toString() + "\n";
                                    }
                                }
                                
                                // 최후의 수단: 파일을 임시로 복사해서 영문 이름으로 임포트
                                if (!projectSoundItem) {
                                    debugInfo += "  - 임시 파일명 변경 임포트 시도...\n";
                                    try {
                                        // 임시 파일명 생성 (영문 + 타임스탬프)
                                        var tempFileName = "temp_sound_" + new Date().getTime() + soundFilePath.substring(soundFilePath.lastIndexOf('.'));
                                        var tempFilePath = soundFilePath.substring(0, soundFilePath.lastIndexOf('\\') + 1) + tempFileName;
                                        
                                        debugInfo += "    - 임시 파일명: " + tempFileName + "\n";
                                        debugInfo += "    - 임시 경로: " + tempFilePath + "\n";
                                        
                                        // 파일 복사
                                        var originalFile = new File(soundFilePath);
                                        var tempFile = new File(tempFilePath);
                                        
                                        if (originalFile.exists && originalFile.copy(tempFile)) {
                                            debugInfo += "    - 파일 복사 성공\n";
                                            
                                            // 임시 파일로 임포트 시도
                                            var tempImportResult = app.project.importFiles([tempFilePath]);
                                            debugInfo += "    - 임시 파일 임포트 결과 타입: " + typeof tempImportResult + "\n";
                                            
                                            if (tempImportResult && typeof tempImportResult === 'object' && tempImportResult.numItems > 0) {
                                                projectSoundItem = tempImportResult[0];
                                                importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                                debugInfo += "  - 임시 파일명 임포트 성공: " + File.decode(projectSoundItem.name) + "\n";
                                                
                                                // 임시 파일 삭제
                                                try {
                                                    tempFile.remove();
                                                    debugInfo += "    - 임시 파일 정리 완료\n";
                                                } catch (e) {
                                                    debugInfo += "    - 임시 파일 정리 실패: " + e.toString() + "\n";
                                                }
                                            } else {
                                                debugInfo += "  - 임시 파일명 임포트도 실패\n";
                                                // 실패 시 임시 파일 정리
                                                try { tempFile.remove(); } catch (e) {}
                                            }
                                        } else {
                                            debugInfo += "    - 파일 복사 실패\n";
                                        }
                                    } catch (tempError) {
                                        debugInfo += "  - 임시 파일명 변경 오류: " + tempError.toString() + "\n";
                                    }
                                }
                            }
                        }
                    } else {
                        debugInfo += "  - importFiles가 false 반환 = 실제 임포트 실패\n";
                        debugInfo += "  - 실패 원인 분석 중...\n";
                        
                        // 파일 확장자 확인
                        var fileExtension = soundFilePath.substring(soundFilePath.lastIndexOf('.')).toLowerCase();
                        debugInfo += "  - 파일 확장자: " + fileExtension + "\n";
                        
                        // 파일 크기 확인
                        try {
                            var fileSize = fileToImport.length;
                            debugInfo += "  - 파일 크기: " + fileSize + " bytes\n";
                            if (fileSize === 0) {
                                debugInfo += "  - 오류: 파일 크기가 0 bytes (손상된 파일)\n";
                            }
                        } catch (e) {
                            debugInfo += "  - 파일 크기 확인 실패: " + e.toString() + "\n";
                        }
                    }
                    
                } else if (importResultArray && typeof importResultArray === 'object') {
                    // 정상적인 객체/Collection 반환
                    var importedItem = null;
                    
                    // numItems 속성으로 개수 확인 (Premiere Pro Collection의 표준 방식)
                    if (typeof importResultArray.numItems !== 'undefined') {
                        debugInfo += "  - Collection.numItems: " + importResultArray.numItems + "\n";
                        if (importResultArray.numItems > 0) {
                            importedItem = importResultArray[0];
                        }
                    }
                    // 배열 스타일 length 속성도 확인
                    else if (typeof importResultArray.length !== 'undefined') {
                        debugInfo += "  - Array.length: " + importResultArray.length + "\n";
                        if (importResultArray.length > 0) {
                            importedItem = importResultArray[0];
                        }
                    }
                    // 직접 인덱스 접근 시도
                    else {
                        debugInfo += "  - 직접 인덱스 접근 시도\n";
                        try {
                            importedItem = importResultArray[0];
                        } catch (e) {
                            debugInfo += "  - 인덱스 접근 실패: " + e.toString() + "\n";
                        }
                    }
                    
                    if (importedItem && typeof importedItem.name !== 'undefined') {
                        projectSoundItem = importedItem;
                        importedSoundItemsCache[soundFilePath] = projectSoundItem;
                        debugInfo += "임포트 성공: " + projectSoundItem.name + " (ID: " + (projectSoundItem.nodeId ? projectSoundItem.nodeId : "N/A") + ")\n";
                    } else {
                        debugInfo += "Collection은 유효하지만 아이템 없음\n";
                    }
                } else {
                    debugInfo += "  - 예상치 못한 반환 타입\n";
                }
                
                // 임포트가 실패했거나 유효한 아이템이 없는 경우 대안 시도
                if (!projectSoundItem || typeof projectSoundItem.name === 'undefined') {
                    debugInfo += "대안 방법들 시도 중...\n";
                    
                    // 1. 경로 정리 시도 (백슬래시를 슬래시로 변환)
                    debugInfo += "1. 경로 정리 시도 (백슬래시 → 슬래시)\n";
                    var cleanedPath = soundFilePath.replace(/\\/g, '/');
                    $.writeln("정리된 경로로 재시도: " + cleanedPath);
                    
                    var retryImportResult = app.project.importFiles([cleanedPath]);
                    debugInfo += "  - 결과 타입: " + typeof retryImportResult + "\n";
                    
                    if (typeof retryImportResult === 'object' && retryImportResult && 
                        ((retryImportResult.numItems && retryImportResult.numItems > 0) || 
                         (retryImportResult.length && retryImportResult.length > 0))) {
                        projectSoundItem = retryImportResult[0];
                        importedSoundItemsCache[soundFilePath] = projectSoundItem;
                        debugInfo += "  - 경로 정리 후 임포트 성공: " + projectSoundItem.name + "\n";
                    } else {
                        debugInfo += "  - 경로 정리 후에도 실패\n";
                        $.writeln("경로 정리 후에도 importFiles 실패. 루트에서 이름으로 재검색 시도: " + decodedSoundFileName);
                        var foundInRoot = false;
                        $.writeln("프로젝트 루트에서 이름으로 검색 중... 총 아이템 수: " + app.project.rootItem.children.numItems);
                        for (var j = 0; j < app.project.rootItem.children.numItems; j++) {
                            var pi = app.project.rootItem.children[j];
                            $.writeln("  검색 중인 아이템 " + j + ": " + (pi.name || "이름없음"));
                            
                            // 정확한 이름 매칭 또는 파일 경로 매칭
                            var nameMatch = pi.name === decodedSoundFileName;
                            var pathMatch = false;
                            
                            // MediaPath가 있는 경우 경로도 비교
                            if (pi.getMediaPath && typeof pi.getMediaPath === 'function') {
                                try {
                                    var piPath = pi.getMediaPath();
                                    pathMatch = (piPath === soundFilePath);
                                    $.writeln("    파일 경로 비교: " + piPath + " vs " + soundFilePath + " = " + pathMatch);
                                } catch (e) {
                                    // getMediaPath 실패 시 무시
                                }
                            }
                            
                            if (nameMatch || pathMatch) {
                                projectSoundItem = pi;
                                importedSoundItemsCache[soundFilePath] = projectSoundItem;
                                $.writeln("이름" + (pathMatch ? "/경로" : "") + "로 재검색 성공 및 캐시 저장: " + projectSoundItem.name);
                                foundInRoot = true;
                                break;
                            }
                        }
                        if (!foundInRoot) {
                            $.writeln("임포트 및 재검색 모두 실패: " + decodedSoundFileName);
                            projectSoundItem = null;
                        }
                    }
                }
            } else {
                $.writeln("캐시에서 '" + projectSoundItem.name + "' 사용.");
            }

            debugInfo += "==== ProjectItem 최종 검증 ====\n";
            debugInfo += "projectSoundItem 존재 여부: " + (projectSoundItem ? "존재" : "null") + "\n";
            if (projectSoundItem) {
                debugInfo += "projectSoundItem.name: " + (projectSoundItem.name || "undefined") + "\n";
                debugInfo += "typeof projectSoundItem.name: " + typeof projectSoundItem.name + "\n";
                debugInfo += "projectSoundItem.name !== undefined: " + (projectSoundItem.name !== undefined) + "\n";
            }
            debugInfo += "검증 결과: " + (projectSoundItem && projectSoundItem.name !== undefined ? "통과" : "실패") + "\n";
            
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
                $.writeln("  - 원본 파일 경로: " + soundFilePath);
                $.writeln("  - projectSoundItem 상태: " + (projectSoundItem ? "존재하지만 유효하지 않음" : "null"));
                if (projectSoundItem) {
                    $.writeln("  - projectSoundItem.name: " + (projectSoundItem.name || "undefined"));
                    $.writeln("  - typeof projectSoundItem.name: " + typeof projectSoundItem.name);
                }
                debugInfo += "효과음 파일 준비 실패: " + decodedSoundFileName + " (경로: " + soundFilePath + ")\\n";
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

            // 안전한 CSXSEvent 사용
            var eventSuccess = safeCSXSEvent(
                "com.adobe.soundInserter.events.FileListEvent",
                JSON.stringify(eventData)
            );

            if (eventSuccess) {
                $.writeln("FileListEvent 발송 성공 (모든 오디오 파일): " + JSON.stringify(eventData));
            } else {
                $.writeln("FileListEvent 발송 실패 - 데이터: " + JSON.stringify(eventData));
            }

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
        var eventType = "com.adobe.soundInserter.events.SoundEvent";
        var eventData;

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
                    eventData = JSON.stringify(safeObj);
                } else {
                    eventData = jsonString;
                }
            } catch (jsonErr) {
                $.writeln("객체 JSON 변환 오류: " + jsonErr.toString());
                eventData = JSON.stringify({
                    message: "객체 처리 오류: " + (message.message || "알 수 없는 오류"),
                    success: false
                });
            }
        } else {
            if (success !== undefined) {
                try {
                    eventData = JSON.stringify({
                        message: String(message),
                        success: !!success
                    });
                } catch (jsonErr) {
                    $.writeln("JSON 변환 오류: " + jsonErr.toString());
                    eventData = String(message) + " (success: " + (!!success) + ")";
                }
            } else {
                eventData = String(message);
            }
        }

        // 안전한 CSXSEvent 사용
        var eventSuccess = safeCSXSEvent(eventType, eventData);
        if (!eventSuccess) {
            $.writeln("SoundEvent 발송 실패 - 데이터: " + eventData);
        }

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
        logToBoth("CRITICAL ERROR in " + mainFunctionName + ": " + e.toString() + (e.line ? " (Line: " + e.line + ")" : ""), true);
        sendEvent(JSON.stringify({
            message: "클립 처리 중 예외: " + e.toString(),
            success: false,
            debug: overallDebugInfo
        }));
        return "false";
    }
}

// Helper function to process a single timeline clip
function processSingleTimelineClip(timelineClip, soundFilePathToImport, importedSoundItemsCache, seq, clipIndex, parentDebugInfo) {
    var functionName = "processSingleTimelineClip (NewLogic)"; // 새로운 로직임을 명시
    var debugInfo = parentDebugInfo;
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
        logClipMsg("Processing started for 'Insert Below & Match Length' logic.");

        // timelineClip 객체 상세 로깅 추가
        if (timelineClip) {
            logClipMsg("timelineClip.name: " + (timelineClip.name ? File.decode(timelineClip.name) : "N/A"));
            logClipMsg("timelineClip.mediaType: " + (timelineClip.mediaType || "N/A"));
            logClipMsg("timelineClip.start: " + (timelineClip.start ? JSON.stringify(timelineClip.start) : "undefined"));
            if (timelineClip.start) {
                logClipMsg("timelineClip.start.seconds: " + (timelineClip.start.seconds !== undefined ? timelineClip.start.seconds : "undefined"));
            }
            logClipMsg("timelineClip.duration: " + (timelineClip.duration ? JSON.stringify(timelineClip.duration) : "undefined"));
            if (timelineClip.duration) {
                logClipMsg("timelineClip.duration.seconds: " + (timelineClip.duration.seconds !== undefined ? timelineClip.duration.seconds : "undefined"));
            }
            logClipMsg("timelineClip.track: " + (timelineClip.track ? JSON.stringify(timelineClip.track) : "undefined"));
            if (timelineClip.track) {
                logClipMsg("timelineClip.track.index: " + (timelineClip.track.index !== undefined ? timelineClip.track.index : "undefined"));
                logClipMsg("timelineClip.track.mediaType: " + (timelineClip.track.mediaType || "undefined"));
            }
            logClipMsg("typeof timelineClip.start: " + typeof timelineClip.start);
            logClipMsg("typeof timelineClip.duration: " + typeof timelineClip.duration);
            logClipMsg("typeof timelineClip.track: " + typeof timelineClip.track);
        } else {
            logClipMsg("timelineClip is null or undefined at the beginning.", true);
            return {
                success: false,
                error: "선택된 클립 객체가 유효하지 않습니다.",
                debugInfo: debugInfo
            };
        }

        // 1. timelineClip 유효성 검사
        if (!timelineClip || typeof timelineClip.name === 'undefined') {
            logClipMsg("Timeline clip is invalid or has no name. Skipping.", true);
            return {
                success: false,
                error: "선택된 항목(인덱스: " + clipIndex + ")이 유효하지 않습니다.",
                debugInfo: debugInfo
            };
        }
        
        // 클립 타입에 따른 처리 방법 결정
        var isAudioClip = (timelineClip.mediaType === "Audio");
        var isVideoClip = (timelineClip.mediaType === "Video");
        
        logClipMsg("클립 타입: " + timelineClip.mediaType + ", 오디오 클립: " + isAudioClip + ", 비디오 클립: " + isVideoClip);
        
        if (!isAudioClip && !isVideoClip) {
            logClipMsg("지원되지 않는 클립 타입입니다: " + timelineClip.mediaType, true);
            return {
                success: false,
                error: "선택된 항목(인덱스: " + clipIndex + ")이 오디오 또는 비디오 클립이 아닙니다.",
                debugInfo: debugInfo
            };
        }
        
        // 비디오/이미지 클립인 경우: 오디오 추가 로직
        if (isVideoClip) {
            logClipMsg("비디오 클립 감지됨. 오디오 추가 모드로 전환합니다.");
            return processVideoClipAudioAddition(timelineClip, soundFilePathToImport, importedSoundItemsCache, seq, clipIndex, debugInfo);
        }
        
        // 오디오 클립인 경우: 기존 대체 로직 계속 진행
        logClipMsg("오디오 클립 감지됨. 대체 모드로 진행합니다.");

        // 2. 원본 클립 정보 추출
        var originalClipStartTime = null;
        var originalClipDuration = null;
        var originalClipTrackIndex = null; // 찾은 트랙 인덱스를 저장할 변수
        var originalClipTrack = null; // 찾은 트랙 객체를 저장할 변수

        if (timelineClip.start && typeof timelineClip.start.seconds === 'number') {
            originalClipStartTime = timelineClip.start.seconds;
        } else {
            logClipMsg("Original audio clip is missing 'start.seconds'. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 시작 시간 정보 누락.",
                debugInfo: debugInfo
            };
        }

        if (timelineClip.duration && typeof timelineClip.duration.seconds === 'number') {
            originalClipDuration = timelineClip.duration.seconds;
        } else {
            logClipMsg("Original audio clip is missing 'duration.seconds'. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 길이 정보 누락.",
                debugInfo: debugInfo
            };
        }

        // 원본 클립의 트랙 정보 가져오기 (더 견고한 방법으로 수정)
        if (timelineClip.track && typeof timelineClip.track.index === 'number') {
            originalClipTrack = timelineClip.track;
            originalClipTrackIndex = originalClipTrack.index;
            logClipMsg("Track info obtained directly from timelineClip.track. Index: " + originalClipTrackIndex);
        } else {
            logClipMsg("timelineClip.track is undefined or invalid. Attempting to find track by iterating sequence audio tracks.");
            var foundTrack = false;
            if (seq && seq.audioTracks) {
                for (var tk_idx = 0; tk_idx < seq.audioTracks.numTracks; tk_idx++) {
                    var currentSeqTrack = seq.audioTracks[tk_idx];
                    if (currentSeqTrack && currentSeqTrack.clips) {
                        for (var cl_idx = 0; cl_idx < currentSeqTrack.clips.numItems; cl_idx++) {
                            var clipOnTrack = currentSeqTrack.clips[cl_idx];
                            // timelineClip과 clipOnTrack을 비교하여 동일한 클립인지 확인합니다.
                            // projectItem.nodeId가 있다면 가장 확실하지만, 없다면 이름과 시작 시간 등으로 비교할 수 있습니다.
                            // 여기서는 timelineClip에 projectItem이 있다는 보장이 없으므로, 더 일반적인 비교가 필요할 수 있습니다.
                            // 가장 간단한 비교는 객체 참조 비교 (만약 동일 객체를 가리킨다면)
                            // 또는 더 확실하게는 클립의 고유 ID (예: Premiere Pro 내부 ID)가 있다면 그것으로 비교해야 합니다.
                            // 현재로서는 시작시간과 이름, 길이를 비교하는 방법으로 시도합니다.
                            var clipOnTrackName = clipOnTrack.name ? File.decode(clipOnTrack.name) : "";
                            var timelineClipName = timelineClip.name ? File.decode(timelineClip.name) : "";

                            // nodeId를 우선적으로 사용하고, 없다면 이름과 시간으로 비교
                            var isSameClip = false;
                            if (timelineClip.projectItem && timelineClip.projectItem.nodeId && clipOnTrack.projectItem && clipOnTrack.projectItem.nodeId) {
                                if (timelineClip.projectItem.nodeId === clipOnTrack.projectItem.nodeId &&
                                    Math.abs(clipOnTrack.start.seconds - originalClipStartTime) < 0.01) {
                                    isSameClip = true;
                                }
                            } else if (clipOnTrackName === timelineClipName &&
                                Math.abs(clipOnTrack.start.seconds - originalClipStartTime) < 0.01 &&
                                Math.abs(clipOnTrack.duration.seconds - originalClipDuration) < 0.01) {
                                // 이름, 시작시간, 길이가 모두 일치하는 경우 (nodeId 없을 때의 차선책)
                                isSameClip = true;
                            }

                            if (isSameClip) {
                                // currentSeqTrack.index 대신 루프 인덱스 tk_idx를 사용
                                if (currentSeqTrack && typeof tk_idx === 'number') {
                                    originalClipTrack = currentSeqTrack;
                                    originalClipTrackIndex = tk_idx; // currentSeqTrack.index 대신 tk_idx 사용
                                    foundTrack = true;
                                    logClipMsg("Track info found by iteration. Assigned Track Index: " + originalClipTrackIndex + " (from loop variable tk_idx). Track Name: '" + (originalClipTrack.name ? File.decode(originalClipTrack.name) : "N/A") + "', Track ID: " + (originalClipTrack.id || "N/A"));
                                } else {
                                    var trackDetails = "currentSeqTrack: " + (currentSeqTrack ? "exists" : "null/undefined");
                                    if (currentSeqTrack) {
                                        trackDetails += ", tk_idx: " + (tk_idx !== undefined ? tk_idx : "undefined"); // tk_idx 로깅 추가
                                        trackDetails += ", currentSeqTrack.id: " + (currentSeqTrack.id || "undefined");
                                        trackDetails += ", currentSeqTrack.name: " + (currentSeqTrack.name ? File.decode(currentSeqTrack.name) : "undefined");
                                    }
                                    logClipMsg("Found matching clip, but failed to assign track index using tk_idx. " + trackDetails, true);
                                }
                                break;
                            }
                        }
                    }
                    if (foundTrack) break; // 트랙을 찾았으므로 외부 트랙 루프 종료
                }
            }
            if (!foundTrack) {
                logClipMsg("Failed to find the track for the original audio clip by iteration. Skipping.", true);
                return {
                    success: false,
                    error: "클립 '" + File.decode(timelineClip.name) + "': 속한 트랙을 찾을 수 없습니다.",
                    debugInfo: debugInfo
                };
            }
        }

        // 이제 originalClipTrackIndex 와 originalClipTrack 이 설정되었거나 오류 처리됨.
        // originalClipTrackIndex가 유효한 숫자인지 다시 한번 확인
        if (typeof originalClipTrackIndex !== 'number' || originalClipTrack === null) {
            logClipMsg("Original clip track index (Type: " + typeof originalClipTrackIndex + ", Value: " + originalClipTrackIndex + ") is not a valid number or track object is null after attempts. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 트랙 정보 최종 확인 실패 (인덱스 또는 객체 무효).",
                debugInfo: debugInfo
            };
        }

        logClipMsg("Original clip: '" + File.decode(timelineClip.name) + "', Start: " + originalClipStartTime.toFixed(2) + "s, Duration: " + originalClipDuration.toFixed(2) + "s, Track: " + (originalClipTrackIndex + 1));

        // 3. 대상 삽입 트랙 결정 (원본 클립 바로 아래 트랙)
        var targetInsertionTrackIndex = originalClipTrackIndex + 1; // 이제 originalClipTrackIndex는 숫자일 것으로 기대
        // targetInsertionTrackIndex가 여전히 숫자가 아닐 경우를 대비한 추가 검사 (매우 방어적)
        if (typeof targetInsertionTrackIndex !== 'number' || isNaN(targetInsertionTrackIndex)) {
            logClipMsg("targetInsertionTrackIndex is NaN or not a number even after originalClipTrackIndex was deemed valid. OriginalIndex: " + originalClipTrackIndex + ". Aborting.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 대상 트랙 인덱스 계산 오류.",
                debugInfo: debugInfo
            };
        }

        logClipMsg("Calculated target insertion track index: " + targetInsertionTrackIndex);

        if (targetInsertionTrackIndex >= seq.audioTracks.numTracks) {
            logClipMsg("No track exists below the original clip's track (Original track index: " + originalClipTrackIndex + ", Target would be: " + targetInsertionTrackIndex + "). Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 바로 아래 오디오 트랙이 없습니다.",
                debugInfo: debugInfo
            };
        }
        var targetInsertionTrack = seq.audioTracks[targetInsertionTrackIndex];
        if (!targetInsertionTrack) {
            logClipMsg("Failed to get the target insertion track object at index " + targetInsertionTrackIndex + ". Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 대상 트랙(인덱스 " + targetInsertionTrackIndex + ")을 가져올 수 없습니다.",
                debugInfo: debugInfo
            };
        }
        logClipMsg("Target insertion track: " + (targetInsertionTrack.name ? File.decode(targetInsertionTrack.name) : "Track " + (targetInsertionTrack.index + 1)) + " (Index: " + targetInsertionTrack.index + ")");

        if (targetInsertionTrack.isLocked()) {
            logClipMsg("Target insertion track " + (targetInsertionTrack.index + 1) + " is locked. Skipping.", true);
            return {
                success: false,
                error: "클립 '" + File.decode(timelineClip.name) + "': 대상 트랙 " + (targetInsertionTrack.index + 1) + "이(가) 잠겨있어 삽입할 수 없습니다.",
                debugInfo: debugInfo
            };
        }


        // 4. 새 효과음 ProjectItem 가져오기 (기존 로직과 유사하게 재활용)
        var projectSoundItem = null;
        var importedFileNameForLog = "";
        try {
            importedFileNameForLog = File.decode(new File(soundFilePathToImport).name);
        } catch (fne) {
            /* ignore */
        }

        if (importedSoundItemsCache[soundFilePathToImport] && typeof importedSoundItemsCache[soundFilePathToImport].nodeId !== 'undefined') {
            projectSoundItem = importedSoundItemsCache[soundFilePathToImport];
            logClipMsg("Using cached ProjectItem: '" + (projectSoundItem.name ? File.decode(projectSoundItem.name) : importedFileNameForLog) + "'");
        } else {
            // 1. 먼저 기존 프로젝트에서 찾기
            logClipMsg("Searching for existing ProjectItem in project: '" + importedFileNameForLog + "'");
            var foundInProject = false;
            if (app.project.rootItem && app.project.rootItem.children) {
                for (var pi_idx = 0; pi_idx < app.project.rootItem.children.numItems; pi_idx++) {
                    var pi_child = app.project.rootItem.children[pi_idx];
                    if (pi_child && pi_child.name === importedFileNameForLog && typeof pi_child.nodeId !== 'undefined') {
                        projectSoundItem = pi_child;
                        importedSoundItemsCache[soundFilePathToImport] = projectSoundItem;
                        logClipMsg("Found existing ProjectItem in project: '" + File.decode(projectSoundItem.name) + "' - using existing file instead of importing");
                        foundInProject = true;
                        break;
                    }
                }
            }
            
            // 2. 프로젝트에 없으면 새로 import
            if (!foundInProject) {
                logClipMsg("ProjectItem not found in project. Attempting to import: '" + importedFileNameForLog + "' from path: " + soundFilePathToImport);
                var importResultArray = app.project.importFiles([soundFilePathToImport]);
                if (importResultArray && importResultArray.length > 0 && importResultArray[0] && typeof importResultArray[0].nodeId !== 'undefined') {
                    projectSoundItem = importResultArray[0];
                    importedSoundItemsCache[soundFilePathToImport] = projectSoundItem;
                    logClipMsg("Import successful and cached: '" + (projectSoundItem.name ? File.decode(projectSoundItem.name) : importedFileNameForLog) + "' (nodeId: " + projectSoundItem.nodeId + ")");
                } else {
                    logClipMsg("Import failed for: '" + importedFileNameForLog + "'. Skipping.", true);
                    return {
                        success: false,
                        error: "새 사운드 임포트 실패 (" + importedFileNameForLog + ")",
                        debugInfo: debugInfo
                    };
                }
            }
        }

        if (!projectSoundItem || typeof projectSoundItem.nodeId === 'undefined') {
            logClipMsg("Failed to obtain a valid ProjectItem for the sound file. Skipping.", true);
            return {
                success: false,
                error: "새 사운드 아이템 유효성 문제.",
                debugInfo: debugInfo
            };
        }
        if (typeof projectSoundItem.isSequence === 'function' && projectSoundItem.isSequence() === true) {
            logClipMsg("ProjectItem to insert is a sequence. Skipping.", true);
            return {
                success: false,
                error: "가져온 항목이 시퀀스임 (오디오 파일 필요).",
                debugInfo: debugInfo
            };
        }

        // 5. 새 효과음 삽입
        var insertionTimeObject = new Time();
        insertionTimeObject.seconds = originalClipStartTime;
        var justInsertedClip = null;

        logClipMsg("Attempting to insert clip '" + File.decode(projectSoundItem.name) + "' onto track " + (targetInsertionTrack.index + 1) + " at " + insertionTimeObject.seconds.toFixed(2) + "s.");
        try {
            // insertClip은 아무것도 반환하지 않음.
            targetInsertionTrack.insertClip(projectSoundItem, insertionTimeObject);
            logClipMsg("insertClip API call successful.");

            // 삽입된 클립 찾기 (더 견고한 방법 필요)
            // 가장 간단한 방법: 트랙의 마지막 클립이고 시작 시간이 일치하는지 확인
            // 더 견고한 방법: 모든 클립을 순회하며 projectItem과 시작 시간으로 확인
            if (targetInsertionTrack.clips.numItems > 0) {
                for (var c_idx = targetInsertionTrack.clips.numItems - 1; c_idx >= 0; c_idx--) {
                    var candidateClip = targetInsertionTrack.clips[c_idx];
                    if (candidateClip && candidateClip.projectItem && candidateClip.projectItem.nodeId === projectSoundItem.nodeId &&
                        Math.abs(candidateClip.start.seconds - originalClipStartTime) < 0.01) {
                        justInsertedClip = candidateClip;
                        logClipMsg("Successfully found inserted clip: '" + File.decode(justInsertedClip.name) + "' by searching track.");
                        break;
                    }
                }
            }
            if (!justInsertedClip) {
                // 백업: 만약 위에서 못찾았다면, 혹시 마지막 클립이 맞는지 한번 더 확인 (덜 정확함)
                var lastClip = targetInsertionTrack.clips[targetInsertionTrack.clips.numItems - 1];
                if (lastClip && lastClip.projectItem && lastClip.projectItem.nodeId === projectSoundItem.nodeId && Math.abs(lastClip.start.seconds - originalClipStartTime) < 0.01) {
                    justInsertedClip = lastClip;
                    logClipMsg("Found inserted clip (using last clip as fallback): '" + File.decode(justInsertedClip.name) + "'");
                } else {
                    logClipMsg("Failed to find the newly inserted clip on track " + (targetInsertionTrack.index + 1) + " after insertClip call. This might indicate an issue or a very short clip being immediately overwritten or removed.", true);
                    // 이 경우에도 오류로 처리하여 길이 조정을 시도하지 않도록 함
                    return {
                        success: false,
                        error: "클립 '" + File.decode(timelineClip.name) + "': 효과음 삽입 후 타임라인에서 해당 클립을 찾지 못했습니다.",
                        debugInfo: debugInfo
                    };
                }
            }

        } catch (e_insert) {
            logClipMsg("Error during insertClip: " + e_insert.toString(), true);
            return {
                success: false,
                error: "insertClip 실패: " + e_insert.toString(),
                debugInfo: debugInfo
            };
        }

        if (!justInsertedClip || typeof justInsertedClip.name === 'undefined') {
            logClipMsg("Could not reliably find the inserted clip on the timeline. Skipping length adjustment.", true);
            // 위에서 이미 반환 로직이 있지만, 안전장치로 추가.
            return {
                success: false,
                error: "삽입된 클립을 타임라인에서 찾을 수 없습니다.",
                debugInfo: debugInfo
            };
        }

        logClipMsg("Inserted clip '" + File.decode(justInsertedClip.name) + "' initial duration: " + justInsertedClip.duration.seconds.toFixed(2) + "s, start: " + justInsertedClip.start.seconds.toFixed(2) + "s.");

        // 6. 삽입된 클립 길이 조정
        var newSoundActualMediaDuration = Infinity;
        if (projectSoundItem.getDuration && typeof projectSoundItem.getDuration === 'function') {
            try {
                var durObj = projectSoundItem.getDuration();
                if (durObj && typeof durObj.seconds === 'number') {
                    newSoundActualMediaDuration = durObj.seconds;
                    logClipMsg("New sound's original media duration: " + newSoundActualMediaDuration.toFixed(2) + "s.");
                } else {
                    logClipMsg("Could not get valid seconds from new sound's getDuration().");
                }
            } catch (e_getDur) {
                logClipMsg("Error calling getDuration on new sound: " + e_getDur.toString());
            }
        } else {
            logClipMsg("New sound project item does not have getDuration method.");
        }


        var targetDurationForNewClip = originalClipDuration;
        logClipMsg("Target duration for new clip (from original selected clip): " + targetDurationForNewClip.toFixed(2) + "s.");

        // 새 효과음의 실제 미디어 길이로 제한
        var finalEffectiveDuration = Math.min(targetDurationForNewClip, newSoundActualMediaDuration);
        if (finalEffectiveDuration < targetDurationForNewClip) {
            logClipMsg("Duration capped by new sound's actual media length. Original target: " + targetDurationForNewClip.toFixed(2) + "s, Capped: " + finalEffectiveDuration.toFixed(2) + "s", false); // 경고성 정보
            errorMessages.push("클립 '" + File.decode(justInsertedClip.name) + "': 길이가 새 효과음 원본 미디어(" + newSoundActualMediaDuration.toFixed(2) + "s)보다 짧게 제한됨");
        }

        // 길이가 0 또는 음수가 되지 않도록 최소값 보장
        finalEffectiveDuration = Math.max(0.001, finalEffectiveDuration);


        var newEndTimeObject = new Time();
        newEndTimeObject.seconds = justInsertedClip.start.seconds + finalEffectiveDuration;

        logClipMsg("Attempting to set end for '" + File.decode(justInsertedClip.name) + "' to achieve duration " + finalEffectiveDuration.toFixed(2) + "s. New end time: " + newEndTimeObject.seconds.toFixed(2) + "s.");
        try {
            justInsertedClip.end = newEndTimeObject;
            var actualNewDuration = justInsertedClip.duration.seconds;
            logClipMsg("Clip end set. Actual new duration: " + actualNewDuration.toFixed(2) + "s.");

            if (Math.abs(actualNewDuration - finalEffectiveDuration) > 0.01) {
                logClipMsg("Warning: Actual duration " + actualNewDuration.toFixed(2) + "s differs from targeted " + finalEffectiveDuration.toFixed(2) + "s. API or media limitation?", false);
                errorMessages.push("클립 '" + File.decode(justInsertedClip.name) + "': 최종 길이가 목표(" + finalEffectiveDuration.toFixed(2) + "s)와 다름 (실제: " + actualNewDuration.toFixed(2) + "s)");
            }
            clipSuccessfullyProcessed = true;
            
            // 7. 선택된 원본 효과음 제거
            logClipMsg("Removing original selected clip.");
            try {
                var originalClipName = File.decode(timelineClip.name);
                timelineClip.remove(false, false);
                logClipMsg("Original clip '" + originalClipName + "' removed successfully.");
                
            } catch (removeError) {
                logClipMsg("Failed to remove original clip: " + removeError.toString(), true);
                errorMessages.push("원본 클립 제거 실패: " + removeError.toString());
            }
            
        } catch (e_setEnd) {
            logClipMsg("Error setting clip.end: " + e_setEnd.toString(), true);
            return {
                success: false,
                error: "새 끝점 설정 실패: " + e_setEnd.toString(),
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

        // 안전한 CSXSEvent 사용
        var eventData = JSON.stringify({
            soundFiles: soundFilesResult.files, // soundFilesResult.files 사용
            folderPath: soundFilesResult.path // soundFilesResult.path 사용
        });

        var eventSuccess = safeCSXSEvent(
            "com.adobe.soundInserter.events.FileListEvent",
            eventData,
            "APPLICATION"
        );

        if (eventSuccess) {
            $.writeln(logPrefix + "FileListEvent 발송 성공 for path: " + soundFilesResult.path);
        } else {
            $.writeln(logPrefix + "FileListEvent 발송 실패 - 데이터: " + eventData);
        }

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

// 비디오 클립에 오디오 추가하는 함수
function processVideoClipAudioAddition(timelineClip, soundFilePathToImport, importedSoundItemsCache, seq, clipIndex, parentDebugInfo) {
    var functionName = "processVideoClipAudioAddition";
    var debugInfo = parentDebugInfo;
    
    function logClipMsg(message, isError) {
        var clipName = (timelineClip && timelineClip.name) ? File.decode(timelineClip.name) : "N/A";
        var logEntry = "[" + functionName + "][Clip " + clipIndex + ": '" + clipName + "'] " + message;
        if (typeof $ !== 'undefined' && $.writeln) {
            $.writeln((isError ? "ERROR: " : "") + logEntry);
        }
        debugInfo += logEntry + "\n";
    }
    
    try {
        logClipMsg("비디오 클립에 오디오 추가 시작");
        
        // 1. 비디오 클립 정보 추출
        var videoClipStartTime = timelineClip.start.seconds;
        var videoClipDuration = timelineClip.duration.seconds;
        
        logClipMsg("비디오 클립 정보 - 시작: " + videoClipStartTime.toFixed(2) + "s, 길이: " + videoClipDuration.toFixed(2) + "s");
        
        // 2. 오디오 파일 임포트 (기존 로직 재사용)
        var projectSoundItem = null;
        
        // 사용자가 선택한 특정 오디오 파일 사용 (랜덤 선택 제거)
        logClipMsg("사용자 선택 파일: " + soundFilePathToImport);
        
        // 파일명 추출 (Windows와 macOS 모두 지원)
        var soundFilePath = soundFilePathToImport;
        var soundFileName = "";
        
        // 백슬래시와 슬래시 중 더 뒤에 있는 것을 기준으로 파일명 추출
        var lastSlashIndex = soundFilePath.lastIndexOf('/');
        var lastBackslashIndex = soundFilePath.lastIndexOf('\\');
        var separatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);
        
        if (separatorIndex >= 0) {
            soundFileName = soundFilePath.substring(separatorIndex + 1);
        } else {
            soundFileName = soundFilePath; // 경로 구분자가 없으면 전체가 파일명
        }
        
        // File.decode 시도, 실패하면 원본 사용
        var decodedSoundFileName = soundFileName;
        try {
            decodedSoundFileName = File.decode(soundFileName);
        } catch (decodeError) {
            logClipMsg("File.decode 실패, 원본 파일명 사용: " + decodeError.toString());
        }
        
        logClipMsg("파일 경로 분석 - 전체: " + soundFilePath);
        logClipMsg("파일 경로 분석 - 파일명: " + soundFileName);
        logClipMsg("파일 경로 분석 - 디코딩된 파일명: " + decodedSoundFileName);
        
        // 캐시에서 먼저 찾기
        if (importedSoundItemsCache[soundFilePath]) {
            projectSoundItem = importedSoundItemsCache[soundFilePath];
            logClipMsg("캐시에서 찾은 오디오: " + File.decode(projectSoundItem.name));
        } else {
            // 프로젝트에서 해당 파일 찾기
            for (var searchIdx = 0; searchIdx < app.project.rootItem.children.numItems; searchIdx++) {
                var existingItem = app.project.rootItem.children[searchIdx];
                if (existingItem && existingItem.name === decodedSoundFileName) {
                    projectSoundItem = existingItem;
                    importedSoundItemsCache[soundFilePath] = projectSoundItem;
                    logClipMsg("프로젝트에서 기존 아이템 발견: " + projectSoundItem.name);
                    break;
                }
            }
            
            // 프로젝트에 없으면 임포트
            if (!projectSoundItem) {
                logClipMsg("파일 임포트 시도: " + decodedSoundFileName);
                logClipMsg("전체 파일 경로: " + soundFilePath);
                
                var fileToImport = new File(soundFilePath);
                logClipMsg("File 객체 생성됨. exists: " + fileToImport.exists);
                
                if (!fileToImport.exists) {
                    logClipMsg("파일이 존재하지 않음: " + soundFilePath, true);
                    return {
                        success: false,
                        error: "선택한 오디오 파일을 찾을 수 없습니다: " + decodedSoundFileName,
                        debugInfo: debugInfo
                    };
                }
                
                logClipMsg("파일 존재 확인됨. 임포트 시작...");
                
                // 임포트 전 프로젝트 아이템 수 확인
                var beforeImportCount = app.project.rootItem.children.numItems;
                logClipMsg("임포트 전 프로젝트 아이템 수: " + beforeImportCount);
                
                try {
                    var importResultArray = app.project.importFiles([soundFilePath]);
                    logClipMsg("importFiles 호출 완료. 결과: " + (importResultArray ? "성공" : "null"));
                    if (importResultArray && importResultArray.length) {
                        logClipMsg("importResultArray.length: " + importResultArray.length);
                    }
                } catch (importError) {
                    logClipMsg("importFiles 호출 중 오류: " + importError.toString(), true);
                    return {
                        success: false,
                        error: "파일 임포트 중 오류 발생: " + importError.toString(),
                        debugInfo: debugInfo
                    };
                }
                
                // 임포트 후 프로젝트 아이템 수 확인
                var afterImportCount = app.project.rootItem.children.numItems;
                logClipMsg("임포트 후 프로젝트 아이템 수: " + afterImportCount);
                
                if (importResultArray && importResultArray.length > 0) {
                    // 방금 임포트된 아이템 찾기
                    for (var newIdx = app.project.rootItem.children.numItems - 1; newIdx >= 0; newIdx--) {
                        var newItem = app.project.rootItem.children[newIdx];
                        if (newItem && newItem.name === decodedSoundFileName) {
                            projectSoundItem = newItem;
                            importedSoundItemsCache[soundFilePath] = projectSoundItem;
                            logClipMsg("임포트 완료: " + newItem.name);
                            break;
                        }
                    }
                }
                
                if (!projectSoundItem) {
                    logClipMsg("파일 임포트 실패", true);
                    return {
                        success: false,
                        error: "선택한 오디오 파일 임포트에 실패했습니다: " + decodedSoundFileName,
                        debugInfo: debugInfo
                    };
                }
            }
        }
        
        // 3. A2 트랙 (인덱스 1) 우선 사용, 잠겨있으면 다른 트랙 찾기
        var targetAudioTrack = null;
        var targetTrackIndex = 1; // A2 트랙 (0-based 인덱스)
        
        // A2 트랙 먼저 시도
        if (seq.audioTracks.numTracks > targetTrackIndex) {
            var a2Track = seq.audioTracks[targetTrackIndex];
            logClipMsg("A2 트랙 확인 중 (인덱스: " + targetTrackIndex + ")");
            logClipMsg("A2 트랙 상태 - isLocked: " + a2Track.isLocked + ", isMuted: " + a2Track.isMuted);
            logClipMsg("A2 트랙 클립 수: " + (a2Track.clips ? a2Track.clips.numItems : "N/A"));
            
            if (a2Track.isMuted) {
                logClipMsg("경고: A2 트랙이 음소거되어 있습니다.");
            }
            
            // 강제로 A2 트랙 사용 (잠금 상태 무시)
            targetAudioTrack = a2Track;
            logClipMsg("A2 트랙 강제 선택 (잠금 상태 무시)");
            
            /*
            if (!a2Track.isLocked) {
                targetAudioTrack = a2Track;
                logClipMsg("A2 트랙 사용 가능 - 선택됨");
            } else {
                logClipMsg("A2 트랙이 잠겨 있음 - 다른 트랙 찾는 중...");
            }
            */
        } else {
            logClipMsg("A2 트랙이 존재하지 않음. 총 트랙 수: " + seq.audioTracks.numTracks);
        }
        
        // A2가 사용 불가능하면 다른 트랙 찾기
        if (!targetAudioTrack) {
            logClipMsg("사용 가능한 다른 오디오 트랙 검색 중...");
            for (var trackIdx = 0; trackIdx < seq.audioTracks.numTracks; trackIdx++) {
                var audioTrack = seq.audioTracks[trackIdx];
                if (audioTrack && !audioTrack.isLocked) {
                    targetAudioTrack = audioTrack;
                    targetTrackIndex = trackIdx;
                    logClipMsg("대체 트랙 선택: Audio " + (trackIdx + 1) + " (인덱스: " + trackIdx + ")");
                    if (audioTrack.isMuted) {
                        logClipMsg("경고: 선택된 트랙이 음소거되어 있습니다.");
                    }
                    break;
                }
            }
        }
        
        if (!targetAudioTrack) {
            logClipMsg("사용 가능한 오디오 트랙이 없습니다.", true);
            return {
                success: false,
                error: "사용 가능한 오디오 트랙이 없습니다.",
                debugInfo: debugInfo
            };
        }
        
        // 4. 오디오 클립을 트랙에 추가 (길이 지정하여 삽입)
        logClipMsg("오디오 클립을 트랙에 길이 맞춤으로 추가 중...");
        
        // Time 객체 생성 (시작 시간)
        var startTime = {
            seconds: videoClipStartTime,
            ticks: Math.round(videoClipStartTime * 254016000000)
        };
        
        // Time 객체 생성 (길이)
        var duration = {
            seconds: videoClipDuration,
            ticks: Math.round(videoClipDuration * 254016000000)
        };
        
        // 방법 1: Project Item의 In/Out Point 미리 설정
        logClipMsg("Project Item에 In/Out Point 설정 시도...");
        try {
            if (projectSoundItem.setInPoint && projectSoundItem.setOutPoint) {
                var projectInPoint = {
                    seconds: 0,
                    ticks: 0
                };
                var projectOutPoint = {
                    seconds: videoClipDuration,
                    ticks: Math.round(videoClipDuration * 254016000000)
                };
                
                projectSoundItem.setInPoint(projectInPoint);
                projectSoundItem.setOutPoint(projectOutPoint);
                logClipMsg("Project Item In/Out Point 설정 완료: 0s ~ " + videoClipDuration.toFixed(2) + "s");
            } else {
                logClipMsg("Project Item에 setInPoint/setOutPoint 메서드가 없음");
            }
        } catch (projectPointError) {
            logClipMsg("Project Item In/Out Point 설정 실패: " + projectPointError.toString());
        }
        
        // insertClip으로 길이 지정하여 삽입 시도
        var insertResult = null;
        var insertMethod = "unknown";
        
        try {
            // insertClip(projectItem, timelineTime, inPoint, outPoint)
            // outPoint는 소스 클립에서의 종료 지점 (0부터 시작)
            var outPoint = {
                seconds: videoClipDuration,
                ticks: Math.round(videoClipDuration * 254016000000)
            };
            var inPoint = {
                seconds: 0,
                ticks: 0
            };
            
            logClipMsg("insertClip 시도 - inPoint: 0s, outPoint: " + videoClipDuration.toFixed(2) + "s");
            logClipMsg("insertClip 매개변수 상세: projectItem=" + (projectSoundItem ? "존재" : "null") + 
                      ", startTime=" + JSON.stringify(startTime) + 
                      ", inPoint=" + JSON.stringify(inPoint) + 
                      ", outPoint=" + JSON.stringify(outPoint));
            
            insertResult = targetAudioTrack.insertClip(projectSoundItem, startTime, inPoint, outPoint);
            insertMethod = "insertClip";
            logClipMsg("insertClip 성공! 길이가 " + videoClipDuration.toFixed(2) + "s로 지정됨");
        } catch (insertError) {
            logClipMsg("insertClip 실패 상세: " + insertError.toString());
            logClipMsg("insertClip 실패, overwriteClip으로 대체 시도");
            // 대안: overwriteClip 사용
            try {
                insertResult = targetAudioTrack.overwriteClip(projectSoundItem, videoClipStartTime);
                insertMethod = "overwriteClip";
                logClipMsg("overwriteClip 성공 (원본 길이로 삽입됨, 이후 길이 조정 필요)");
            } catch (overwriteError) {
                logClipMsg("overwriteClip도 실패: " + overwriteError.toString(), true);
                return {
                    success: false,
                    error: "오디오 클립 삽입에 실패했습니다.",
                    debugInfo: debugInfo
                };
            }
        }
        
        logClipMsg("사용된 삽입 방법: " + insertMethod);
        
        if (insertResult) {
            logClipMsg("오디오 추가 성공!");
            
            // insertClip을 사용한 경우 길이가 이미 지정되었으므로 추가 조정 불필요
            // overwriteClip을 사용한 경우에만 길이 조정 시도
            var needsLengthAdjustment = (insertMethod === "overwriteClip");
            
            if (needsLengthAdjustment) {
                logClipMsg("overwriteClip을 사용했으므로 길이 조정을 시도합니다...");
            } else {
                logClipMsg("insertClip을 사용했으므로 길이가 이미 지정되어 추가 조정이 불필요합니다.");
            }
            
            // 5. 추가된 오디오 클립의 길이를 비디오 클립과 맞춤 (필요한 경우에만)
            if (needsLengthAdjustment) {
                try {
                // 방금 추가된 클립을 찾기 (가장 최근에 추가된 클립)
                var insertedClip = null;
                var trackClips = targetAudioTrack.clips;
                
                if (trackClips && trackClips.numItems > 0) {
                    // 시작 시간이 비슷한 클립 찾기
                    for (var clipIdx = 0; clipIdx < trackClips.numItems; clipIdx++) {
                        var clip = trackClips[clipIdx];
                        if (clip && clip.start && Math.abs(clip.start.seconds - videoClipStartTime) < 0.1) {
                            insertedClip = clip;
                            logClipMsg("삽입된 오디오 클립 발견: " + File.decode(clip.name) + ", 시작: " + clip.start.seconds.toFixed(2) + "s");
                            break;
                        }
                    }
                }
                
                if (insertedClip) {
                    logClipMsg("오디오 클립 길이 조정 중... 목표 길이: " + videoClipDuration.toFixed(2) + "s");
                    
                    // 오디오 클립의 끝 시간을 비디오 클립과 맞춤
                    var newEndTime = videoClipStartTime + videoClipDuration;
                    
                    // 방법 0: 클립 삭제 후 Subclip으로 재삽입 (가장 확실한 방법)
                    var lengthAdjustmentSuccess = false;
                    
                    try {
                        logClipMsg("클립 삭제 후 Subclip으로 재삽입 시도...");
                        
                        // 1. 현재 클립 삭제
                        var clipStartTime = insertedClip.start.seconds;
                        logClipMsg("기존 클립 삭제 중... (시작 시간: " + clipStartTime.toFixed(2) + "s)");
                        insertedClip.remove();
                        
                        // 2. 원본 ProjectItem에서 Subclip 생성
                        logClipMsg("Subclip 생성 시도...");
                        
                        // Subclip을 위한 In/Out Point 설정
                        var subclipInPoint = {
                            seconds: 0,
                            ticks: 0
                        };
                        var subclipOutPoint = {
                            seconds: videoClipDuration,
                            ticks: Math.round(videoClipDuration * 254016000000)
                        };
                        
                        // Subclip 생성 (createSubClip 메서드 시도)
                        var subclipItem = null;
                        if (projectSoundItem.createSubClip) {
                            try {
                                var subclipName = projectSoundItem.name + "_" + videoClipDuration.toFixed(2) + "s";
                                subclipItem = projectSoundItem.createSubClip(subclipName, subclipInPoint, subclipOutPoint);
                                logClipMsg("createSubClip 성공: " + subclipName);
                            } catch (subclipError) {
                                logClipMsg("createSubClip 실패: " + subclipError.toString());
                            }
                        } else {
                            logClipMsg("createSubClip 메서드가 없음");
                        }
                        
                        // 3. Subclip 또는 원본으로 다시 삽입
                        var itemToInsert = subclipItem || projectSoundItem;
                        logClipMsg("재삽입할 아이템: " + (subclipItem ? "Subclip" : "원본"));
                        
                        // 4. overwriteClip으로 재삽입
                        var reinsertResult = targetAudioTrack.overwriteClip(itemToInsert, videoClipStartTime);
                        
                        if (reinsertResult) {
                            logClipMsg("Subclip을 사용한 재삽입 성공!");
                            lengthAdjustmentSuccess = true;
                            
                            // 재삽입된 클립이 올바른 길이인지 확인
                            var reinsertedClips = targetAudioTrack.clips;
                            for (var recheckIdx = 0; recheckIdx < reinsertedClips.numItems; recheckIdx++) {
                                var recheckClip = reinsertedClips[recheckIdx];
                                if (recheckClip && recheckClip.start && 
                                    Math.abs(recheckClip.start.seconds - videoClipStartTime) < 0.1) {
                                    logClipMsg("재삽입된 클립 확인: 길이 " + recheckClip.duration.seconds.toFixed(2) + "s");
                                    break;
                                }
                            }
                        } else {
                            logClipMsg("Subclip 재삽입 실패");
                        }
                        
                    } catch (reinsertError) {
                        logClipMsg("클립 삭제/재삽입 과정에서 오류: " + reinsertError.toString());
                    }
                    
                    // 방법 0.5: 간단한 재삽입 (Subclip 없이)
                    if (!lengthAdjustmentSuccess) {
                        try {
                            logClipMsg("간단한 재삽입 방법 시도...");
                            
                            // 현재 클립 정보 저장
                            var currentClipStart = insertedClip.start.seconds;
                            logClipMsg("현재 클립 정보 - 시작: " + currentClipStart.toFixed(2) + "s, 길이: " + insertedClip.duration.seconds.toFixed(2) + "s");
                            
                            // 클립 삭제
                            insertedClip.remove();
                            logClipMsg("기존 클립 삭제 완료");
                            
                            // insertClip을 다시 시도 (더 간단한 매개변수로)
                            var simpleInsertResult = null;
                            try {
                                // 더 간단한 형태로 insertClip 시도
                                simpleInsertResult = targetAudioTrack.insertClip(projectSoundItem, videoClipStartTime);
                                logClipMsg("간단한 insertClip 성공");
                            } catch (simpleInsertError) {
                                logClipMsg("간단한 insertClip 실패: " + simpleInsertError.toString());
                                // overwriteClip으로 대체
                                simpleInsertResult = targetAudioTrack.overwriteClip(projectSoundItem, videoClipStartTime);
                                logClipMsg("대체 overwriteClip 실행");
                            }
                            
                            if (simpleInsertResult) {
                                logClipMsg("간단한 재삽입 완료, 이제 클립을 찾아서 길이 조정...");
                                
                                // 새로 삽입된 클립 찾기
                                var newInsertedClip = null;
                                var newTrackClips = targetAudioTrack.clips;
                                for (var findIdx = 0; findIdx < newTrackClips.numItems; findIdx++) {
                                    var findClip = newTrackClips[findIdx];
                                    if (findClip && findClip.start && 
                                        Math.abs(findClip.start.seconds - videoClipStartTime) < 0.1) {
                                        newInsertedClip = findClip;
                                        logClipMsg("새 클립 발견: " + findClip.duration.seconds.toFixed(2) + "s");
                                        break;
                                    }
                                }
                                
                                // 새 클립에 대해 더 강력한 트림 시도
                                if (newInsertedClip) {
                                    insertedClip = newInsertedClip; // 다음 단계를 위해 업데이트
                                    logClipMsg("새 클립으로 업데이트됨, 트림 계속 진행");
                                }
                            }
                            
                        } catch (simpleReinsertError) {
                            logClipMsg("간단한 재삽입 실패: " + simpleReinsertError.toString());
                        }
                    }
                    
                    // 클립 길이 조정 - 기존 방법들 (재삽입이 실패한 경우)
                    if (!lengthAdjustmentSuccess) {
                        logClipMsg("모든 재삽입 방법 실패, 기존 속성 조정 방법들로 시도...");
                    }
                    
                    // 방법 1: Razor Tool로 잘라서 트림 (가장 확실한 방법)
                    try {
                        logClipMsg("Razor Tool을 사용한 트림 시도...");
                        
                        // 잘라야 할 지점 (비디오 클립 종료 시점)
                        var cutTime = {
                            seconds: newEndTime,
                            ticks: Math.round(newEndTime * 254016000000)
                        };
                        
                        // 현재 삽입된 클립의 실제 끝 시간 확인
                        var currentClipEnd = insertedClip.start.seconds + insertedClip.duration.seconds;
                        logClipMsg("현재 클립 끝 시간: " + currentClipEnd.toFixed(2) + "s, 목표 끝 시간: " + newEndTime.toFixed(2) + "s");
                        
                        // 클립이 목표보다 길면 잘라야 함
                        if (currentClipEnd > newEndTime + 0.01) { // 0.01초 오차 허용
                            logClipMsg("클립이 목표보다 길어서 트림이 필요합니다.");
                            
                            // Sequence의 razor 메서드 사용
                            if (seq.razor && typeof seq.razor === 'function') {
                                seq.razor(cutTime);
                                logClipMsg("Razor 도구로 " + newEndTime.toFixed(2) + "s 지점에서 클립을 잘랐습니다.");
                                
                                // 잘린 뒷부분 찾아서 삭제
                                var trackClipsAfterRazor = targetAudioTrack.clips;
                                for (var razorIdx = 0; razorIdx < trackClipsAfterRazor.numItems; razorIdx++) {
                                    var clipAfterRazor = trackClipsAfterRazor[razorIdx];
                                    if (clipAfterRazor && clipAfterRazor.start && 
                                        Math.abs(clipAfterRazor.start.seconds - newEndTime) < 0.1) {
                                        logClipMsg("잘린 뒷부분 클립 발견: " + clipAfterRazor.start.seconds.toFixed(2) + "s");
                                        clipAfterRazor.remove();
                                        logClipMsg("잘린 뒷부분 클립 삭제 완료");
                                        break;
                                    }
                                }
                                
                                lengthAdjustmentSuccess = true;
                                logClipMsg("Razor Tool을 사용한 트림 성공!");
                            } else {
                                logClipMsg("Sequence에 razor 메서드가 없습니다.");
                            }
                        } else {
                            logClipMsg("클립 길이가 이미 적절합니다. 트림 불필요.");
                            lengthAdjustmentSuccess = true;
                        }
                    } catch (razorError) {
                        logClipMsg("Razor Tool 트림 실패: " + razorError.toString());
                    }
                    
                    // 방법 2: outPoint 조정
                    if (!lengthAdjustmentSuccess) {
                        try {
                            var newOutPoint = {
                                seconds: videoClipDuration,
                                ticks: Math.round(videoClipDuration * 254016000000)
                            };
                            
                            if (insertedClip.setOutPoint) {
                                insertedClip.setOutPoint(newOutPoint);
                                logClipMsg("setOutPoint 메서드로 길이 조정 성공");
                                lengthAdjustmentSuccess = true;
                            } else if (insertedClip.outPoint !== undefined) {
                                insertedClip.outPoint = newOutPoint;
                                logClipMsg("outPoint 속성으로 길이 조정 성공");
                                lengthAdjustmentSuccess = true;
                            } else {
                                logClipMsg("outPoint 관련 메서드/속성이 없음");
                            }
                        } catch (outPointError) {
                            logClipMsg("outPoint 조정 실패: " + outPointError.toString());
                        }
                    }
                    
                    // 방법 3: duration 속성 사용 (검증 추가)
                    if (!lengthAdjustmentSuccess) {
                        try {
                            var beforeDuration = insertedClip.duration.seconds;
                            insertedClip.duration = {
                                seconds: videoClipDuration,
                                ticks: Math.round(videoClipDuration * 254016000000)
                            };
                            var afterDuration = insertedClip.duration.seconds;
                            
                            if (Math.abs(afterDuration - videoClipDuration) < 0.1) {
                                logClipMsg("duration 속성으로 길이 조정 성공 (확인됨: " + beforeDuration.toFixed(2) + "s → " + afterDuration.toFixed(2) + "s)");
                                lengthAdjustmentSuccess = true;
                            } else {
                                logClipMsg("duration 속성 설정했지만 실제로 변경되지 않음: " + beforeDuration.toFixed(2) + "s → " + afterDuration.toFixed(2) + "s");
                            }
                        } catch (durationError) {
                            logClipMsg("duration 속성 설정 실패: " + durationError.toString());
                        }
                    }
                    
                    // 방법 4: end 속성 사용 (마지막 수단)
                    if (!lengthAdjustmentSuccess) {
                        try {
                            insertedClip.end = {
                                seconds: newEndTime,
                                ticks: Math.round(newEndTime * 254016000000)
                            };
                            logClipMsg("end 속성으로 길이 조정 성공");
                            lengthAdjustmentSuccess = true;
                        } catch (endError) {
                            logClipMsg("end 속성 설정도 실패: " + endError.toString());
                        }
                    }
                    
                    if (!lengthAdjustmentSuccess) {
                        logClipMsg("======================================");
                        logClipMsg("모든 자동 길이 조정 방법이 실패했습니다.");
                        logClipMsg("오디오 클립이 " + insertedClip.duration.seconds.toFixed(2) + "초로 삽입되었습니다.");
                        logClipMsg("목표 길이: " + videoClipDuration.toFixed(2) + "초");
                        logClipMsg("수동 조정 방법:");
                        logClipMsg("1. 타임라인에서 오디오 클립의 끝을 드래그하여 " + newEndTime.toFixed(2) + "초 지점으로 조정");
                        logClipMsg("2. 또는 Razor Tool(C)로 " + newEndTime.toFixed(2) + "초 지점에서 자르고 뒷부분 삭제");
                        logClipMsg("======================================");
                        // 실패해도 치명적이지 않으므로 계속 진행
                    }
                    
                    logClipMsg("오디오 클립 길이 조정 완료! 새 끝 시간: " + newEndTime.toFixed(2) + "s");
                } else {
                    logClipMsg("경고: 삽입된 오디오 클립을 찾을 수 없어 길이 조정을 건너뜁니다.");
                }
                
                } catch (lengthError) {
                    logClipMsg("길이 조정 중 오류 발생: " + lengthError.toString() + " (오디오는 추가되었지만 길이 조정 실패)");
                }
            } // needsLengthAdjustment 블록 종료
            
            return {
                success: true,
                error: null,
                debugInfo: debugInfo
            };
        } else {
            logClipMsg("오디오 추가 실패", true);
            return {
                success: false,
                error: "오디오 클립 추가에 실패했습니다.",
                debugInfo: debugInfo
            };
        }
        
    } catch (e) {
        logClipMsg("처리 중 오류 발생: " + e.toString(), true);
        return {
            success: false,
            error: "비디오 클립 처리 중 오류: " + e.toString(),
            debugInfo: debugInfo
        };
    }
}

// 클립 자동 정렬 기능 (마그넷 기능)
function magnetClipsInSequence() {
    var functionName = "magnetClipsInSequence";
    var debugInfo = "";
    
    function logMsg(message, isError) {
        var logEntry = "[" + functionName + "] " + message;
        if (typeof $ !== 'undefined' && $.writeln) {
            $.writeln((isError ? "ERROR: " : "") + logEntry);
        }
        debugInfo += logEntry + "\n";
    }
    
    try {
        logMsg("클립 자동 정렬 시작");
        
        if (!app.project.activeSequence) {
            var errorMsg = "활성 시퀀스가 없습니다. 시퀀스를 열고 다시 시도해주세요.";
            logMsg(errorMsg, true);
            sendEvent(JSON.stringify({
                message: errorMsg,
                success: false,
                debug: debugInfo
            }));
            return "false";
        }
        
        var sequence = app.project.activeSequence;
        var videoTracks = sequence.videoTracks;
        var audioTracks = sequence.audioTracks;
        var totalClipsMoved = 0;
        var totalGapsRemoved = 0;
        
        logMsg("시퀀스: " + sequence.name);
        logMsg("비디오 트랙 수: " + videoTracks.numTracks);
        logMsg("오디오 트랙 수: " + audioTracks.numTracks);
        
        // 비디오 트랙 처리
        for (var vt = 0; vt < videoTracks.numTracks; vt++) {
            var videoTrack = videoTracks[vt];
            if (!videoTrack || videoTrack.clips.numItems === 0) continue;
            
            logMsg("비디오 트랙 " + (vt + 1) + " 처리 중... (클립 수: " + videoTrack.clips.numItems + ")");
            var result = magnetTrackClips(videoTrack, "비디오");
            totalClipsMoved += result.clipsMoved;
            totalGapsRemoved += result.gapsRemoved;
        }
        
        // 오디오 트랙 처리
        for (var at = 0; at < audioTracks.numTracks; at++) {
            var audioTrack = audioTracks[at];
            if (!audioTrack || audioTrack.clips.numItems === 0) continue;
            
            logMsg("오디오 트랙 " + (at + 1) + " 처리 중... (클립 수: " + audioTrack.clips.numItems + ")");
            var result = magnetTrackClips(audioTrack, "오디오");
            totalClipsMoved += result.clipsMoved;
            totalGapsRemoved += result.gapsRemoved;
        }
        
        var successMsg = "클립 자동 정렬 완료! " + totalClipsMoved + "개 클립 이동, " + totalGapsRemoved + "개 간격 제거";
        logMsg(successMsg);
        
        sendEvent(JSON.stringify({
            message: successMsg,
            success: true,
            clipsMoved: totalClipsMoved,
            gapsRemoved: totalGapsRemoved,
            debug: debugInfo
        }));
        
        return "true";
        
    } catch (e) {
        var errorMsg = "클립 정렬 중 오류 발생: " + e.toString();
        logMsg(errorMsg, true);
        sendEvent(JSON.stringify({
            message: errorMsg,
            success: false,
            debug: debugInfo
        }));
        return "false";
    }
}

// 개별 트랙의 클립들을 정렬하는 함수
function magnetTrackClips(track, trackType) {
    var clips = [];
    var clipsMoved = 0;
    var gapsRemoved = 0;
    
    // 클립 정보 수집
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (clip && clip.start !== undefined && clip.end !== undefined) {
            clips.push({
                clip: clip,
                start: clip.start.seconds,
                end: clip.end.seconds,
                duration: clip.duration.seconds,
                name: File.decode(clip.name),
                originalIndex: i
            });
        }
    }
    
    if (clips.length <= 1) {
        return { clipsMoved: 0, gapsRemoved: 0 };
    }
    
    // 시작 시간순으로 정렬
    clips.sort(function(a, b) {
        return a.start - b.start;
    });
    
    $.writeln(trackType + " 트랙 처리: " + clips.length + "개 클립 발견");
    
    // 각 클립을 순서대로 처리하되, 겹치지 않도록 안전하게 이동
    var targetTime = clips[0].end; // 첫 번째 클립 이후부터 시작
    
    for (var j = 1; j < clips.length; j++) {
        var currentClip = clips[j];
        var gap = currentClip.start - targetTime;
        
        $.writeln("클립 " + j + " '" + currentClip.name + "' 분석: 현재=" + currentClip.start.toFixed(2) + "s, 목표=" + targetTime.toFixed(2) + "s, 간격=" + gap.toFixed(2) + "s");
        
        // 간격이 0.1초 이상인 경우에만 이동 (작은 오차는 무시)
        if (gap > 0.1) {
            try {
                // 안전성 검사: 다른 클립과 겹치지 않는지 확인
                var newStart = targetTime;
                var newEnd = targetTime + currentClip.duration;
                var canMove = true;
                
                // 이동 후 위치가 다른 클립과 겹치는지 검사
                for (var k = 0; k < clips.length; k++) {
                    if (k === j) continue; // 자기 자신 제외
                    
                    var otherClip = clips[k];
                    if (k < j) {
                        // 이전 클립들과의 겹침 검사 (이미 처리된 클립들)
                        if (newStart < otherClip.end && newEnd > otherClip.start) {
                            $.writeln("경고: 클립 '" + currentClip.name + "'이 이전 클립 '" + otherClip.name + "'과 겹칠 수 있음");
                            canMove = false;
                            break;
                        }
                    }
                }
                
                if (canMove) {
                    // 방법 1: moveClip 메서드 사용 시도
                    var moveDistance = newStart - currentClip.start;
                    var moved = false;
                    
                    if (typeof currentClip.clip.move === 'function') {
                        try {
                            var moveTime = new Time();
                            moveTime.seconds = moveDistance;
                            currentClip.clip.move(moveTime);
                            moved = true;
                            $.writeln("move() 메서드로 클립 이동 성공");
                        } catch (moveMethodError) {
                            $.writeln("move() 메서드 실패: " + moveMethodError.toString());
                        }
                    }
                    
                    // 방법 2: move가 실패하거나 없으면 duration 기반 접근
                    if (!moved) {
                        try {
                            // 방법 2a: duration 속성 백업하고 start만 변경 후 duration 복원
                            var originalDuration = currentClip.clip.duration.seconds;
                            $.writeln("원본 duration: " + originalDuration.toFixed(3) + "s");
                            
                            var newStartTime = new Time();
                            newStartTime.seconds = newStart;
                            
                            // 시작 시간만 설정
                            currentClip.clip.start = newStartTime;
                            
                            // duration이 변경되었는지 확인하고 복원
                            var newDuration = currentClip.clip.duration.seconds;
                            $.writeln("변경된 duration: " + newDuration.toFixed(3) + "s");
                            
                            if (Math.abs(newDuration - originalDuration) > 0.01) {
                                $.writeln("Duration이 변경됨. end 시간을 조정하여 복원 시도...");
                                var correctedEndTime = new Time();
                                correctedEndTime.seconds = newStart + originalDuration;
                                currentClip.clip.end = correctedEndTime;
                                
                                // 최종 확인
                                var finalDuration = currentClip.clip.duration.seconds;
                                $.writeln("최종 duration: " + finalDuration.toFixed(3) + "s");
                            }
                            
                            moved = true;
                            $.writeln("duration 보존 방식으로 클립 이동 성공");
                        } catch (durationMoveError) {
                            $.writeln("duration 보존 이동 실패: " + durationMoveError.toString());
                            
                            // 방법 2b: 마지막 수단 - 단순 start 설정
                            try {
                                var simpleStartTime = new Time();
                                simpleStartTime.seconds = newStart;
                                currentClip.clip.start = simpleStartTime;
                                moved = true;
                                $.writeln("단순 start 설정으로 이동 (duration 변경 가능성 있음)");
                            } catch (simpleError) {
                                $.writeln("모든 이동 방법 실패: " + simpleError.toString());
                            }
                        }
                    }
                    
                    if (moved) {
                        clipsMoved++;
                        gapsRemoved++;
                        
                        $.writeln(trackType + " 트랙: '" + currentClip.name + "' 클립을 " + 
                                 currentClip.start.toFixed(2) + "s → " + newStart.toFixed(2) + "s로 이동 (길이: " + currentClip.duration.toFixed(2) + "s, 간격 " + gap.toFixed(2) + "s 제거)");
                        
                        // 배열 업데이트 (다음 반복을 위해)
                        currentClip.start = newStart;
                        currentClip.end = newStart + currentClip.duration;
                        
                        // 다음 클립을 위한 목표 시간 업데이트
                        targetTime = newStart + currentClip.duration;
                    } else {
                        $.writeln("클립 '" + currentClip.name + "' 이동 완전 실패");
                        targetTime = currentClip.end;
                    }
                } else {
                    $.writeln("클립 '" + currentClip.name + "' 이동 불가 (다른 클립과 겹침 위험)");
                    targetTime = currentClip.end;
                }
            } catch (moveError) {
                $.writeln("클립 이동 실패: " + currentClip.name + " - " + moveError.toString());
                targetTime = currentClip.end;
            }
        } else {
            // 간격이 작으면 그대로 두고 다음 위치 업데이트
            targetTime = currentClip.end;
        }
    }
    
    return { clipsMoved: clipsMoved, gapsRemoved: gapsRemoved };
}