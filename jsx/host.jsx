/**
 * JSCEditHelper Extension - Simplified Host Script (JSX)
 * Premiere Pro와 CEP 패널 간의 통신을 담당합니다.
 * 부분 포팅 아키텍처: Adobe API 호출만 담당, 비즈니스 로직은 TypeScript에서 처리
 */

// 디버그 모드 설정
var DEBUG_MODE = true;

// 안전한 JSON 헬퍼 함수 (전역 JSON 오염 방지)
var JSCEditHelperJSON = {
    stringify: function(obj) {
        try {
            // 네이티브 JSON이 있으면 사용
            if (typeof JSON !== 'undefined' && JSON.stringify) {
                return JSON.stringify(obj);
            }

            // 폴백 구현
            if (obj === null) return 'null';
            if (typeof obj === 'string') return '"' + obj.replace(/"/g, '\\"') + '"';
            if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
            if (typeof obj === 'object') {
                if (obj.constructor === Array) {
                    var arr = [];
                    for (var i = 0; i < obj.length; i++) {
                        arr.push(JSCEditHelperJSON.stringify(obj[i]));
                    }
                    return '[' + arr.join(',') + ']';
                } else {
                    var props = [];
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            props.push('"' + key + '":' + JSCEditHelperJSON.stringify(obj[key]));
                        }
                    }
                    return '{' + props.join(',') + '}';
                }
            }
            return '{}';
        } catch (e) {
            debugWriteln("JSCEditHelperJSON.stringify error: " + e.toString());
            return '{}';
        }
    },
    parse: function(str) {
        try {
            // 네이티브 JSON이 있으면 사용
            if (typeof JSON !== 'undefined' && JSON.parse) {
                return JSON.parse(str);
            }

            // 폴백 구현
            return eval('(' + str + ')');
        } catch (e) {
            debugWriteln("JSCEditHelperJSON.parse error: " + e.toString());
            return null;
        }
    }
};

debugWriteln("JSCEditHelper JSON helper loaded (non-global)");

// 조건부 로깅 함수
function debugWriteln(message) {
    if (DEBUG_MODE && $) {
        $.writeln("[JSCEditHelper] " + message);
    }
}

/**
 * ExtendScript 호환 헬퍼 함수들
 */
function stringStartsWith(str, prefix) {
    return str.length >= prefix.length && str.substring(0, prefix.length) === prefix;
}

function stringEndsWith(str, suffix) {
    return str.length >= suffix.length && str.substring(str.length - suffix.length) === suffix;
}

function stringContains(str, searchStr) {
    for (var i = 0; i <= str.length - searchStr.length; i++) {
        if (str.substring(i, i + searchStr.length) === searchStr) {
            return true;
        }
    }
    return false;
}

// PlugPlugExternalObject 라이브러리 로드
var plugPlugLib = null;
var plugPlugLoaded = false;

var plugPlugPaths = [
    "lib:PlugPlugExternalObject",
    $.fileName.replace(/[^\/\\]*$/, "") + "lib/PlugPlugExternalObject.dll",
    $.fileName.replace(/[^\/\\]*$/, "") + "lib/PlugPlugExternalObject.bundle"
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
        debugWriteln("PlugPlugExternalObject 로드 실패: " + e.toString());
        continue;
    }
}

if (!plugPlugLoaded) {
    debugWriteln("PlugPlugExternalObject 로드 실패 - CEP 기본 CSXSEvent 사용");
}

var csxsEventAvailable = true;
debugWriteln("CSXSEvent 초기화 완료");

// CSXSEvent를 안전하게 사용하는 헬퍼 함수
function safeCSXSEvent(eventType, eventData, scope) {
    if (!csxsEventAvailable) {
        debugWriteln("CSXSEvent 비활성화됨 - 이벤트 무시: " + eventType);
        return false;
    }
    
    try {
        var xLib = ExternalObject('lib:PlugPlugExternalObject');
        if (xLib) {
            var eventObj = new CSXSEvent();
            eventObj.type = eventType;
            eventObj.data = eventData;
            eventObj.dispatch();
            debugWriteln("이벤트 전송 성공: " + eventType);
            return true;
        } else {
            debugWriteln("PlugPlugExternalObject 사용 불가 - 이벤트 무시: " + eventType);
            return false;
        }
    } catch (e) {
        debugWriteln("이벤트 전송 실패: " + e.toString());
        csxsEventAvailable = false;
        return false;
    }
}

/**
 * 프로젝트에서 파일명으로 아이템 검색
 */
function findProjectItemByName(fileName) {
    function searchInBin(bin) {
        for (var i = 0; i < bin.children.numItems; i++) {
            var item = bin.children[i];
            if (item.type === ProjectItemType.CLIP || item.type === ProjectItemType.FILE) {
                // 이름이 정확히 매칭되는지 확인
                if (item.name === fileName) {
                    return item;
                }
            } else if (item.type === ProjectItemType.BIN) {
                var found = searchInBin(item);
                if (found) return found;
            }
        }
        return null;
    }
    
    return searchInBin(app.project.rootItem);
}

/**
 * 파일 경로로 프로젝트 아이템 검색 (더 정확한 매칭)
 */
function findProjectItemByFilePath(filePath) {
    function searchInBin(bin) {
        for (var i = 0; i < bin.children.numItems; i++) {
            var item = bin.children[i];
            if (item.type === ProjectItemType.CLIP || item.type === ProjectItemType.FILE) {
                // 실제 파일 경로 확인
                if (item.getMediaPath && item.getMediaPath() === filePath) {
                    return item;
                }
                // 파일명도 확인 (확장자 포함)
                var itemFileName = item.getMediaPath ? item.getMediaPath().split("\\").pop().split("/").pop() : item.name;
                var targetFileName = filePath.split("\\").pop().split("/").pop();
                if (itemFileName === targetFileName) {
                    return item;
                }
            } else if (item.type === ProjectItemType.BIN) {
                var found = searchInBin(item);
                if (found) return found;
            }
        }
        return null;
    }
    
    return searchInBin(app.project.rootItem);
}

/**
 * SoundEngine 명령 실행기
 * TypeScript SoundEngine에서 전송된 명령을 처리
 */
function executeSoundEngineCommand(commandJson) {
    try {
        debugWriteln("SoundEngine 명령 수신: " + commandJson);
        var command = JSON.parse(commandJson);
        
        switch (command.action) {
            case 'getAudioFiles':
                return getAudioFilesCommand(command.data);
            case 'getSelectedClips':
                return getSelectedClipsCommand();
            case 'getAllClips':
                return getAllClipsCommand();
            case 'executeInsertionPlan':
                return executeInsertionPlanCommand(command.data);
            case 'executeMagnetPlan':
                return executeMagnetPlanCommand(command.data);
            default:
                debugWriteln("알 수 없는 명령: " + command.action);
                return JSON.stringify({
                    success: false,
                    message: "알 수 없는 명령입니다: " + command.action
                });
        }
    } catch (e) {
        debugWriteln("명령 처리 중 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "명령 처리 중 오류가 발생했습니다: " + e.message
        });
    }
}

/**
 * 오디오 파일 목록 가져오기
 */
function getAudioFilesCommand(data) {
    try {
        debugWriteln("오디오 파일 검색 시작: " + data.folderPath);
        
        var folderPath = data.folderPath.replace(/['"`]/g, "").replace(/\\\\/g, '\\').replace(/\//g, '\\');
        var folder = new Folder(folderPath);
        
        if (!folder.exists) {
            return JSON.stringify({
                success: false,
                message: "폴더를 찾을 수 없습니다: " + folderPath
            });
        }
        
        var audioFiles = [];
        var files = folder.getFiles();
        var supportedExtensions = ['.wav', '.mp3', '.aif', '.aiff', '.m4a', '.WAV', '.MP3', '.AIF', '.AIFF', '.M4A'];
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file instanceof File) {
                var fileName = file.name;
                var hasValidExtension = false;
                
                // 확장자 체크 (ExtendScript 호환)
                for (var j = 0; j < supportedExtensions.length; j++) {
                    if (stringEndsWith(fileName.toLowerCase(), supportedExtensions[j])) {
                        hasValidExtension = true;
                        break;
                    }
                }
                
                if (hasValidExtension) {
                    // Default 접두사 필터링 (ExtendScript 호환)
                    if (data.filterByDefaultPrefix) {
                        if (stringStartsWith(fileName.toLowerCase(), 'default')) {
                            audioFiles.push(file.fsName);
                        }
                    } else {
                        audioFiles.push(file.fsName);
                    }
                }
            }
        }
        
        debugWriteln("발견된 오디오 파일: " + audioFiles.length + "개");
        return JSON.stringify({
            success: true,
            message: audioFiles.length + "개의 오디오 파일을 찾았습니다.",
            data: audioFiles
        });
        
    } catch (e) {
        debugWriteln("오디오 파일 검색 중 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "오디오 파일 검색 중 오류가 발생했습니다: " + e.message
        });
    }
}

/**
 * 선택된 클립 정보 가져오기
 */
function getSelectedClipsCommand() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) {
            return JSON.stringify({
                success: false,
                message: "활성화된 시퀀스가 없습니다."
            });
        }
        
        var selectedClips = [];
        var videoTracks = seq.videoTracks;
        
        for (var trackIndex = 0; trackIndex < videoTracks.numTracks; trackIndex++) {
            var track = videoTracks[trackIndex];
            var clips = track.clips;
            
            for (var clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
                var clip = clips[clipIndex];
                if (clip.isSelected()) {
                    selectedClips.push({
                        id: clip.nodeId,
                        name: clip.name,
                        start: {
                            ticks: clip.start.ticks,
                            seconds: clip.start.seconds
                        },
                        end: {
                            ticks: clip.end.ticks,
                            seconds: clip.end.seconds
                        },
                        duration: {
                            ticks: clip.duration.ticks,
                            seconds: clip.duration.seconds
                        },
                        trackIndex: trackIndex,
                        trackType: 'video',
                        selected: true
                    });
                }
            }
        }
        
        debugWriteln("선택된 클립: " + selectedClips.length + "개");
        return JSON.stringify({
            success: true,
            message: selectedClips.length + "개의 클립이 선택되었습니다.",
            data: selectedClips
        });
        
    } catch (e) {
        debugWriteln("클립 정보 수집 중 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "클립 정보 수집 중 오류가 발생했습니다: " + e.message
        });
    }
}

/**
 * 시퀀스 내 모든 클립 정보 가져오기
 */
