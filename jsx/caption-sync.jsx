/**
 * Caption-Image Synchronization Module
 * 캡션-이미지 동기화 기능
 *
 * 이 파일은 host.jsx와 완전히 독립적으로 작동합니다.
 */

debugWriteln("=== Caption-Sync Module Loading ===");

/**
 * 선택된 클립들의 정보를 가져옴 (캡션-이미지 동기화용)
 */
function getSelectedClipsForImageSync() {
    try {
        debugWriteln("=== 선택된 클립 기반 이미지 동기화 ===");

        var result = {
            success: false,
            message: "",
            selectedItems: [],
            method: "selection"
        };

        var seq = app.project.activeSequence;
        if (!seq) {
            result.message = "활성 시퀀스가 없습니다";
            return JSCEditHelperJSON.stringify(result);
        }

        var selection = seq.getSelection();
        debugWriteln("선택된 항목 수: " + selection.length);

        if (selection.length === 0) {
            result.message = "선택된 클립이 없습니다.\n\n사용 방법:\n1. C1 트랙의 캡션들을 선택하세요\n2. 이미지 동기화를 실행하세요";
            return JSCEditHelperJSON.stringify(result);
        }

        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            var itemInfo = {
                index: i,
                name: item.name || ("항목 " + (i+1)),
                start: item.start ? item.start.seconds : 0,
                end: item.end ? item.end.seconds : 0,
                duration: 0,
                isCaption: false
            };

            if (item.end && item.start) {
                itemInfo.duration = item.end.seconds - item.start.seconds;
            }

            result.selectedItems.push(itemInfo);
        }

        result.success = true;
        result.message = selection.length + "개의 클립이 선택되었습니다";

        return JSCEditHelperJSON.stringify(result);
    } catch (e) {
        debugWriteln("선택 기반 동기화 오류: " + e.toString());
        return JSCEditHelperJSON.stringify({
            success: false,
            message: "오류 발생: " + e.toString()
        });
    }
}

/**
 * 시퀀스 마커들의 정보를 가져옴 (캡션-이미지 동기화용)
 */
function getMarkersForImageSync() {
    try {
        debugWriteln("=== 마커 기반 이미지 동기화 ===");

        var result = {
            success: false,
            message: "",
            markers: [],
            method: "markers"
        };

        var seq = app.project.activeSequence;
        if (!seq) {
            result.message = "활성 시퀀스가 없습니다";
            return JSCEditHelperJSON.stringify(result);
        }

        var markers = seq.markers;
        if (!markers || markers.numMarkers === 0) {
            result.message = "마커가 없습니다.\n\n사용 방법:\n1. 타임라인에서 M키를 눌러 마커 추가\n2. 이미지 동기화를 실행하세요";
            return JSCEditHelperJSON.stringify(result);
        }

        debugWriteln("마커 수: " + markers.numMarkers);

        for (var i = 0; i < markers.numMarkers; i++) {
            var marker = markers[i];
            var markerInfo = {
                index: i,
                name: marker.name || ("마커 " + (i+1)),
                comment: marker.comments || "",
                start: marker.start ? marker.start.seconds : 0,
                end: marker.end ? marker.end.seconds : (marker.start.seconds + 5),
                duration: marker.end ? (marker.end.seconds - marker.start.seconds) : 5,
                color: marker.type || 0
            };

            result.markers.push(markerInfo);
        }

        result.success = true;
        result.message = markers.numMarkers + "개의 마커를 찾았습니다";
        debugWriteln("마커 기반 동기화 준비 완료");

        return JSCEditHelperJSON.stringify(result);

    } catch (e) {
        debugWriteln("마커 기반 동기화 오류: " + e.toString());
        return JSCEditHelperJSON.stringify({
            success: false,
            message: "오류 발생: " + e.toString()
        });
    }
}

/**
 * Base64 문자열을 바이너리 데이터로 변환 (ExtendScript 호환)
 */
function base64ToBinary(base64) {
    try {
        var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var paddingChars = 0;

        if (base64.charAt(base64.length - 1) === '=') {
            paddingChars++;
            if (base64.charAt(base64.length - 2) === '=') {
                paddingChars++;
            }
        }
        base64 = base64.replace(/=/g, "");

        var result = [];

        for (var i = 0; i < base64.length; i += 4) {
            var enc1 = CHARS.indexOf(base64.charAt(i));
            var enc2 = CHARS.indexOf(base64.charAt(i + 1));
            var enc3 = CHARS.indexOf(base64.charAt(i + 2));
            var enc4 = CHARS.indexOf(base64.charAt(i + 3));

            if (enc3 === -1) enc3 = 0;
            if (enc4 === -1) enc4 = 0;

            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;

            result.push(String.fromCharCode(chr1));

            if (enc3 !== 0 || i + 2 < base64.length) {
                result.push(String.fromCharCode(chr2));
            }
            if (enc4 !== 0 || i + 3 < base64.length) {
                result.push(String.fromCharCode(chr3));
            }
        }

        if (paddingChars === 1) {
            result.pop();
        } else if (paddingChars === 2) {
            result.pop();
            result.pop();
        }

        return result.join("");

    } catch (e) {
        debugWriteln("Base64 변환 오류: " + e.toString());
        return "";
    }
}

