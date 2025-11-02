/**
 * 캡션 트랙 간단 테스트
 * Premiere Pro 콘솔에서 직접 실행 가능
 */

function simpleCaptionTest() {
    var seq = app.project.activeSequence;
    if (!seq) {
        alert("시퀀스가 없습니다");
        return;
    }

    $.writeln("=== Premiere Pro 캡션 테스트 ===");
    $.writeln("시퀀스 이름: " + seq.name);
    $.writeln("Premiere Pro 버전: " + app.version);

    // 1. 직접 captionTracks 확인
    $.writeln("\n1. captionTracks 직접 확인:");
    $.writeln("  seq.captionTracks: " + seq.captionTracks);
    if (seq.captionTracks) {
        $.writeln("  타입: " + typeof seq.captionTracks);
        if (seq.captionTracks.numTracks !== undefined) {
            $.writeln("  트랙 수: " + seq.captionTracks.numTracks);
        }
    }

    // 2. 모든 속성 중 caption/text 관련 찾기
    $.writeln("\n2. Caption/Text 관련 속성:");
    for (var prop in seq) {
        var propLower = prop.toLowerCase();
        if (propLower.indexOf("caption") !== -1 ||
            propLower.indexOf("text") !== -1 ||
            propLower.indexOf("subtitle") !== -1) {
            $.writeln("  " + prop + " = " + typeof seq[prop]);
        }
    }

    // 3. 모든 트랙 컬렉션 찾기
    $.writeln("\n3. 모든 트랙 컬렉션:");
    for (var prop in seq) {
        if (prop.toLowerCase().indexOf("track") !== -1) {
            var obj = seq[prop];
            if (obj && typeof obj === 'object') {
                $.writeln("  " + prop + " (object)");
                if (obj.numTracks !== undefined) {
                    $.writeln("    numTracks = " + obj.numTracks);
                }
            }
        }
    }

    // 4. 비디오 트랙의 첫 번째 클립들 확인
    $.writeln("\n4. 비디오 트랙 클립 확인:");
    if (seq.videoTracks) {
        for (var i = 0; i < seq.videoTracks.numTracks && i < 3; i++) {
            var track = seq.videoTracks[i];
            $.writeln("  V" + (i+1) + " 트랙:");
            if (track.clips && track.clips.numItems > 0) {
                for (var j = 0; j < track.clips.numItems && j < 5; j++) {
                    var clip = track.clips[j];
                    $.writeln("    클립 " + j + ": " + clip.name);

                    // 클립이 캡션인지 확인
                    if (clip.projectItem) {
                        var item = clip.projectItem;
                        $.writeln("      프로젝트 타입: " + item.type);
                        if (item.isGraphicsClip !== undefined) {
                            $.writeln("      isGraphicsClip: " + item.isGraphicsClip);
                        }
                        if (item.mediaType) {
                            $.writeln("      mediaType: " + item.mediaType);
                        }
                    }
                }
            }
        }
    }

    alert("테스트 완료! 콘솔을 확인하세요.");
}

// 실행
simpleCaptionTest();