function getAllClipsCommand() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) {
            return JSON.stringify({
                success: false,
                message: "활성화된 시퀀스가 없습니다."
            });
        }
        
        var allClips = [];
        var videoTracks = seq.videoTracks;
        
        // 활성화된 트랙 찾기
        var activeTrackIndex = -1;
        var debugLog = "=== 클립 자동 정렬 - 활성 트랙 검색 ===\n";
        
        // 방법 1: 선택된 클립이 있는 트랙 찾기
        debugLog += "선택된 클립으로 활성 트랙 검색 중...\n";
        for (var trackIndex = 0; trackIndex < videoTracks.numTracks; trackIndex++) {
            var track = videoTracks[trackIndex];
            var clips = track.clips;
            
            for (var clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
                var clip = clips[clipIndex];
                if (clip.isSelected()) {
                    activeTrackIndex = trackIndex;
                    debugLog += "✅ 선택된 클립 발견 - 트랙 " + (trackIndex + 1) + " 활성으로 설정\n";
                    break;
                }
            }
            if (activeTrackIndex >= 0) break;
        }
        
        // 방법 2: 선택된 클립이 없으면 track targeting (파란색 불)이 활성화된 트랙 검색
        if (activeTrackIndex < 0) {
            debugLog += "선택된 클립 없음 - track targeting 활성화된 트랙 검색 중...\n";
            for (var trackIndex = 0; trackIndex < videoTracks.numTracks; trackIndex++) {
                var track = videoTracks[trackIndex];
                try {
                    // track targeting 상태 확인 (파란색 불)
                    if (track.isTargeted && track.isTargeted()) {
                        activeTrackIndex = trackIndex;
                        debugLog += "✅ Track targeting 활성화된 트랙 발견 - 트랙 " + (trackIndex + 1) + " 활성으로 설정\n";
                        break;
                    }
                } catch (e) {
                    debugLog += "⚠️ 트랙 " + (trackIndex + 1) + " targeting 상태 확인 실패: " + e.message + "\n";
                }
            }
            
            // track targeting이 없으면 첫 번째 비어있지 않은 트랙으로 fallback
            if (activeTrackIndex < 0) {
                debugLog += "Track targeting 트랙 없음 - 첫 번째 비어있지 않은 트랙으로 fallback...\n";
                for (var trackIndex = 0; trackIndex < videoTracks.numTracks; trackIndex++) {
                    var track = videoTracks[trackIndex];
                    if (track.clips.numItems > 0) {
                        activeTrackIndex = trackIndex;
                        debugLog += "✅ 첫 번째 비어있지 않은 트랙 발견 - 트랙 " + (trackIndex + 1) + " 활성으로 설정 (fallback)\n";
                        break;
                    }
                }
            }
        }
        
        // 활성화된 트랙이 없으면 모든 트랙 처리 (기존 방식)
        var tracksToProcess = [];
        if (activeTrackIndex >= 0) {
            tracksToProcess.push(activeTrackIndex);
            debugLog += "📍 활성 트랙 " + (activeTrackIndex + 1) + "만 처리 예정\n";
            debugWriteln("클립 자동 정렬: 활성 트랙 " + (activeTrackIndex + 1) + "만 처리");
        } else {
            // 모든 트랙 처리 (fallback)
            for (var i = 0; i < videoTracks.numTracks; i++) {
                tracksToProcess.push(i);
            }
            debugLog += "⚠️ 활성 트랙 없음 - 모든 트랙 " + videoTracks.numTracks + "개 처리 예정\n";
            debugWriteln("클립 자동 정렬: 활성 트랙 없음, 모든 트랙 처리");
        }
        
        debugWriteln(debugLog);
        
        // 지정된 트랙들의 클립만 처리
        for (var i = 0; i < tracksToProcess.length; i++) {
            var trackIndex = tracksToProcess[i];
            var track = videoTracks[trackIndex];
            var clips = track.clips;
            
            for (var clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
                var clip = clips[clipIndex];
                allClips.push({
                    id: clip.nodeId,
                    name: clip.name,
                    start: {
                        ticks: clip.start.ticks,
                        seconds: clip.start.seconds
                    },
                    end: {
                        ticks: clip.end.ticks,
                        seconds: clip.end.seconds
                    },
                    duration: {
                        ticks: clip.duration.ticks,
                        seconds: clip.duration.seconds
                    },
                    trackIndex: trackIndex,
                    trackType: 'video',
                    selected: clip.isSelected()
                });
            }
        }
        
        var summaryMessage;
        if (tracksToProcess.length === 1) {
            summaryMessage = "활성 트랙 " + (tracksToProcess[0] + 1) + "에서 " + allClips.length + "개의 클립을 발견했습니다.";
        } else {
            summaryMessage = "모든 트랙(" + tracksToProcess.length + "개)에서 " + allClips.length + "개의 클립을 발견했습니다.";
        }
        
        debugWriteln("전체 클립: " + allClips.length + "개 (처리된 트랙: " + tracksToProcess.length + "개)");
        return JSON.stringify({
            success: true,
            message: summaryMessage,
            data: allClips,
            processedTracks: tracksToProcess.length,
            activeTrackIndex: activeTrackIndex >= 0 ? activeTrackIndex : null
        });
        
    } catch (e) {
        debugWriteln("클립 정보 수집 중 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "클립 정보 수집 중 오류가 발생했습니다: " + e.message
        });
    }
}

/**
 * 효과음 삽입 계획 실행
 */
function executeInsertionPlanCommand(data) {
    var debugLog = "=== JSX 삽입 계획 실행 디버그 ===\n";
    
    try {
        debugWriteln("효과음 삽입 계획 실행 시작");
        debugLog += "효과음 삽입 계획 실행 시작\n";
        
        var seq = app.project.activeSequence;
        if (!seq) {
            debugLog += "❌ 활성화된 시퀀스가 없음\n";
            return JSON.stringify({
                success: false,
                message: "활성화된 시퀀스가 없습니다.",
                debug: debugLog
            });
        }
        debugLog += "✅ 활성 시퀀스 확인됨: " + seq.name + "\n";
        
        var insertions = data.insertions;
        var audioTrack = data.audioTrack;
        var successCount = 0;
        var targetAudioTrackIndex = 0; // 실제 사용될 트랙 인덱스
        
        debugLog += "삽입 계획 수: " + insertions.length + "개\n";
        debugLog += "요청된 오디오 트랙: " + audioTrack + "\n";
        
        // 오디오 트랙 존재 확인 및 자동 선택 처리
        var audioTracks = seq.audioTracks;
        debugLog += "사용 가능한 오디오 트랙 수: " + audioTracks.numTracks + "\n";
        
        if (audioTrack === "auto") {
            debugLog += "자동 선택 모드: 빈 오디오 트랙 찾기 시작\n";
            var foundEmptyTrack = false;
            
            // 모든 오디오 트랙을 순차적으로 검사
            debugLog += "전체 오디오 트랙 검사 시작 (총 " + audioTracks.numTracks + "개)\n";
            
            for (var tk = 0; tk < audioTracks.numTracks; tk++) {
                debugLog += "트랙 인덱스 " + tk + " 검사 중...\n";
                
                try {
                    var currentTrack = audioTracks[tk];
                    debugLog += "  트랙 " + (tk + 1) + " 객체 존재: " + (currentTrack ? "YES" : "NO") + "\n";
                    
                    if (currentTrack) {
                        var isLocked = currentTrack.isLocked();
                        var isMuted = currentTrack.isMuted();
                        var isEmpty = currentTrack.clips.numItems === 0;
                        
                        debugLog += "  트랙 " + (tk + 1) + " 상태 - 잠김: " + isLocked + ", 음소거: " + isMuted + ", 비어있음: " + isEmpty + ", 클립수: " + currentTrack.clips.numItems + "\n";
                        
                        // 잠겨있지 않고 비어있으면 선택 (음소거 상태는 무시)
                        if (!isLocked && isEmpty) {
                            targetAudioTrackIndex = tk;
                            foundEmptyTrack = true;
                            debugLog += "✅ 빈 오디오 트랙 발견: 트랙 " + (tk + 1) + " (인덱스: " + tk + ")" + (isMuted ? " [음소거 상태지만 삽입 가능]" : "") + "\n";
                            break;
                        }
                    } else {
                        debugLog += "  ⚠️ 트랙 " + (tk + 1) + "이 null 또는 undefined\n";
                    }
                } catch (trackError) {
                    debugLog += "  ❌ 트랙 " + (tk + 1) + " 검사 중 오류: " + trackError.toString() + "\n";
                }
            }
            
            if (!foundEmptyTrack) {
                // 빈 트랙이 없으면 경고 메시지와 함께 중단
                debugLog += "❌ 빈 오디오 트랙을 찾을 수 없습니다.\n";
                debugLog += "모든 오디오 트랙이 사용 중이거나 잠겨있습니다.\n";
                debugLog += "빈 트랙을 만들거나 기존 트랙을 비워주세요.\n";
                
                return JSON.stringify({
                    success: false,
                    message: "빈 오디오 트랙을 찾을 수 없습니다. 모든 트랙이 사용 중이거나 잠겨있습니다. 빈 트랙을 만들거나 기존 트랙을 비워주세요.",
                    debug: debugLog
                });
            }
        } else {
            // 명시적 트랙 번호 지정
            var specifiedTrack = parseInt(audioTrack);
            if (isNaN(specifiedTrack) || specifiedTrack < 1 || specifiedTrack > audioTracks.numTracks) {
                debugLog += "❌ 유효하지 않은 트랙 번호: " + audioTrack + "\n";
                return JSON.stringify({
                    success: false,
                    message: "유효하지 않은 오디오 트랙 번호: " + audioTrack + " (사용 가능: 1-" + audioTracks.numTracks + ")",
                    debug: debugLog
                });
            }
            targetAudioTrackIndex = specifiedTrack - 1; // 1-based를 0-based로 변환
            debugLog += "✅ 명시적 트랙 선택: 트랙 " + specifiedTrack + " (인덱스: " + targetAudioTrackIndex + ")\n";
        }
        
        debugLog += "최종 사용할 오디오 트랙: " + (targetAudioTrackIndex + 1) + " (인덱스: " + targetAudioTrackIndex + ")\n";
        
        for (var i = 0; i < insertions.length; i++) {
            var insertion = insertions[i];
            debugLog += "\n--- 삽입 " + (i + 1) + "/" + insertions.length + " ---\n";
            debugLog += "파일: " + insertion.audioFile + "\n";
            debugLog += "위치: " + insertion.position.seconds + "초\n";
            
            try {
                // 파일 존재 확인
                var audioFile = new File(insertion.audioFile);
                if (!audioFile.exists) {
                    debugLog += "❌ 오디오 파일이 존재하지 않음\n";
                    continue;
                }
                debugLog += "✅ 오디오 파일 존재 확인\n";
                
                // 기존 프로젝트 아이템 먼저 확인 (파일 경로로 정확한 매칭)
                var fileName = insertion.audioFile.split("\\").pop().split("/").pop();
                debugLog += "검색할 파일명: " + fileName + "\n";
                debugLog += "전체 파일 경로: " + insertion.audioFile + "\n";
                
                var importedItem = findProjectItemByFilePath(insertion.audioFile);
                if (importedItem) {
                    debugLog += "✅ 기존 프로젝트 아이템 발견, 임포트 생략: " + importedItem.name + "\n";
                    debugWriteln("기존 프로젝트 아이템 재사용: " + importedItem.name);
                } else {
                    // 파일이 없으면 임포트 시도
                    debugLog += "파일 임포트 시도...\n";
                
                // getInsertionBin() 안전 확인 및 대체 방법
                var targetBin = null;
                try {
                    targetBin = app.project.getInsertionBin();
                    debugLog += "getInsertionBin() 성공\n";
                } catch (binError) {
                    debugLog += "getInsertionBin() 실패: " + binError.toString() + "\n";
                    // 대체: 루트 빈 사용
                    targetBin = app.project.rootItem;
                    debugLog += "루트 빈 사용으로 대체\n";
                }
                
                if (!targetBin) {
                    debugLog += "❌ targetBin이 null, 루트 빈으로 대체\n";
                    targetBin = app.project.rootItem;
                }
                
                // importFiles 호출 세부 디버깅
                var importResult = null;
                try {
                    debugLog += "importFiles() 호출 중...\n";
                    debugLog += "파라미터: files=[" + insertion.audioFile + "], suppressUI=true, targetBin=" + (targetBin ? "존재" : "null") + ", importAsNumberedStills=false\n";
                    
                    // 각 파라미터 유효성 확인
                    if (!insertion.audioFile) {
                        debugLog += "❌ audioFile이 null/undefined\n";
                        continue;
                    }
                    
                    if (!targetBin) {
                        debugLog += "❌ targetBin이 null/undefined\n";
                        continue;
                    }
                    
                    // app.project 확인
                    if (!app.project) {
                        debugLog += "❌ app.project가 null\n";
                        continue;
                    }
                    
                    // importFiles 함수 존재 확인
                    if (typeof app.project.importFiles !== 'function') {
                        debugLog += "❌ app.project.importFiles가 함수가 아님: " + typeof app.project.importFiles + "\n";
                        continue;
                    }
                    
                    debugLog += "모든 파라미터 유효, importFiles 실행...\n";
                    importResult = app.project.importFiles([insertion.audioFile], true, targetBin, false);
                    debugLog += "importFiles 호출 완료\n";
                    
                } catch (importError) {
                    debugLog += "❌ importFiles 예외: " + importError.toString() + "\n";
                    debugLog += "예외 타입: " + importError.name + "\n";
                    if (importError.line) {
                        debugLog += "예외 라인: " + importError.line + "\n";
                    }
                    continue;
                }
                
                debugLog += "importResult 타입: " + typeof importResult + "\n";
                debugLog += "importResult 값: " + importResult + "\n";
                
                if (!importResult) {
                    debugLog += "❌ importResult가 null/undefined\n";
                    // 대체 방법: 수동으로 기존 프로젝트 아이템 검색
                    debugLog += "기존 프로젝트 아이템에서 검색 시도...\n";
                    debugLog += "검색할 파일명: " + fileName + "\n";
                    
                    var foundItem = findProjectItemByName(fileName);
                    if (foundItem) {
                        debugLog += "✅ 기존 프로젝트 아이템 발견: " + foundItem.name + "\n";
                        importedItem = foundItem;
                    } else {
                        debugLog += "❌ 기존 프로젝트 아이템에서도 찾을 수 없음\n";
                        continue;
                    }
                } else if (typeof importResult.length !== 'undefined') {
                    debugLog += "importResult.length: " + importResult.length + "\n";
                    if (importResult.length === 0) {
                        debugLog += "❌ importResult 배열이 비어있음\n";
                        continue;
                    } else {
                        var importedItem = importResult[0];
                        if (!importedItem) {
                            debugLog += "❌ importedItem[0]이 null/undefined\n";
                            continue;
                        }
                        debugLog += "✅ 파일 임포트 성공: " + importedItem.name + "\n";
                    }
                } else if (typeof importResult === 'boolean') {
                    debugLog += "importResult는 boolean 타입 (Premiere Pro 구버전 API)\n";
                    if (importResult === true) {
                        debugLog += "✅ importFiles 성공 (boolean true), 프로젝트에서 파일 검색...\n";
                        // 파일이 성공적으로 임포트되었으므로 프로젝트에서 찾기
                        debugLog += "검색할 파일명: " + fileName + "\n";
                        
                        var foundItem = findProjectItemByName(fileName);
                        if (foundItem) {
                            debugLog += "✅ 임포트된 파일 발견: " + foundItem.name + "\n";
                            importedItem = foundItem;
                        } else {
                            debugLog += "❌ 임포트된 파일을 프로젝트에서 찾을 수 없음\n";
                            continue;
                        }
                    } else {
                        debugLog += "❌ importFiles 실패 (boolean false)\n";
                        continue;
                    }
                } else {
                    debugLog += "❌ importResult가 예상되지 않은 타입: " + typeof importResult + "\n";
                    continue;
                }
                } // else 블록 종료 (기존 프로젝트 아이템이 없을 때만 임포트)
                
                // 클립 길이 사전 조정 (프로젝트 아이템 레벨에서)
                if (insertion.clipDuration && importedItem) {
                    debugLog += "프로젝트 아이템 길이 사전 조정 시도...\n";
                    try {
                        if (importedItem.setInPoint && importedItem.setOutPoint) {
                            var clipDurationSeconds = insertion.clipDuration.seconds;
                            debugLog += "프로젝트 아이템 길이 조정: " + clipDurationSeconds + "초\n";
                            
                            importedItem.setInPoint(0, 4); // 0초부터 시작
                            importedItem.setOutPoint(clipDurationSeconds, 4); // 클립 길이만큼
                            
                            debugLog += "✅ 프로젝트 아이템 길이 조정 완료\n";
                            debugWriteln("프로젝트 아이템 길이 조정 완료: " + clipDurationSeconds + "초");
                        } else {
                            debugLog += "❌ 프로젝트 아이템에 setInPoint/setOutPoint 메서드 없음\n";
                        }
                    } catch (pretrimeError) {
                        debugLog += "❌ 프로젝트 아이템 길이 조정 실패: " + pretrimeError.toString() + "\n";
                        debugWriteln("프로젝트 아이템 길이 조정 실패: " + pretrimeError.toString());
                    }
                }
                
                // 오디오 트랙에 삽입 (계산된 targetAudioTrackIndex 사용)
                var targetTrack = audioTracks[targetAudioTrackIndex];
                var insertTime = insertion.position.seconds;
                
                debugLog += "트랙 삽입 시도: Track " + (targetAudioTrackIndex + 1) + " (인덱스: " + targetAudioTrackIndex + ") at " + insertTime + "s\n";
                
                if (!targetTrack) {
                    debugLog += "❌ 대상 트랙이 존재하지 않음 (인덱스: " + targetAudioTrackIndex + ")\n";
                    continue;
                }
                
                if (targetTrack.isLocked && targetTrack.isLocked()) {
                    debugLog += "❌ 대상 트랙이 잠겨있음\n";
                    continue;
                }
                
                // insertClip 메서드 시도
                var insertSuccess = false;
                try {
                    targetTrack.insertClip(importedItem, insertTime);
                    insertSuccess = true;
                    debugLog += "✅ insertClip 성공\n";
                } catch (insertError) {
                    debugLog += "❌ insertClip 실패: " + insertError.toString() + "\n";
                    
                    // 대안: overwriteClip 시도
                    try {
                        debugLog += "overwriteClip 시도...\n";
                        targetTrack.overwriteClip(importedItem, insertTime);
                        insertSuccess = true;
                        debugLog += "✅ overwriteClip 성공\n";
                    } catch (overwriteError) {
                        debugLog += "❌ overwriteClip도 실패: " + overwriteError.toString() + "\n";
                    }
                }
                
                if (insertSuccess) {
                    successCount++;
                    debugWriteln("효과음 삽입 성공: " + insertion.audioFile + " at " + insertTime + "s");
                }
                
            } catch (e) {
                debugLog += "❌ 개별 삽입 예외: " + e.toString() + "\n";
                debugWriteln("개별 삽입 실패: " + e.toString());
            }
        }
        
        debugLog += "\n=== 삽입 완료 ===\n";
        debugLog += "성공: " + successCount + "개\n";
        debugLog += "전체: " + insertions.length + "개\n";
        
        return JSON.stringify({
            success: successCount > 0,
            message: successCount + "개의 효과음이 삽입되었습니다.",
            data: {
                inserted: successCount,
                total: insertions.length
            },
            debug: debugLog
        });
        
    } catch (e) {
        debugLog += "❌ 전체 실행 예외: " + e.toString() + "\n";
        debugWriteln("삽입 계획 실행 중 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "삽입 계획 실행 중 오류가 발생했습니다: " + e.message,
            debug: debugLog
        });
    }
}