/**
 * Base64 이미지 데이터를 파일로 저장
 */
function saveBase64ImageToFile(base64Data, filePath) {
    try {
        debugWriteln("이미지 저장 시작: " + filePath);
        debugWriteln("Base64 데이터 길이: " + base64Data.length);

        var lastSlash = Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/"));
        if (lastSlash > 0) {
            var folderPath = filePath.substring(0, lastSlash);
            var folder = new Folder(folderPath);
            if (!folder.exists) {
                var created = folder.create();
                debugWriteln("폴더 생성: " + folderPath + " (성공: " + created + ")");
            }
        }

        debugWriteln("Base64 → 바이너리 변환 시작...");
        var binaryData = base64ToBinary(base64Data);
        debugWriteln("바이너리 데이터 길이: " + binaryData.length);

        if (binaryData.length === 0) {
            debugWriteln("[ERROR] 바이너리 변환 실패");
            return null;
        }

        var file = new File(filePath);
        file.encoding = "BINARY";

        if (file.open("w")) {
            file.write(binaryData);
            file.close();

            debugWriteln("[SUCCESS] 이미지 저장 완료: " + filePath);
            debugWriteln("   파일 크기: " + binaryData.length + " bytes");

            var savedFile = new File(filePath);
            if (savedFile.exists) {
                debugWriteln("   파일 확인됨: " + savedFile.fsName);
                return filePath;
            } else {
                debugWriteln("[ERROR] 파일이 생성되지 않음");
                return null;
            }
        } else {
            debugWriteln("[ERROR] 파일 열기 실패: " + filePath);
            return null;
        }

    } catch (e) {
        debugWriteln("[ERROR] 이미지 저장 오류: " + e.toString());
        return null;
    }
}

/**
 * 이미지를 타임라인에 삽입
 */
function insertImageAtTime(imagePath, trackIndex, startTime, endTime) {
    try {
        debugWriteln("이미지 삽입: " + imagePath + " at " + startTime + "s ~ " + endTime + "s");

        var seq = app.project.activeSequence;
        if (!seq) {
            return JSCEditHelperJSON.stringify({
                success: false,
                message: "활성 시퀀스가 없습니다"
            });
        }

        var imageFile = new File(imagePath);
        if (!imageFile.exists) {
            debugWriteln("이미지 파일 없음: " + imagePath);
            return JSCEditHelperJSON.stringify({
                success: false,
                message: "이미지 파일을 찾을 수 없습니다: " + imagePath
            });
        }

        // fsName을 사용하여 정규화된 파일 경로 사용
        var normalizedPath = imageFile.fsName;
        debugWriteln("원본 경로: " + imagePath);
        debugWriteln("정규화된 경로 (fsName): " + normalizedPath);
        debugWriteln("프로젝트에 임포트 시작...");
        app.project.importFiles([normalizedPath], true, app.project.rootItem, false);

        var fileName = imagePath.split("\\").pop().split("/").pop();
        var projectItem = findProjectItemByName(fileName);

        if (!projectItem) {
            debugWriteln("프로젝트 아이템을 찾을 수 없음");
            return JSCEditHelperJSON.stringify({
                success: false,
                message: "이미지를 임포트할 수 없습니다"
            });
        }

        debugWriteln("프로젝트 아이템 발견: " + projectItem.name);

        var videoTracks = seq.videoTracks;
        if (trackIndex >= videoTracks.numTracks) {
            debugWriteln("잘못된 트랙 인덱스: " + trackIndex);
            return JSCEditHelperJSON.stringify({
                success: false,
                message: "잘못된 트랙 인덱스: " + trackIndex
            });
        }

        var targetTrack = videoTracks[trackIndex];
        debugWriteln("대상 트랙: V" + (trackIndex + 1));

        var insertTime = new Time();
        insertTime.seconds = startTime;

        debugWriteln("클립 삽입 시작...");
        targetTrack.insertClip(projectItem, insertTime);

        var clips = targetTrack.clips;
        var clipFound = false;

        for (var i = clips.numItems - 1; i >= 0; i--) {
            var clip = clips[i];
            if (Math.abs(clip.start.seconds - startTime) < 0.1) {
                debugWriteln("삽입된 클립 발견, 길이 조정...");

                var duration = endTime - startTime;
                clip.end.seconds = endTime;

                debugWriteln("클립 길이 조정 완료: " + duration + "초");
                clipFound = true;
                break;
            }
        }

        if (!clipFound) {
            debugWriteln("[WARNING] 클립을 찾지 못함 (삽입은 성공했을 수 있음)");
        }

        return JSCEditHelperJSON.stringify({
            success: true,
            message: "이미지 삽입 완료"
        });

    } catch (e) {
        debugWriteln("이미지 삽입 오류: " + e.toString());
        return JSCEditHelperJSON.stringify({
            success: false,
            message: "오류 발생: " + e.message
        });
    }
}

debugWriteln("[SUCCESS] Caption-Sync Module Loaded Successfully");