/**
 * 마그넷 계획 실행 (클립 자동 정렬)
 */
function executeMagnetPlanCommand(data) {
    try {
        debugWriteln("마그넷 계획 실행 시작");
        
        var seq = app.project.activeSequence;
        if (!seq) {
            return JSON.stringify({
                success: false,
                message: "활성화된 시퀀스가 없습니다."
            });
        }
        
        var movements = data.movements;
        var successCount = 0;
        
        // 클립 이동 실행
        for (var i = 0; i < movements.length; i++) {
            var movement = movements[i];
            try {
                // 클립 ID로 클립 찾기 및 이동
                var clip = findClipById(seq, movement.clip.id);
                if (clip) {
                    var originalDuration = clip.duration.seconds;
                    var newStartTime = movement.toPosition.seconds;
                    var newEndTime = newStartTime + originalDuration;
                    
                    // 클립의 시작과 끝 시간을 모두 설정
                    clip.start = newStartTime;
                    clip.end = newEndTime;
                    
                    successCount++;
                    debugWriteln("클립 이동 성공: " + movement.clip.name + " from " + movement.fromPosition.seconds + "s to " + newStartTime + "s (duration: " + originalDuration + "s)");
                }
            } catch (e) {
                debugWriteln("개별 클립 이동 실패: " + e.toString());
            }
        }
        
        return JSON.stringify({
            success: successCount > 0,
            message: successCount + "개의 클립이 이동되었습니다.",
            data: {
                moved: successCount,
                total: movements.length
            }
        });
        
    } catch (e) {
        debugWriteln("마그넷 계획 실행 중 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "마그넷 계획 실행 중 오류가 발생했습니다: " + e.message
        });
    }
}

/**
 * 클립 ID로 클립 찾기 헬퍼 함수
 */
function findClipById(sequence, clipId) {
    var videoTracks = sequence.videoTracks;
    
    for (var trackIndex = 0; trackIndex < videoTracks.numTracks; trackIndex++) {
        var track = videoTracks[trackIndex];
        var clips = track.clips;
        
        for (var clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
            var clip = clips[clipIndex];
            if (clip.nodeId === clipId) {
                return clip;
            }
        }
    }
    return null;
}

// ===== 기존 함수들 (하위 호환성 유지) =====

/**
 * 폴더 찾아보기 (기존 함수 유지)
 */
function browseSoundFolder() {
    try {
        var folder = Folder.selectDialog("효과음 폴더를 선택하세요");
        if (folder) {
            debugWriteln("선택된 폴더: " + folder.fsName);
            return folder.fsName;
        }
        return null;
    } catch (e) {
        debugWriteln("폴더 선택 오류: " + e.toString());
        return "error: " + e.message;
    }
}

/**
 * 이벤트 전송 (기존 함수 유지)
 */
function sendEvent(message, success) {
    try {
        var eventData;
        if (typeof message === "string") {
            eventData = JSON.stringify({
                message: message,
                success: success !== false
            });
        } else {
            eventData = JSON.stringify(message);
        }
        
        safeCSXSEvent("com.adobe.soundInserter.events.SoundEvent", eventData);
    } catch (e) {
        debugWriteln("이벤트 전송 오류: " + e.toString());
    }
}

/**
 * 파일 목록 가져오기 - 콜백 방식 (새로운 함수)
 */
function getFilesForPathWithCallback(folderPathFromJS) {
    try {
        debugWriteln("getFilesForPathWithCallback 호출: " + folderPathFromJS);
        
        var cleanedPath = folderPathFromJS.replace(/['"`]/g, "");
        var folder = new Folder(cleanedPath);
        
        if (!folder.exists) {
            debugWriteln("폴더를 찾을 수 없음: " + cleanedPath);
            return JSON.stringify({
                success: false,
                error: "폴더를 찾을 수 없습니다: " + cleanedPath,
                soundFiles: [],
                folderPath: cleanedPath
            });
        }
        
        var soundFiles = [];
        var files = folder.getFiles();
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file instanceof File) {
                var fileName = file.name;
                var extension = fileName.substring(fileName.lastIndexOf('.'));
                var supportedExtensions = ['.wav', '.mp3', '.aif', '.aiff', '.m4a'];
                
                // ExtendScript 호환 확장자 검사
                var isSupported = false;
                for (var j = 0; j < supportedExtensions.length; j++) {
                    if (stringEndsWith(fileName.toLowerCase(), supportedExtensions[j])) {
                        isSupported = true;
                        break;
                    }
                }
                
                if (isSupported) {
                    soundFiles.push({
                        name: fileName,
                        fsName: file.fsName
                    });
                }
            }
        }
        
        // 파일명을 디코딩하여 한글 파일명이 제대로 표시되도록 수정
        for (var k = 0; k < soundFiles.length; k++) {
            soundFiles[k].name = File.decode(soundFiles[k].name);
        }
        
        debugWriteln("getFilesForPathWithCallback: 사운드 파일 " + soundFiles.length + "개 발견");
        
        var resultData = {
            success: true,
            soundFiles: soundFiles,
            folderPath: cleanedPath
        };
        
        return JSON.stringify(resultData);
        
    } catch (e) {
        debugWriteln("getFilesForPathWithCallback 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            error: e.message,
            soundFiles: [],
            folderPath: folderPathFromJS
        });
    }
}

/**
 * 파일 목록 가져오기 (기존 함수 유지)
 */
function getFilesForPathCS(folderPathFromJS) {
    try {
        debugWriteln("getFilesForPathCS 호출: " + folderPathFromJS);
        
        var cleanedPath = folderPathFromJS.replace(/['"`]/g, "");
        var folder = new Folder(cleanedPath);
        
        if (!folder.exists) {
            sendEvent("error: 폴더를 찾을 수 없습니다: " + cleanedPath, false);
            return "error: folder not found";
        }
        
        var soundFiles = [];
        var files = folder.getFiles();
        
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file instanceof File) {
                var fileName = file.name;
                var extension = fileName.substring(fileName.lastIndexOf('.'));
                var supportedExtensions = ['.wav', '.mp3', '.aif', '.aiff', '.m4a'];
                
                // ExtendScript 호환 확장자 검사
                var isSupported = false;
                for (var j = 0; j < supportedExtensions.length; j++) {
                    if (stringEndsWith(fileName.toLowerCase(), supportedExtensions[j])) {
                        isSupported = true;
                        break;
                    }
                }
                
                if (isSupported) {
                    soundFiles.push({
                        name: fileName,
                        fsName: file.fsName
                    });
                }
            }
        }
        
        var resultData = {
            soundFiles: soundFiles,
            folderPath: cleanedPath
        };
        
        debugWriteln("getFilesForPathCS: 사운드 파일 " + soundFiles.length + "개 발견");
        debugWriteln("getFilesForPathCS: 결과 데이터 = " + JSON.stringify(resultData));
        
        // 이벤트 발송 시도
        var eventSent = safeCSXSEvent("com.adobe.soundInserter.events.FileListEvent", JSON.stringify(resultData));
        debugWriteln("getFilesForPathCS: 이벤트 발송 결과 = " + eventSent);
        
        return "success";
        
    } catch (e) {
        debugWriteln("getFilesForPathCS 오류: " + e.toString());
        sendEvent("error: 파일 목록 가져오기 실패: " + e.message, false);
        return "error: " + e.message;
    }
}

/**
 * 프로젝트에서 기존 오디오 파일 찾기 (재귀적으로 모든 폴더 검색)
 */
function findExistingAudioItem(soundFilePath) {
    try {
        var soundFile = new File(soundFilePath);
        var soundFileName = File.decode(soundFile.name);
        
        debugWriteln("기존 아이템 검색 중: " + soundFileName);
        
        // 재귀적으로 프로젝트 아이템 검색
        function searchInBin(bin) {
            debugWriteln("폴더 검색: " + bin.name + " (아이템 수: " + bin.children.numItems + ")");
            
            for (var i = 0; i < bin.children.numItems; i++) {
                var item = bin.children[i];
                
                if (item.type === ProjectItemType.BIN) {
                    // 폴더인 경우 재귀 검색
                    var result = searchInBin(item);
                    if (result) return result;
                } else if (item.type === ProjectItemType.FILE || item.type === 1) {
                    try {
                        // 파일인 경우 경로와 이름 비교
                        var itemName = File.decode(item.name);
                        debugWriteln("파일 확인: " + itemName);
                        
                        // 파일명으로 먼저 비교
                        if (itemName === soundFileName) {
                            debugWriteln("파일명 매칭 성공: " + itemName);
                            return item;
                        }
                        
                        // 미디어 경로가 있는 경우 경로로 비교
                        if (item.getMediaPath) {
                            var itemPath = item.getMediaPath();
                            debugWriteln("경로 비교: " + itemPath + " vs " + soundFilePath);
                            if (itemPath === soundFilePath) {
                                debugWriteln("경로 매칭 성공: " + itemPath);
                                return item;
                            }
                        } else {
                            debugWriteln("getMediaPath 메서드 없음");
                        }
                    } catch (itemError) {
                        // 개별 아이템 처리 중 오류는 무시하고 계속
                        debugWriteln("아이템 처리 중 오류 (무시): " + itemError.toString());
                    }
                }
            }
            return null;
        }
        
        var result = searchInBin(app.project.rootItem);
        if (result) {
            debugWriteln("기존 프로젝트 아이템 발견: " + File.decode(result.name));
        } else {
            debugWriteln("기존 아이템을 찾을 수 없음");
        }
        
        return result;
    } catch (e) {
        debugWriteln("기존 아이템 검색 중 전체 오류: " + e.toString());
        return null;
    }
}

/**
 * 선택된 오디오 클립을 특정 사운드 파일로 교체 (안전한 래퍼)
 */
function replaceSelectedAudioClips(soundFilePath) {
    // 최상위 try-catch로 모든 예외 처리
    try {
        return replaceSelectedAudioClipsInternal(soundFilePath);
    } catch (topLevelError) {
        var errorInfo = "=== 최상위 오류 ===\n";
        errorInfo += "시간: " + new Date().toString() + "\n";
        errorInfo += "함수: replaceSelectedAudioClips\n";
        errorInfo += "파라미터: " + soundFilePath + "\n";
        errorInfo += "오류: " + topLevelError.toString() + "\n";
        errorInfo += "스택: " + (topLevelError.stack || "스택 정보 없음") + "\n";
        
        debugWriteln("최상위 오류: " + topLevelError.toString());
        
        return JSON.stringify({
            success: false,
            message: "함수 실행 중 치명적 오류가 발생했습니다: " + topLevelError.message,
            debug: errorInfo
        });
    }
}

/**
 * 실제 클립 교체 로직 (내부 함수)
 */
function replaceSelectedAudioClipsInternal(soundFilePath) {
    var debugInfo = "=== replaceSelectedAudioClips 상세 디버그 ===\n";
    debugInfo += "시간: " + new Date().toString() + "\n";
    debugInfo += "요청된 사운드 파일: " + soundFilePath + "\n";
    
    try {
        debugWriteln("replaceSelectedAudioClips 호출: " + soundFilePath);
        debugInfo += "함수 호출 성공\n";
        
        // 1. 기본 환경 확인 (안전하게)
        debugInfo += "\n--- 환경 확인 ---\n";
        try {
            debugInfo += "app 존재: " + (typeof app !== 'undefined' && app ? "YES" : "NO") + "\n";
            try {
                debugInfo += "app.project 존재: " + (app && app.project ? "YES" : "NO") + "\n";
                try {
                    debugInfo += "activeSequence 존재: " + (app && app.project && app.project.activeSequence ? "YES" : "NO") + "\n";
                } catch (seqError) {
                    debugInfo += "activeSequence 확인 중 오류: " + seqError.toString() + "\n";
                }
            } catch (projError) {
                debugInfo += "project 확인 중 오류: " + projError.toString() + "\n";
            }
        } catch (appError) {
            debugInfo += "app 확인 중 오류: " + appError.toString() + "\n";
        }
        
        if (!app.project || !app.project.activeSequence) {
            debugInfo += "ERROR: 활성 프로젝트나 시퀀스가 없음\n";
            debugWriteln("활성 프로젝트나 시퀀스가 없음");
            return JSON.stringify({
                success: false,
                message: "활성 프로젝트나 시퀀스가 없습니다.",
                debug: debugInfo
            });
        }
        
        var sequence = app.project.activeSequence;
        debugInfo += "시퀀스 이름: " + sequence.name + "\n";
        
        // 2. 선택 상태 상세 확인 (안전하게)
        debugInfo += "\n--- 선택 상태 확인 ---\n";
        var selection = null;
        try {
            selection = sequence.getSelection();
            debugInfo += "getSelection() 호출 성공\n";
            debugInfo += "selection 객체 존재: " + (selection ? "YES" : "NO") + "\n";
            debugInfo += "selection.length: " + (selection ? selection.length : "N/A") + "\n";
        } catch (selectionError) {
            debugInfo += "getSelection() 호출 실패: " + selectionError.toString() + "\n";
            selection = null;
        }
        
        if (!selection || selection.length === 0) {
            debugInfo += "선택된 클립이 없음 - 인디케이터 위치에 가상 클립 생성하여 삽입 모드로 전환\n";
            debugWriteln("선택된 클립이 없음 - 인디케이터 위치 삽입 모드");
            
            // 1. 현재 인디케이터 위치 가져오기
            var currentTime = getCurrentIndicatorPosition();
            if (currentTime === null) {
                debugInfo += "ERROR: 인디케이터 위치를 가져올 수 없음\n";
                return JSON.stringify({
                    success: false,
                    message: "현재 인디케이터 위치를 확인할 수 없습니다.",
                    debug: debugInfo
                });
            }
            
            // Time 객체를 초 단위 숫자로 변환
            var currentTimeInSeconds = typeof currentTime.seconds !== 'undefined' ? currentTime.seconds : currentTime;
            debugInfo += "현재 인디케이터 위치: " + currentTimeInSeconds + "초\n";
            
            // 2. 1.67초 길이의 가상 클립 생성 (기존 삽입 함수 재활용을 위해)
            var virtualClip = {
                start: { seconds: currentTimeInSeconds },
                end: { seconds: currentTimeInSeconds + 1.67 },
                duration: { seconds: 1.67 },
                projectItem: null, // 가상 클립이므로 null
                name: "가상 클립 (인디케이터 위치)"
            };
            
            // 3. 파일 존재 확인 및 임포트
            var soundFile = new File(soundFilePath);
            if (!soundFile.exists) {
                debugInfo += "ERROR: 사운드 파일을 찾을 수 없음\n";
                return JSON.stringify({
                    success: false,
                    message: "사운드 파일을 찾을 수 없습니다.",
                    debug: debugInfo
                });
            }
            
            var projectItem = findProjectItemByFilePath(soundFilePath);
            if (!projectItem) {
                debugWriteln("새 파일 임포트 중: " + soundFilePath);
                try {
                    var importedItems = app.project.importFiles([soundFilePath]);
                    if (importedItems && importedItems.length > 0) {
                        projectItem = importedItems[0];
                        debugWriteln("파일 임포트 성공");
                    } else {
                        debugInfo += "ERROR: 파일 임포트 실패\n";
                        return JSON.stringify({
                            success: false,
                            message: "오디오 파일을 임포트할 수 없습니다.",
                            debug: debugInfo
                        });
                    }
                } catch (importError) {
                    debugInfo += "ERROR: 파일 임포트 중 오류: " + importError.toString() + "\n";
                    return JSON.stringify({
                        success: false,
                        message: "오디오 파일 임포트 중 오류가 발생했습니다: " + importError.message,
                        debug: debugInfo
                    });
                }
            }
            
            // 4. 기존 GeneratedClip 삽입 함수 재활용 (가상 클립으로 처리)
            debugInfo += "가상 클립으로 기존 삽입 함수 재활용 시작\n";
            var insertResult = addAudioToGeneratedClip(virtualClip, projectItem, soundFilePath);
            
            debugInfo += "\n--- 인디케이터 위치 삽입 결과 ---\n";
            debugInfo += "성공: " + insertResult.success + "\n";
            debugInfo += "메시지: " + (insertResult.message || insertResult.error) + "\n";
            
            return JSON.stringify({
                success: insertResult.success,
                message: insertResult.success ? insertResult.message : insertResult.error,
                debug: debugInfo
            });
        }
        
        // 선택된 각 클립의 상세 정보 (안전하게)
        debugInfo += "\n--- 선택된 클립 상세 정보 ---\n";
        for (var i = 0; i < selection.length; i++) {
            try {
                var clip = selection[i];
                debugInfo += "클립 " + i + ":\n";
                debugInfo += "  - 존재: " + (clip ? "YES" : "NO") + "\n";
                
                if (clip) {
                    try {
                        debugInfo += "  - 타입: " + (typeof clip) + "\n";
                        debugInfo += "  - 클래스: " + (clip.constructor ? clip.constructor.name : "알 수 없음") + "\n";
                        
                        try {
                            debugInfo += "  - projectItem 존재: " + (clip.projectItem ? "YES" : "NO") + "\n";
                            if (clip.projectItem) {
                                try {
                                    debugInfo += "  - projectItem 이름: " + File.decode(clip.projectItem.name) + "\n";
                                    debugInfo += "  - projectItem 타입: " + clip.projectItem.type + "\n";
                                    
                                    // 미디어 타입 상세 확인
                                    try {
                                        if (clip.projectItem.getMediaPath) {
                                            var mediaPath = clip.projectItem.getMediaPath();
                                            debugInfo += "  - 미디어 경로: " + mediaPath + "\n";
                                            
                                            // 파일 확장자로 미디어 타입 판단
                                            var extension = mediaPath.substring(mediaPath.lastIndexOf('.')).toLowerCase();
                                            debugInfo += "  - 파일 확장자: " + extension + "\n";
                                            
                                            var audioExtensions = ['.wav', '.mp3', '.aif', '.aiff', '.m4a', '.flac'];
                                            var videoExtensions = ['.mp4', '.mov', '.avi', '.mxf', '.prores'];
                                            var imageExtensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.psd'];
                                            var graphicExtensions = ['.ai', '.eps', '.svg', '.pdf']; // 그래픽 파일 확장자 추가
                                            
                                            var isAudio = false;
                                            var isVideo = false;
                                            var isImage = false;
                                            var isGraphic = false;
                                            
                                            for (var j = 0; j < audioExtensions.length; j++) {
                                                if (extension === audioExtensions[j]) {
                                                    isAudio = true;
                                                    break;
                                                }
                                            }
                                            
                                            for (var k = 0; k < videoExtensions.length; k++) {
                                                if (extension === videoExtensions[k]) {
                                                    isVideo = true;
                                                    break;
                                                }
                                            }
                                            
                                            for (var l = 0; l < imageExtensions.length; l++) {
                                                if (extension === imageExtensions[l]) {
                                                    isImage = true;
                                                    break;
                                                }
                                            }
                                            
                                            for (var g = 0; g < graphicExtensions.length; g++) {
                                                if (extension === graphicExtensions[g]) {
                                                    isGraphic = true;
                                                    break;
                                                }
                                            }
                                            
                                            debugInfo += "  - 미디어 분류: ";
                                            if (isAudio) debugInfo += "오디오";
                                            else if (isVideo) debugInfo += "비디오";
                                            else if (isImage) debugInfo += "이미지";
                                            else if (isGraphic) debugInfo += "그래픽";
                                            else debugInfo += "알 수 없음";
                                            debugInfo += "\n";
                                        }
                                    } catch (mediaError) {
                                        debugInfo += "  - 미디어 정보 오류: " + mediaError.toString() + "\n";
                                    }
                                } catch (itemError) {
                                    debugInfo += "  - projectItem 정보 읽기 실패: " + itemError.toString() + "\n";
                                }
                            }
                        } catch (projItemError) {
                            debugInfo += "  - projectItem 확인 실패: " + projItemError.toString() + "\n";
                        }
                        
                        try {
                            debugInfo += "  - start: " + (clip.start ? clip.start.seconds : "N/A") + "초\n";
                            debugInfo += "  - end: " + (clip.end ? clip.end.seconds : "N/A") + "초\n";
                        } catch (timeError) {
                            debugInfo += "  - 시간 정보 읽기 실패: " + timeError.toString() + "\n";
                        }
                        
                    } catch (clipInfoError) {
                        debugInfo += "  - 클립 정보 읽기 실패: " + clipInfoError.toString() + "\n";
                    }
                }
            } catch (clipError) {
                debugInfo += "클립 " + i + " 처리 실패: " + clipError.toString() + "\n";
            }
        }
        
        // 3. 사운드 파일 존재 확인
        debugInfo += "\n--- 사운드 파일 확인 ---\n";
        var soundFile = new File(soundFilePath);
        debugInfo += "파일 존재: " + (soundFile.exists ? "YES" : "NO") + "\n";
        debugInfo += "파일 크기: " + (soundFile.exists ? soundFile.length : "N/A") + " bytes\n";
        
        if (!soundFile.exists) {
            debugInfo += "ERROR: 사운드 파일을 찾을 수 없음\n";
            debugWriteln("사운드 파일을 찾을 수 없음: " + soundFilePath);
            return JSON.stringify({
                success: false,
                message: "사운드 파일을 찾을 수 없습니다.",
                debug: debugInfo
            });
        }
        
        // 4. 기존 프로젝트 아이템 검색
        debugInfo += "\n--- 프로젝트 아이템 검색 ---\n";
        debugInfo += "검색할 파일 경로: " + soundFilePath + "\n";
        var soundFile = new File(soundFilePath);
        var soundFileName = File.decode(soundFile.name);
        debugInfo += "검색할 파일명: " + soundFileName + "\n";
        debugInfo += "프로젝트 총 아이템 수: " + app.project.rootItem.children.numItems + "\n";
        
        var projectItem = findProjectItemByFilePath(soundFilePath);
        debugInfo += "기존 아이템 발견: " + (projectItem ? "YES" : "NO") + "\n";
        
        if (projectItem) {
            debugInfo += "발견된 아이템 이름: " + File.decode(projectItem.name) + "\n";
            debugInfo += "발견된 아이템 경로: " + (projectItem.getMediaPath ? projectItem.getMediaPath() : "경로 없음") + "\n";
        }
        
        if (!projectItem) {
            // 새로 임포트
            debugInfo += "새 파일 임포트 시도...\n";
            debugWriteln("새 파일 임포트 중: " + soundFilePath);
            var importedItems = app.project.importFiles([soundFilePath]);
            debugInfo += "임포트 결과: " + (importedItems ? "SUCCESS" : "FAILED") + "\n";
            debugInfo += "importedItems 타입: " + typeof importedItems + "\n";
            debugInfo += "importedItems toString: " + (importedItems ? importedItems.toString() : "null") + "\n";
            debugInfo += "임포트된 아이템 수: " + (importedItems && typeof importedItems.length !== 'undefined' ? importedItems.length : "length 속성 없음") + "\n";
            
            if (!importedItems || (typeof importedItems.length !== 'undefined' && importedItems.length === 0)) {
                debugInfo += "ERROR: 파일 임포트 실패\n";
                debugWriteln("파일 임포트 실패");
                return JSON.stringify({
                    success: false,
                    message: "파일 임포트에 실패했습니다.",
                    debug: debugInfo
                });
            }
            
            // importFiles()는 boolean을 반환하므로, 임포트 후 아이템을 다시 찾아야 함
            if (importedItems === true) {
                debugInfo += "임포트 성공, 프로젝트에서 아이템 검색 중...\n";
                
                // 임포트 후 잠시 대기 (프로젝트 업데이트 시간)
                for (var waitCount = 0; waitCount < 10; waitCount++) {
                    // 단순 대기 루프
                }
                
                // 다시 findProjectItemByFilePath로 검색
                projectItem = findProjectItemByFilePath(soundFilePath);
                
                if (!projectItem) {
                    // 파일명으로도 검색 시도
                    var fileName = soundFilePath.substring(soundFilePath.lastIndexOf('/') + 1);
                    fileName = fileName.substring(fileName.lastIndexOf('\\') + 1);
                    debugInfo += "파일명으로 검색 시도: " + fileName + "\n";
                    
                    for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
                        var item = app.project.rootItem.children[i];
                        if (item && item.name && item.name.indexOf(fileName) !== -1) {
                            projectItem = item;
                            debugInfo += "파일명으로 아이템 발견: " + item.name + "\n";
                            break;
                        }
                    }
                }
                
                if (projectItem) {
                    debugInfo += "새 아이템 이름: " + File.decode(projectItem.name) + "\n";
                } else {
                    debugInfo += "ERROR: 임포트 후에도 아이템을 찾을 수 없음\n";
                    return JSON.stringify({
                        success: false,
                        message: "임포트된 아이템을 프로젝트에서 찾을 수 없습니다.",
                        debug: debugInfo
                    });
                }
            } else {
                debugInfo += "ERROR: 임포트 실패 (boolean false)\n";
                return JSON.stringify({
                    success: false,
                    message: "파일 임포트에 실패했습니다.",
                    debug: debugInfo
                });
            }
        } else {
            debugInfo += "기존 아이템 이름: " + File.decode(projectItem.name) + "\n";
            debugWriteln("기존 프로젝트 아이템 사용");
        }
        
        // 5. 클립 교체 시도
        debugInfo += "\n--- 클립 교체 프로세스 ---\n";
        var replacedCount = 0;
        
        for (var i = 0; i < selection.length; i++) {
            var clip = selection[i];
            debugInfo += "\n클립 " + i + " 교체 시도:\n";
            
            if (!clip) {
                debugInfo += "  ERROR: 클립 객체가 null\n";
                continue;
            }
            
            if (!clip.projectItem) {
                debugInfo += "  ⚠️ projectItem이 null - 생성된 클립(타이틀/그래픽/컬러매트) 감지됨\n";
                debugInfo += "  클립 타입: 생성된 클립으로 추정\n";
                debugInfo += "  생성된 클립에 효과음 추가 모드로 전환합니다.\n";
                
                try {
                    // projectItem이 없는 클립(타이틀, 그래픽 등)에 대해서도 효과음 추가
                    var addResult = addAudioToGeneratedClip(clip, projectItem, soundFilePath);
                    if (addResult.success) {
                        debugInfo += "  SUCCESS: 생성된 클립에 효과음 추가 성공\n";
                        debugInfo += "  " + addResult.message + "\n";
                        replacedCount++; // 성공한 경우 카운트 증가
                    } else {
                        debugInfo += "  FAILED: 생성된 클립 효과음 추가 실패 - " + addResult.error + "\n";
                    }
                } catch (addError) {
                    debugInfo += "  ERROR: 생성된 클립 효과음 추가 중 오류 - " + addError.toString() + "\n";
                }
                continue; // 다음 클립으로 넘어감
            }
            
            debugInfo += "  기존 미디어: " + File.decode(clip.projectItem.name) + "\n";
            debugWriteln("클립 교체 시도: " + i + ", 기존 미디어: " + clip.projectItem.name);
            
            // 미디어 타입 호환성 체크
            var sourceMediaType = "알 수 없음";
            var targetMediaType = "오디오"; // 사운드 파일로 교체하려는 것이므로
            
            try {
                if (clip.projectItem.getMediaPath) {
                    var sourceMediaPath = clip.projectItem.getMediaPath();
                    var sourceExtension = sourceMediaPath.substring(sourceMediaPath.lastIndexOf('.')).toLowerCase();
                    
                    var audioExts = ['.wav', '.mp3', '.aif', '.aiff', '.m4a', '.flac'];
                    var videoExts = ['.mp4', '.mov', '.avi', '.mxf', '.prores'];
                    var imageExts = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.psd', '.gif', '.bmp', '.webp'];
                    var graphicExts = ['.ai', '.eps', '.svg', '.pdf'];
                    
                    var isSourceAudio = false;
                    for (var a = 0; a < audioExts.length; a++) {
                        if (sourceExtension === audioExts[a]) {
                            sourceMediaType = "오디오";
                            isSourceAudio = true;
                            break;
                        }
                    }
                    
                    if (!isSourceAudio) {
                        for (var v = 0; v < videoExts.length; v++) {
                            if (sourceExtension === videoExts[v]) {
                                sourceMediaType = "비디오";
                                break;
                            }
                        }
                        for (var im = 0; im < imageExts.length; im++) {
                            if (sourceExtension === imageExts[im]) {
                                sourceMediaType = "이미지";
                                break;
                            }
                        }
                        for (var gr = 0; gr < graphicExts.length; gr++) {
                            if (sourceExtension === graphicExts[gr]) {
                                sourceMediaType = "그래픽";
                                break;
                            }
                        }
                    }
                }
            } catch (typeCheckError) {
                debugInfo += "  미디어 타입 확인 오류: " + typeCheckError.toString() + "\n";
            }
            
            debugInfo += "  원본 미디어 타입: " + sourceMediaType + "\n";
            debugInfo += "  대상 미디어 타입: " + targetMediaType + "\n";
            
            // 오디오가 아닌 모든 클립에 효과음 추가 (비디오/이미지/그래픽/컬러매트/시퀀스/네스트 등)
            if (sourceMediaType !== "오디오") {
                var clipTypeDesc = sourceMediaType === "알 수 없음" ? "생성된 클립(컬러매트/시퀀스/네스트 등)" : sourceMediaType + " 클립";
                debugInfo += "  " + clipTypeDesc + " 감지됨. 오디오 트랙에 효과음 추가 모드로 전환합니다.\n";
                
                try {
                    var addResult = addAudioToA2Track(clip, projectItem, soundFilePath);
                    if (addResult.success) {
                        debugInfo += "  SUCCESS: A2 트랙에 오디오 추가 성공\n";
                        debugInfo += "  " + addResult.message + "\n";
                        replacedCount++; // 성공한 경우 카운트 증가
                    } else {
                        debugInfo += "  FAILED: A2 트랙 오디오 추가 실패 - " + addResult.error + "\n";
                    }
                } catch (addError) {
                    debugInfo += "  ERROR: A2 트랙 오디오 추가 중 오류 - " + addError.toString() + "\n";
                }
                continue; // 다음 클립으로 넘어감 (교체 로직 실행하지 않음)
            }
            
            // 여기까지 오면 오디오 클립이므로 교체 로직 실행
            debugInfo += "  오디오 클립 감지됨. 클립 교체 모드로 전환합니다.\n";
            
            try {
                // 단순히 기존 프로젝트 아이템으로 교체 (중복 임포트 방지)
                debugInfo += "  기존 프로젝트 아이템으로 클립 교체 시도\n";
                
                if (projectItem && clip.projectItem !== projectItem) {
                    // 다른 프로젝트 아이템으로 직접 할당
                    debugInfo += "  프로젝트 아이템 직접 할당: " + projectItem.name + "\n";
                    clip.projectItem = projectItem;
                    replacedCount++;
                    debugInfo += "  SUCCESS: 프로젝트 아이템으로 교체 성공\n";
                    debugInfo += "  참고: 같은 파일을 사용하는 다른 클립들도 함께 변경될 수 있습니다.\n";
                } else if (!projectItem) {
                    debugInfo += "  ERROR: 대상 프로젝트 아이템이 없습니다\n";
                } else {
                    debugInfo += "  SKIP: 이미 같은 프로젝트 아이템입니다\n";
                }
                
                debugWriteln("클립 교체 완료: " + i);
                
            } catch (e) {
                debugInfo += "  ERROR: 클립 교체 실패 - " + e.toString() + "\n";
                debugWriteln("클립 교체 실패: " + e.toString());
            }
        }
        
        debugInfo += "\n--- 최종 결과 ---\n";
        debugInfo += "총 교체된 클립 수: " + replacedCount + "\n";
        debugInfo += "전체 선택된 클립 수: " + selection.length + "\n";
        
        debugWriteln("총 " + replacedCount + "개 클립 교체 완료");
        
        var finalMessage = replacedCount + "개의 클립을 교체했습니다.";
        var hasTypeWarning = debugInfo.indexOf("미디어 타입 불일치 경고가 발생할 수 있습니다") !== -1;
        
        if (hasTypeWarning && replacedCount > 0) {
            finalMessage += " (미디어 타입 불일치로 인해 Premiere Pro에서 확인 대화상자가 표시될 수 있습니다.)";
        }
        
        return JSON.stringify({
            success: true,
            message: finalMessage,
            debug: debugInfo,
            data: {
                replacedCount: replacedCount,
                totalSelected: selection.length
            }
        });
        
    } catch (e) {
        debugInfo += "\n--- 전체 오류 ---\n";
        debugInfo += "오류: " + e.toString() + "\n";
        debugInfo += "스택: " + e.stack + "\n";
        
        debugWriteln("replaceSelectedAudioClips 오류: " + e.toString());
        return JSON.stringify({
            success: false,
            message: "클립 교체 중 오류가 발생했습니다: " + e.message,
            debug: debugInfo
        });
    }
}

/**
 * 가장 기본적인 테스트 함수
 */
function simpleTest() {
    return "HELLO_FROM_EXTENDSCRIPT";
}

/**
 * 비디오 클립에 대한 최적의 오디오 트랙 찾기
 * 빈 공간이 있는 트랙을 우선적으로 검색하고, 없으면 경고 반환
 */
function findBestTrackForAudio(videoClip, audioProjectItem, soundFilePath) {
    try {
        debugWriteln("=== 최적 오디오 트랙 검색 시작 ===");
        
        var seq = app.project.activeSequence;
        if (!seq) {
            return {
                success: false,
                error: "활성화된 시퀀스가 없습니다."
            };
        }
        
        var audioTracks = seq.audioTracks;
        var clipStartTime = videoClip.start.seconds;
        var clipDuration = videoClip.duration.seconds;
        
        debugWriteln("클립 시작 시간: " + clipStartTime + "s, 지속 시간: " + clipDuration + "s");
        debugWriteln("사용 가능한 오디오 트랙 수: " + audioTracks.numTracks);
        
        // 1단계: 빈 공간이 있는 트랙 찾기
        for (var trackIndex = 0; trackIndex < audioTracks.numTracks; trackIndex++) {
            try {
                var track = audioTracks[trackIndex];
                if (!track) {
                    debugWriteln("트랙 " + (trackIndex + 1) + ": null 또는 undefined");
                    continue;
                }
                
                var isLocked = track.isLocked();
                if (isLocked) {
                    debugWriteln("트랙 " + (trackIndex + 1) + ": 잠겨있음, 건너뜀");
                    continue;
                }
                
                // 해당 시간대에 빈 공간이 있는지 확인
                if (hasEmptySpace(track, clipStartTime, clipDuration)) {
                    debugWriteln("✅ 트랙 " + (trackIndex + 1) + ": 빈 공간 있음");
                    return {
                        success: true,
                        trackIndex: trackIndex,
                        reason: "빈 공간 있는 트랙"
                    };
                }
                
                debugWriteln("트랙 " + (trackIndex + 1) + ": 빈 공간 없음");
                
            } catch (trackError) {
                debugWriteln("트랙 " + (trackIndex + 1) + " 검사 오류: " + trackError.toString());
            }
        }
        
        // 2단계: 빈 공간이 있는 트랙이 없으면 경고 반환
        debugWriteln("❌ 모든 트랙에 빈 공간이 없습니다.");
        return {
            success: false,
            error: "빈 오디오 트랙을 찾을 수 없습니다. 모든 트랙이 사용 중이거나 잠겨있습니다. 빈 트랙을 만들거나 기존 트랙을 비워주세요."
        };
        
    } catch (e) {
        debugWriteln("최적 트랙 검색 중 오류: " + e.toString());
        return {
            success: false,
            error: "트랙 검색 중 오류가 발생했습니다: " + e.message
        };
    }
}

/**
 * 오디오 트랙의 특정 시간 범위에 빈 공간이 있는지 확인
 * @param {AudioTrack} audioTrack - 확인할 오디오 트랙
 * @param {number} startTime - 시작 시간 (초)
 * @param {number} duration - 지속 시간 (초)
 * @return {boolean} 빈 공간이 있으면 true, 겹치면 false
 */
function hasEmptySpace(audioTrack, startTime, duration) {
    try {
        var endTime = startTime + duration;
        
        debugWriteln("빈 공간 검사: " + startTime.toFixed(3) + "s ~ " + endTime.toFixed(3) + "s (지속: " + duration.toFixed(3) + "s)");
        
        if (!audioTrack || !audioTrack.clips) {
            debugWriteln("트랙 또는 클립 정보가 없음");
            return true; // 트랙이 없으면 빈 공간으로 간주
        }
        
        for (var clipIdx = 0; clipIdx < audioTrack.clips.numItems; clipIdx++) {
            var clip = audioTrack.clips[clipIdx];
            if (!clip) continue;
            
            var clipStart = clip.start.seconds;
            var clipEnd = clip.end.seconds;
            
            debugWriteln("  기존 클립 " + (clipIdx + 1) + ": " + clipStart.toFixed(3) + "s ~ " + clipEnd.toFixed(3) + "s");
            
            // 겹침 검사: 새로운 클립이 기존 클립과 겹치는지 확인
            // 부동소수점 허용 오차 (약 0.001초 = 1ms)
            var tolerance = 0.001;
            
            // 겹침 조건: (새로운 시작 < 기존 끝 - 허용오차) && (새로운 끝 > 기존 시작 + 허용오차)
            var hasOverlap = (startTime < (clipEnd - tolerance)) && (endTime > (clipStart + tolerance));
            
            if (hasOverlap) {
                debugWriteln("    ❌ 겹침 발생!");
                debugWriteln("    새로운: " + startTime.toFixed(3) + "s ~ " + endTime.toFixed(3) + "s");
                debugWriteln("    기존:   " + clipStart.toFixed(3) + "s ~ " + clipEnd.toFixed(3) + "s");
                debugWriteln("    허용오차: " + tolerance + "s 적용됨");
                return false; // 겹침 있음
            } else {
                // 딱 맞게 붙어있는 경우 디버그 정보 표시
                var gap1 = startTime - clipEnd; // 새로운 시작과 기존 끝의 간격
                var gap2 = clipStart - endTime; // 기존 시작과 새로운 끝의 간격
                if (Math.abs(gap1) < 0.01 || Math.abs(gap2) < 0.01) {
                    debugWriteln("    ✅ 딱 맞게 붙어있음 (간격1: " + gap1.toFixed(3) + "s, 간격2: " + gap2.toFixed(3) + "s)");
                }
            }
        }
        
        debugWriteln("  ✅ 빈 공간 확인됨");
        return true; // 겹침 없음
        
    } catch (e) {
        debugWriteln("빈 공간 검사 중 오류: " + e.toString());
        return false; // 오류 시 안전하게 false 반환
    }
}

/**
 * 생성된 클립(타이틀/그래픽/컬러매트)에 효과음 추가
 */
function addAudioToGeneratedClip(generatedClip, audioProjectItem, soundFilePath) {
    try {
        debugWriteln("생성된 클립 효과음 추가 시작: " + (generatedClip.name || "이름 없는 클립"));
        
        // 1. 최적의 트랙 찾기 (빈 공간 우선 검색)
        var trackSelection = findBestTrackForAudio(generatedClip, audioProjectItem, soundFilePath);
        
        if (!trackSelection.success) {
            return {
                success: false,
                error: trackSelection.error
            };
        }
        
        var targetTrackIndex = trackSelection.trackIndex;
        var selectionReason = trackSelection.reason;
        
        debugWriteln("선택된 트랙: A" + (targetTrackIndex + 1) + " (" + selectionReason + ")");
        
        // 2. 현재 시퀀스 및 선택된 트랙 확인
        var seq = app.project.activeSequence;
        var targetAudioTrack = seq.audioTracks[targetTrackIndex];
        var clipStartTime = generatedClip.start.seconds;
        var clipDuration = generatedClip.duration.seconds;
        
        // 3. 삽입 전 프로젝트 아이템 사전 트림 시도
        debugWriteln("=== 삽입 전 사전 트림 시도 ===");
        var preTrimSuccess = false;
        try {
            if (audioProjectItem.setInPoint && audioProjectItem.setOutPoint) {
                debugWriteln("프로젝트 아이템에 인/아웃 포인트 설정 시도");
                
                // 프로젝트 아이템 레벨에서 인/아웃 포인트 설정
                audioProjectItem.setInPoint(0, 4); // 0초부터 시작
                audioProjectItem.setOutPoint(clipDuration, 4); // 클립 길이만큼
                
                debugWriteln("프로젝트 아이템 인/아웃 포인트 설정 완료: 0s ~ " + clipDuration.toFixed(2) + "s");
                preTrimSuccess = true;
            } else {
                debugWriteln("프로젝트 아이템에 setInPoint/setOutPoint 메서드 없음");
            }
        } catch (preTrimError) {
            debugWriteln("사전 트림 실패: " + preTrimError.toString());
        }
        
        // 4. 오디오 클립을 트랙에 추가
        try {
            // insertClip 메서드 사용
            if (targetAudioTrack.insertClip) {
                var insertTime = clipStartTime;
                debugWriteln("A" + (targetTrackIndex + 1) + " 트랙에 오디오 삽입 시도 - 시간: " + insertTime + "s");
                debugWriteln("사전 트림 적용됨: " + (preTrimSuccess ? "YES" : "NO"));
                
                var insertResult = targetAudioTrack.insertClip(audioProjectItem, insertTime);
                if (insertResult) {
                    debugWriteln("오디오 클립 삽입 성공");
                    
                    // 삽입된 클립 검증
                    var insertedClip = null;
                    for (var clipIdx = targetAudioTrack.clips.numItems - 1; clipIdx >= 0; clipIdx--) {
                        var clip = targetAudioTrack.clips[clipIdx];
                        if (clip && Math.abs(clip.start.seconds - insertTime) < 0.01) {
                            insertedClip = clip;
                            debugWriteln("삽입된 클립 발견: 인덱스 " + clipIdx + ", 시작: " + clip.start.seconds + "s");
                            break;
                        }
                    }
                    
                    if (insertedClip) {
                        var actualDuration = insertedClip.duration.seconds;
                        debugWriteln("최종 삽입된 클립 길이: " + actualDuration.toFixed(2) + "s (목표: " + clipDuration.toFixed(2) + "s)");
                        
                        return {
                            success: true,
                            message: "A" + (targetTrackIndex + 1) + " 트랙에 효과음을 추가했습니다 (" + selectionReason + ", 시간: " + insertTime.toFixed(2) + "s, 길이: " + actualDuration.toFixed(2) + "s)"
                        };
                    } else {
                        debugWriteln("삽입된 클립을 찾을 수 없음");
                        return {
                            success: true,
                            message: "A" + (targetTrackIndex + 1) + " 트랙에 효과음을 추가했습니다 (" + selectionReason + ", 클립 검증 실패)"
                        };
                    }
                } else {
                    return {
                        success: false,
                        error: "insertClip 메서드가 false를 반환했습니다."
                    };
                }
            } else {
                return {
                    success: false,
                    error: "insertClip 메서드를 사용할 수 없습니다."
                };
            }
        } catch (insertError) {
            return {
                success: false,
                error: "클립 삽입 중 오류: " + insertError.toString()
            };
        }
        
    } catch (e) {
        return {
            success: false,
            error: "생성된 클립 효과음 추가 중 오류: " + e.toString()
        };
    }
}

/**
 * 비디오/이미지/그래픽 클립에 대해 최적 오디오 트랙에 효과음 추가
 */
function addAudioToA2Track(videoClip, audioProjectItem, soundFilePath) {
    try {
        debugWriteln("오디오 트랙 효과음 추가 시작: " + File.decode(videoClip.projectItem.name));
        
        // 1. 최적의 트랙 찾기 (빈 공간 우선 검색) - 모든 클립에 적용
        var trackSelection = findBestTrackForAudio(videoClip, audioProjectItem, soundFilePath);
        
        if (!trackSelection.success) {
            return {
                success: false,
                error: trackSelection.error
            };
        }
        
        var targetTrackIndex = trackSelection.trackIndex;
        var selectionReason = trackSelection.reason;
        
        debugWriteln("선택된 트랙: A" + (targetTrackIndex + 1) + " (" + selectionReason + ")");
        
        // 2. 현재 시퀀스 및 선택된 트랙 확인
        var seq = app.project.activeSequence;
        var targetAudioTrack = seq.audioTracks[targetTrackIndex];
        var videoClipStartTime = videoClip.start.seconds;
        var videoClipDuration = videoClip.duration.seconds;
        
        if (!targetAudioTrack) {
            return {
                success: false,
                error: "사용 가능한 오디오 트랙을 찾을 수 없습니다."
            };
        }
        
        // 3. 삽입 전 프로젝트 아이템 사전 트림 시도
        debugWriteln("=== 삽입 전 사전 트림 시도 ===");
        var preTrimSuccess = false;
        try {
            if (audioProjectItem.setInPoint && audioProjectItem.setOutPoint) {
                debugWriteln("프로젝트 아이템에 인/아웃 포인트 설정 시도");
                
                // 프로젝트 아이템 레벨에서 인/아웃 포인트 설정
                audioProjectItem.setInPoint(0, 4); // 0초부터 시작
                audioProjectItem.setOutPoint(videoClipDuration, 4); // 비디오 길이만큼
                
                debugWriteln("프로젝트 아이템 인/아웃 포인트 설정 완료: 0s ~ " + videoClipDuration.toFixed(2) + "s");
                preTrimSuccess = true;
            } else {
                debugWriteln("프로젝트 아이템에 setInPoint/setOutPoint 메서드 없음");
            }
        } catch (preTrimError) {
            debugWriteln("사전 트림 실패: " + preTrimError.toString());
        }
        
        // 4. 오디오 클립을 트랙에 추가
        try {
            // insertClip 메서드 사용
            if (targetAudioTrack.insertClip) {
                var insertTime = videoClipStartTime;
                debugWriteln("A" + (targetTrackIndex + 1) + " 트랙에 오디오 삽입 시도 - 시간: " + insertTime + "s");
                debugWriteln("사전 트림 적용됨: " + (preTrimSuccess ? "YES" : "NO"));
                
                var insertResult = targetAudioTrack.insertClip(audioProjectItem, insertTime);
                if (insertResult) {
                    debugWriteln("오디오 클립 삽입 성공");
                    
                    // 사전 트림이 성공했다면 이미 올바른 길이일 수 있음
                    if (preTrimSuccess) {
                        // 삽입된 클립 찾기
                        var insertedClipForCheck = null;
                        for (var checkIdx = targetAudioTrack.clips.numItems - 1; checkIdx >= 0; checkIdx--) {
                            var checkClip = targetAudioTrack.clips[checkIdx];
                            if (checkClip && Math.abs(checkClip.start.seconds - insertTime) < 0.01) {
                                insertedClipForCheck = checkClip;
                                break;
                            }
                        }
                        
                        if (insertedClipForCheck) {
                            var preTrimmedduration = insertedClipForCheck.duration.seconds;
                            debugWriteln("사전 트림된 클립 길이: " + preTrimmedduration.toFixed(2) + "s");
                            
                            if (Math.abs(preTrimmedduration - videoClipDuration) < 0.01) {
                                debugWriteln("사전 트림 성공! 추가 길이 조정 불필요");
                                return {
                                    success: true,
                                    message: "A" + (targetTrackIndex + 1) + " 트랙에 오디오 클립을 추가했습니다 (" + selectionReason + ", 사전 트림 적용, 시간: " + insertTime.toFixed(2) + "s, 길이: " + preTrimmedduration.toFixed(2) + "s)"
                                };
                            } else {
                                debugWriteln("사전 트림 부분적 성공, 추가 조정 필요");
                            }
                        }
                    }
                    
                    debugWriteln("길이 조정 시도 중...");
                    
                    // 삽입된 클립 검증 - 사전 트림이 성공했는지 확인
                    var insertedClip = null;
                    for (var clipIdx = targetAudioTrack.clips.numItems - 1; clipIdx >= 0; clipIdx--) {
                        var clip = targetAudioTrack.clips[clipIdx];
                        if (clip && Math.abs(clip.start.seconds - insertTime) < 0.01) {
                            insertedClip = clip;
                            debugWriteln("삽입된 클립 발견: 인덱스 " + clipIdx + ", 시작: " + clip.start.seconds + "s");
                            break;
                        }
                    }
                    
                    if (insertedClip) {
                        var actualDuration = insertedClip.duration.seconds;
                        debugWriteln("최종 삽입된 클립 길이: " + actualDuration.toFixed(2) + "s (목표: " + videoClipDuration.toFixed(2) + "s)");
                        
                        return {
                            success: true,
                            message: "A" + (targetTrackIndex + 1) + " 트랙에 오디오 클립을 추가했습니다 (" + selectionReason + ", 사전 트림 적용, 시간: " + insertTime.toFixed(2) + "s, 길이: " + actualDuration.toFixed(2) + "s)"
                        };
                    } else {
                        debugWriteln("삽입된 클립을 찾을 수 없음");
                        return {
                            success: true,
                            message: "A" + (targetTrackIndex + 1) + " 트랙에 오디오 클립을 추가했습니다 (" + selectionReason + ", 클립 검증 실패)"
                        };
                    }
                } else {
                    return {
                        success: false,
                        error: "insertClip 메서드가 false를 반환했습니다."
                    };
                }
            } else {
                return {
                    success: false,
                    error: "insertClip 메서드를 사용할 수 없습니다."
                };
            }
        } catch (insertError) {
            return {
                success: false,
                error: "클립 삽입 중 오류: " + insertError.toString()
            };
        }
        
    } catch (e) {
        return {
            success: false,
            error: "최적 트랙 오디오 추가 중 오류: " + e.toString()
        };
    }
}

/**
 * 중복 임포트 테스트 함수
 */
function testDuplicateImport(soundFilePath) {
    try {
        var result = "=== 중복 임포트 테스트 ===\n";
        result += "검색 파일: " + soundFilePath + "\n";
        
        var soundFile = new File(soundFilePath);
        var soundFileName = File.decode(soundFile.name);
        result += "파일명: " + soundFileName + "\n";
        result += "프로젝트 총 아이템: " + app.project.rootItem.children.numItems + "\n";
        
        // ProjectItemType 상수 값들 확인
        result += "\n--- ProjectItemType 상수 확인 ---\n";
        result += "ProjectItemType.FILE: " + ProjectItemType.FILE + "\n";
        result += "ProjectItemType.BIN: " + ProjectItemType.BIN + "\n";
        if (typeof ProjectItemType.CLIP !== 'undefined') {
            result += "ProjectItemType.CLIP: " + ProjectItemType.CLIP + "\n";
        }
        
        // 프로젝트의 모든 파일 아이템 나열
        result += "\n--- 프로젝트 파일 목록 ---\n";
        var fileCount = 0;
        for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
            try {
                var item = app.project.rootItem.children[i];
                result += "아이템 " + (i + 1) + ": ";
                
                if (!item) {
                    result += "NULL 아이템\n";
                    continue;
                }
                
                result += "존재함, 타입: " + (item.type || "알 수 없음");
                
                // 타입 1이 파일인지 확인하고 처리
                if (item.type === ProjectItemType.FILE || item.type === 1) {
                    result += " (파일)";
                    fileCount++;
                    try {
                        var itemName = item.name ? File.decode(item.name) : item.name;
                        result += ", 이름: " + itemName;
                        
                        if (item.getMediaPath) {
                            try {
                                result += ", 경로: " + item.getMediaPath();
                            } catch (pathError) {
                                result += ", 경로 오류: " + pathError.toString();
                            }
                        } else {
                            result += ", 경로 메서드 없음";
                        }
                        
                        // 파일명 매칭 테스트
                        if (itemName === soundFileName) {
                            result += " ★ 매칭!";
                        }
                    } catch (nameError) {
                        result += ", 이름 처리 오류: " + nameError.toString();
                    }
                } else if (item.type === ProjectItemType.BIN) {
                    result += " (폴더)";
                } else {
                    result += " (기타: " + item.type + ")";
                }
                result += "\n";
            } catch (itemError) {
                result += "아이템 " + (i + 1) + " 처리 오류: " + itemError.toString() + "\n";
            }
        }
        result += "총 파일 아이템: " + fileCount + "개\n";
        
        // findProjectItemByFilePath 테스트
        var existing = findProjectItemByFilePath(soundFilePath);
        result += "\nfindProjectItemByFilePath 결과: " + (existing ? "발견됨" : "없음") + "\n";
        if (existing) {
            result += "발견된 아이템: " + File.decode(existing.name) + "\n";
        }
        
        return result;
    } catch (e) {
        return "오류: " + e.toString();
    }
}

/**
 * 타임라인으로 포커스 이동
 */
function focusTimeline() {
    try {
        // Premiere Pro에서 타임라인으로 포커스 이동하는 방법
        debugWriteln("타임라인 포커스 이동 시도");
        
        // 방법 1: 키보드 단축키 시뮬레이션 (Shift+1은 Timeline 패널 활성화)
        try {
            if (app && app.getEnableHardwareAcceleration) {
                // Timeline 패널 활성화 시도
                var seq = app.project.activeSequence;
                if (seq) {
                    // 시퀀스가 있으면 타임라인이 포커스 가능 상태
                    debugWriteln("타임라인 포커스 설정 성공");
                    return "SUCCESS";
                }
            }
        } catch (e) {
            debugWriteln("타임라인 포커스 방법 1 실패: " + e.toString());
        }
        
        // 방법 2: 기본 성공 응답 (실제로 포커스가 이동되지 않아도 CEP 패널에서는 포커스가 해제됨)
        debugWriteln("타임라인 포커스 기본 처리 완료");
        return "SUCCESS";
        
    } catch (e) {
        debugWriteln("focusTimeline 오류: " + e.toString());
        return "ERROR: " + e.toString();
    }
}

/**
 * 현재 인디케이터(플레이헤드) 위치를 가져오는 함수
 */
function getCurrentIndicatorPosition() {
    try {
        if (!app || !app.project || !app.project.activeSequence) {
            debugWriteln("getCurrentIndicatorPosition: 활성 시퀀스가 없음");
            return null;
        }
        
        var sequence = app.project.activeSequence;
        var currentTime = sequence.getPlayerPosition();
        debugWriteln("getCurrentIndicatorPosition: 현재 위치 = " + currentTime.toString());
        return currentTime;
    } catch (e) {
        debugWriteln("getCurrentIndicatorPosition 오류: " + e.toString());
        return null;
    }
}

/**
 * JSON 없이 기본 정보만 반환
 */
function basicInfo() {
    try {
        var info = "";
        // ExtendScript 호환 시간 표시 (toISOString 대신 기본 toString 사용)
        var now = new Date();
        info += "TIME:" + now.toString() + ";";
        info += "APP:" + (typeof app !== 'undefined' ? "OK" : "NO") + ";";
        if (typeof app !== 'undefined' && app) {
            info += "PROJECT:" + (app.project ? "OK" : "NO") + ";";
            if (app.project && app.project.activeSequence) {
                info += "SEQUENCE:OK;";
                var sel = app.project.activeSequence.getSelection();
                info += "SELECTION:" + (sel ? sel.length : 0) + ";";
            } else {
                info += "SEQUENCE:NO;";
            }
        } else {
            info += "PROJECT:NO;";
        }
        return info;
    } catch (e) {
        return "ERROR:" + e.toString();
    }
}

/**
 * 간단한 테스트 함수 - 기본 환경 확인
 */
function testBasicEnvironment() {
    try {
        var result = {
            timestamp: new Date().toString(),
            app: typeof app !== 'undefined' && app ? "OK" : "MISSING",
            project: null,
            sequence: null,
            selection: null
        };
        
        if (app && app.project) {
            result.project = "OK";
            if (app.project.activeSequence) {
                result.sequence = "OK";
                try {
                    var sel = app.project.activeSequence.getSelection();
                    result.selection = sel ? sel.length + " items" : "0 items";
                } catch (e) {
                    result.selection = "ERROR: " + e.toString();
                }
            } else {
                result.sequence = "NO_ACTIVE_SEQUENCE";
            }
        } else {
            result.project = "NO_PROJECT";
        }
        
        return JSON.stringify(result);
    } catch (e) {
        return JSON.stringify({
            error: true,
            message: e.toString(),
            timestamp: new Date().toString()
        });
    }
}

/**
 * 온라인 상태 확인 (기존 함수 유지)
 */
function isAppOnline() {
    return app && app.project;
}

function getSelectedClipsForImageSync() {
    try {
        var result = {success: false, message: "", selectedItems: [], method: "selection"};
        var seq = app.project.activeSequence;
        if (!seq) {
            result.message = "활성 시퀀스가 없습니다";
            return JSCEditHelperJSON.stringify(result);
        }
        var selection = seq.getSelection();
        if (selection.length === 0) {
            result.message = "선택된 클립이 없습니다";
            return JSCEditHelperJSON.stringify(result);
        }
        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            result.selectedItems.push({
                index: i,
                name: item.name || ("항목 " + (i+1)),
                start: item.start ? item.start.seconds : 0,
                end: item.end ? item.end.seconds : 0,
                duration: (item.end && item.start) ? (item.end.seconds - item.start.seconds) : 0
            });
        }
        result.success = true;
        result.message = selection.length + "개의 클립이 선택되었습니다";
        return JSCEditHelperJSON.stringify(result);
    } catch (e) {
        return JSCEditHelperJSON.stringify({success: false, message: "오류: " + e.toString()});
    }
}

function base64ToBinary(base64) {
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // 공백 및 줄바꿈 제거
    base64 = base64.replace(/[\s\r\n]/g, '');

    var result = [];
    var i = 0;

    while (i < base64.length) {
        var enc1 = CHARS.indexOf(base64.charAt(i++));
        var enc2 = CHARS.indexOf(base64.charAt(i++));
        var enc3 = CHARS.indexOf(base64.charAt(i++));
        var enc4 = CHARS.indexOf(base64.charAt(i++));

        // 첫 번째 바이트 (항상 존재)
        var chr1 = (enc1 << 2) | (enc2 >> 4);
        result.push(String.fromCharCode(chr1));

        // 두 번째 바이트 (패딩이 아니면 존재)
        if (enc3 !== -1) {
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            result.push(String.fromCharCode(chr2));

            // 세 번째 바이트 (패딩이 아니면 존재)
            if (enc4 !== -1) {
                var chr3 = ((enc3 & 3) << 6) | enc4;
                result.push(String.fromCharCode(chr3));
            }
        }
    }

    return result.join("");
}

function saveBase64ImageToFile(base64Data, filePath) {
    try {
        debugWriteln("saveBase64ImageToFile: 시작");
        debugWriteln("Base64 길이: " + base64Data.length);
        debugWriteln("파일 경로: " + filePath);

        var binaryData = base64ToBinary(base64Data);
        debugWriteln("디코딩된 바이너리 길이: " + binaryData.length);

        if (binaryData.length === 0) {
            debugWriteln("ERROR: 바이너리 데이터가 비어있습니다");
            return null;
        }

        var file = new File(filePath);
        file.encoding = "BINARY";

        if (file.open("w")) {
            var written = file.write(binaryData);
            debugWriteln("파일 쓰기 완료: " + written + " bytes");
            file.close();

            // 파일이 실제로 생성되었는지 확인
            var checkFile = new File(filePath);
            if (checkFile.exists) {
                debugWriteln("파일 존재 확인: " + checkFile.length + " bytes");
                return filePath;
            } else {
                debugWriteln("ERROR: 파일이 생성되지 않음");
                return null;
            }
        } else {
            debugWriteln("ERROR: 파일 열기 실패");
            return null;
        }
    } catch (e) {
        debugWriteln("ERROR in saveBase64ImageToFile: " + e.toString());
        return null;
    }
}

function insertImageAtTime(imagePath, trackIndex, startTime, endTime) {
    var debugLog = "";
    try {
        debugLog += "=== insertImageAtTime 호출됨 ===\n";
        debugLog += "imagePath: " + imagePath + "\n";
        debugLog += "trackIndex: " + trackIndex + "\n";
        debugLog += "startTime: " + startTime + "\n";
        debugLog += "endTime: " + endTime + "\n";

        debugWriteln("=== insertImageAtTime 호출됨 ===");
        debugWriteln("imagePath: " + imagePath);

        var seq = app.project.activeSequence;
        if (!seq) {
            debugLog += "ERROR: 활성 시퀀스가 없습니다\n";
            debugWriteln("ERROR: 활성 시퀀스가 없습니다");
            return JSCEditHelperJSON.stringify({success: false, message: "활성 시퀀스가 없습니다", debug: debugLog});
        }
        debugLog += "활성 시퀀스: " + seq.name + "\n";

        var imageFile = new File(imagePath);
        debugLog += "File 객체 생성됨\n";
        debugLog += "imageFile.exists: " + imageFile.exists + "\n";

        if (!imageFile.exists) {
            debugLog += "ERROR: 이미지 파일을 찾을 수 없습니다\n";
            return JSCEditHelperJSON.stringify({success: false, message: "이미지 파일을 찾을 수 없습니다: " + imagePath, debug: debugLog});
        }
        debugLog += "이미지 파일 확인됨\n";

        debugLog += "프로젝트에 임포트 시작...\n";
        app.project.importFiles([imagePath], true, app.project.rootItem, false);
        debugLog += "임포트 완료\n";

        var fileName = imagePath.split("\\").pop().split("/").pop();
        debugLog += "파일명: " + fileName + "\n";

        var projectItem = findProjectItemByName(fileName);
        if (!projectItem) {
            debugLog += "ERROR: 프로젝트 아이템을 찾을 수 없음\n";
            return JSCEditHelperJSON.stringify({success: false, message: "이미지를 임포트할 수 없습니다", debug: debugLog});
        }
        debugLog += "프로젝트 아이템 발견: " + projectItem.name + "\n";

        var videoTracks = seq.videoTracks;
        debugLog += "비디오 트랙 수: " + videoTracks.numTracks + "\n";

        if (trackIndex >= videoTracks.numTracks) {
            debugLog += "ERROR: 잘못된 트랙 인덱스: " + trackIndex + "\n";
            return JSCEditHelperJSON.stringify({success: false, message: "잘못된 트랙 인덱스", debug: debugLog});
        }

        // ✨ 빈 트랙 찾기 (자동)
        var actualTrackIndex = trackIndex;
        debugLog += "빈 트랙 찾기 시작 (선호 트랙: V" + (trackIndex + 1) + ")...\n";

        // 1. 선호하는 트랙 확인
        var preferredTrack = videoTracks[trackIndex];
        var hasClip = false;
        for (var c = 0; c < preferredTrack.clips.numItems; c++) {
            var clip = preferredTrack.clips[c];
            var clipStart = clip.start.seconds;
            var clipEnd = clip.end.seconds;
            if (clipStart < endTime && clipEnd > startTime) {
                hasClip = true;
                debugLog += "  V" + (trackIndex + 1) + " 트랙에 클립 있음 (충돌)\n";
                break;
            }
        }

        // 2. 선호 트랙에 클립이 있으면 빈 트랙 찾기
        if (hasClip) {
            debugLog += "빈 트랙 검색 중...\n";
            var foundEmpty = false;
            for (var t = 0; t < videoTracks.numTracks; t++) {
                var track = videoTracks[t];
                var trackHasClip = false;
                for (var tc = 0; tc < track.clips.numItems; tc++) {
                    var tclip = track.clips[tc];
                    var tclipStart = tclip.start.seconds;
                    var tclipEnd = tclip.end.seconds;
                    if (tclipStart < endTime && tclipEnd > startTime) {
                        trackHasClip = true;
                        break;
                    }
                }
                if (!trackHasClip) {
                    actualTrackIndex = t;
                    foundEmpty = true;
                    debugLog += "빈 트랙 발견: V" + (t + 1) + "\n";
                    break;
                }
            }

            // 3. 모든 트랙이 차있으면 새 트랙 생성
            if (!foundEmpty) {
                debugLog += "모든 트랙이 차있음 - 새 트랙 생성\n";
                seq.addVideoTrack();
                actualTrackIndex = videoTracks.numTracks - 1;
                debugLog += "새 트랙 생성됨: V" + (actualTrackIndex + 1) + "\n";
            }
        }

        if (actualTrackIndex !== trackIndex) {
            debugLog += "트랙 변경: V" + (trackIndex + 1) + " → V" + (actualTrackIndex + 1) + "\n";
        }

        var targetTrack = videoTracks[actualTrackIndex];
        debugLog += "실제 삽입 트랙: V" + (actualTrackIndex + 1) + "\n";
        debugLog += "삽입 전 트랙의 클립 수: " + targetTrack.clips.numItems + "\n";

        var insertTime = new Time();
        insertTime.seconds = startTime;
        debugLog += "삽입 시간: " + startTime + "초\n";

        debugLog += "클립 삽입 시작 (overwriteClip 사용)...\n";
        targetTrack.overwriteClip(projectItem, insertTime);
        debugLog += "overwriteClip() 호출 완료\n";

        var clips = targetTrack.clips;
        debugLog += "삽입 후 트랙의 클립 수: " + clips.numItems + "\n";

        var clipFound = false;
        var adjustedClips = 0;
        debugLog += "길이 조정 루프 시작 (총 " + clips.numItems + "개 클립 검사)\n";
        for (var i = clips.numItems - 1; i >= 0; i--) {
            var clip = clips[i];
            debugLog += "  클립[" + i + "]: start=" + clip.start.seconds + "s, end=" + clip.end.seconds + "s, name=" + clip.name + "\n";
            if (Math.abs(clip.start.seconds - startTime) < 0.1) {
                debugLog += "  → 이 클립을 길이 조정합니다!\n";

                // Time 객체를 생성해서 설정 시도
                var newEndTime = new Time();
                newEndTime.seconds = endTime;

                // 방법 1: Time 객체로 직접 설정
                try {
                    clip.end = newEndTime;
                    debugLog += "  → 방법1(clip.end = Time) 시도됨\n";
                } catch (e) {
                    debugLog += "  → 방법1 실패: " + e.toString() + "\n";
                }

                // 방법 2: seconds 속성으로 설정 (기존 방식)
                try {
                    clip.end.seconds = endTime;
                    debugLog += "  → 방법2(clip.end.seconds) 시도됨\n";
                } catch (e) {
                    debugLog += "  → 방법2 실패: " + e.toString() + "\n";
                }

                // 확인: 실제로 변경되었는지 체크
                var actualEnd = clip.end.seconds;
                var duration = endTime - startTime;
                var actualDuration = actualEnd - clip.start.seconds;
                debugLog += "  → 목표 end: " + endTime + "s, 실제 end: " + actualEnd + "s\n";
                debugLog += "  → 목표 길이: " + duration + "초, 실제 길이: " + actualDuration + "초\n";

                if (Math.abs(actualEnd - endTime) < 0.01) {
                    debugLog += "  → ✓ 길이 조정 성공!\n";
                } else {
                    debugLog += "  → ✗ 길이 조정 실패 (API가 변경을 무시함)\n";
                }

                adjustedClips++;
                clipFound = true;
                break;
            }
        }

        if (!clipFound) {
            debugLog += "WARNING: 조정할 클립을 찾지 못함\n";
        }
        debugLog += "총 " + adjustedClips + "개 클립 길이 조정됨\n";

        debugLog += "=== insertImageAtTime 성공 ===\n";
        return JSCEditHelperJSON.stringify({success: true, message: "이미지 삽입 완료", debug: debugLog});
    } catch (e) {
        debugLog += "ERROR: 예외 발생: " + e.toString() + "\n";
        debugLog += "Line: " + e.line + "\n";
        debugWriteln("ERROR: insertImageAtTime 예외 발생: " + e.toString());
        return JSCEditHelperJSON.stringify({success: false, message: "오류: " + e.toString(), debug: debugLog});
    }
}

/**
 * 현재 열린 Premiere Pro 프로젝트의 경로 가져오기
 */
function getProjectPath() {
    try {
        if (!app.project) {
            return JSCEditHelperJSON.stringify({success: false, message: "프로젝트가 열려있지 않습니다"});
        }

        var projectPath = app.project.path;

        if (!projectPath) {
            return JSCEditHelperJSON.stringify({success: false, message: "프로젝트가 저장되지 않았습니다. 먼저 프로젝트를 저장하세요."});
        }

        debugWriteln("프로젝트 경로: " + projectPath);
        return JSCEditHelperJSON.stringify({success: true, path: projectPath});
    } catch (e) {
        debugWriteln("ERROR: getProjectPath 예외: " + e.toString());
        return JSCEditHelperJSON.stringify({success: false, message: "오류: " + e.toString()});
    }
}

debugWriteln("JSCEditHelper 단순화된 Host Script 로드 완료");