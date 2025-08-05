"use strict";
/**
 * Clip Time Calculation Engine
 * 클립 시간 계산, 정렬, 간격 분석을 담당하는 TypeScript 엔진
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ClipTimeCalculator = (function () {
    var TICKS_PER_SECOND = 254016000000; // Premiere Pro 내부 시간 단위
    /**
     * 선택된 클립들을 시간 순으로 정렬
     */
    function sortClipsByTime(clips) {
        if (!clips || !Array.isArray(clips)) {
            return [];
        }
        return __spreadArray([], clips, true).sort(function (a, b) {
            // 트랙 인덱스 우선, 그 다음 시작 시간
            if (a.trackIndex !== b.trackIndex) {
                return a.trackIndex - b.trackIndex;
            }
            return a.start.ticks - b.start.ticks;
        });
    }
    /**
     * 클립들 사이의 간격 분석
     */
    function analyzeClipGaps(clips) {
        var sortedClips = sortClipsByTime(clips);
        var gaps = [];
        if (sortedClips.length < 2) {
            window.JSCUtils.logDebug('클립이 2개 미만이므로 간격 분석 불가');
            return gaps;
        }
        for (var i = 0; i < sortedClips.length - 1; i++) {
            var currentClip = sortedClips[i];
            var nextClip = sortedClips[i + 1];
            // 같은 트랙의 연속 클립만 고려
            if (currentClip.trackIndex === nextClip.trackIndex) {
                var gapStart = currentClip.end;
                var gapEnd = nextClip.start;
                // 간격이 실제로 존재하는지 확인
                if (gapEnd.ticks > gapStart.ticks) {
                    var gapDuration = subtractTime(gapEnd, gapStart);
                    gaps.push({
                        startTime: gapStart,
                        endTime: gapEnd,
                        duration: gapDuration,
                        beforeClip: currentClip,
                        afterClip: nextClip,
                        gapIndex: gaps.length
                    });
                }
            }
        }
        window.JSCUtils.logDebug("\uBD84\uC11D\uB41C \uD074\uB9BD \uAC04\uACA9: ".concat(gaps.length, "\uAC1C"));
        return gaps;
    }
    /**
     * 효과음 삽입 계획 생성
     */
    function createInsertionPlan(clips, audioFiles, targetAudioTrack) {
        if (targetAudioTrack === void 0) { targetAudioTrack = 1; }
        var insertions = [];
        // 클립이 없거나 오디오 파일이 없으면 실패
        if (!clips || clips.length === 0) {
            window.JSCUtils.logWarn('선택된 클립이 없습니다');
            return {
                insertions: [],
                totalInsertions: 0,
                audioTrack: targetAudioTrack,
                estimatedDuration: createTimeCode(0)
            };
        }
        if (!audioFiles || audioFiles.length === 0) {
            window.JSCUtils.logWarn('사용할 오디오 파일이 없습니다');
            return {
                insertions: [],
                totalInsertions: 0,
                audioTrack: targetAudioTrack,
                estimatedDuration: createTimeCode(0)
            };
        }
        // 각 클립마다 효과음 1개씩 삽입 (클립 길이에 맞게 조정)
        var sortedClips = sortClipsByTime(clips);
        for (var i = 0; i < sortedClips.length; i++) {
            var clip = sortedClips[i];
            var randomAudioFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
            // 클립이 비디오 타입이면 A2 트랙에 삽입 (개별 효과음 버튼과 동일한 로직)
            var targetTrack = clip.trackType === 'video' ? 2 : targetAudioTrack;
            var insertion = {
                position: clip.start,
                audioFile: randomAudioFile,
                targetTrack: targetTrack,
                afterClip: clip,
                insertionType: 'overlay', // 클립과 동시에 재생되도록
                clipDuration: clip.duration // 클립 길이 정보 추가 (pre-trimming용)
            };
            insertions.push(insertion);
            window.JSCUtils.logInfo("\uD074\uB9BD ".concat(clip.name, "\uC5D0 \uD6A8\uACFC\uC74C \uC0BD\uC785 (\uAE38\uC774: ").concat(formatDuration(clip.duration), ")"));
        }
        // 예상 총 소요 시간 계산 (각 삽입당 평균 2초 가정)
        var estimatedTotalSeconds = insertions.length * 2;
        var estimatedDuration = createTimeCode(estimatedTotalSeconds);
        window.JSCUtils.logInfo("\uD6A8\uACFC\uC74C \uC0BD\uC785 \uACC4\uD68D: ".concat(insertions.length, "\uAC1C \uC704\uCE58 (\uD074\uB9BD: ").concat(clips.length, "\uAC1C)"));
        return {
            insertions: insertions,
            totalInsertions: insertions.length,
            audioTrack: targetAudioTrack,
            estimatedDuration: estimatedDuration
        };
    }
    /**
     * 클립 자동 정렬(마그넷) 계획 생성
     */
    function createMagnetPlan(clips) {
        var sortedClips = sortClipsByTime(clips);
        var movements = [];
        var totalGapsRemoved = 0;
        if (sortedClips.length < 2) {
            return {
                movements: [],
                totalMoved: 0,
                gapsRemoved: 0,
                estimatedTime: 0
            };
        }
        // 각 트랙별로 처리
        var trackGroups = groupClipsByTrack(sortedClips);
        var cumulativeTimeShift = createTimeCode(0);
        Object.keys(trackGroups).forEach(function (trackIndexStr) {
            var trackIndex = parseInt(trackIndexStr);
            var trackClips = trackGroups[trackIndex];
            var previousClipEnd = trackClips[0].end;
            for (var i = 1; i < trackClips.length; i++) {
                var currentClip = trackClips[i];
                var gapDuration = subtractTime(currentClip.start, previousClipEnd);
                // 간격이 있다면 클립을 앞으로 당기기
                if (gapDuration.ticks > 0) {
                    var newPosition = previousClipEnd;
                    var deltaTime = subtractTime(currentClip.start, newPosition);
                    movements.push({
                        clip: currentClip,
                        fromPosition: currentClip.start,
                        toPosition: newPosition,
                        deltaTime: deltaTime
                    });
                    totalGapsRemoved++;
                    cumulativeTimeShift = addTime(cumulativeTimeShift, gapDuration);
                }
                // 다음 반복을 위해 이전 클립 끝 위치 업데이트
                var adjustedEndTime = subtractTime(currentClip.end, movements.length > 0 ? movements[movements.length - 1].deltaTime : createTimeCode(0));
                previousClipEnd = adjustedEndTime;
            }
        });
        // 예상 소요 시간 (이동할 클립 수 * 50ms)
        var estimatedTimeMs = movements.length * 50;
        window.JSCUtils.logInfo("\uB9C8\uADF8\uB137 \uACC4\uD68D: ".concat(movements.length, "\uAC1C \uD074\uB9BD \uC774\uB3D9, ").concat(totalGapsRemoved, "\uAC1C \uAC04\uACA9 \uC81C\uAC70"));
        return {
            movements: movements,
            totalMoved: movements.length,
            gapsRemoved: totalGapsRemoved,
            estimatedTime: estimatedTimeMs
        };
    }
    /**
     * 클립들을 트랙별로 그룹화
     */
    function groupClipsByTrack(clips) {
        var groups = {};
        clips.forEach(function (clip) {
            if (!groups[clip.trackIndex]) {
                groups[clip.trackIndex] = [];
            }
            groups[clip.trackIndex].push(clip);
        });
        // 각 트랙 내에서 시간순 정렬
        Object.keys(groups).forEach(function (trackIndex) {
            groups[parseInt(trackIndex)].sort(function (a, b) { return a.start.ticks - b.start.ticks; });
        });
        return groups;
    }
    /**
     * 시간 코드 생성
     */
    function createTimeCode(seconds) {
        var ticks = Math.floor(seconds * TICKS_PER_SECOND);
        return {
            ticks: ticks,
            seconds: seconds,
            timecode: formatTimecode(seconds)
        };
    }
    /**
     * Ticks를 TimeCode로 변환
     */
    function ticksToTimeCode(ticks) {
        var seconds = ticks / TICKS_PER_SECOND;
        return {
            ticks: ticks,
            seconds: seconds,
            timecode: formatTimecode(seconds)
        };
    }
    /**
     * 시간 더하기
     */
    function addTime(time1, time2) {
        var totalTicks = time1.ticks + time2.ticks;
        return ticksToTimeCode(totalTicks);
    }
    /**
     * 시간 빼기
     */
    function subtractTime(time1, time2) {
        var resultTicks = Math.max(0, time1.ticks - time2.ticks);
        return ticksToTimeCode(resultTicks);
    }
    /**
     * 시간을 타임코드 문자열로 포맷
     */
    function formatTimecode(seconds) {
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = Math.floor(seconds % 60);
        var frames = Math.floor((seconds % 1) * 30); // 30fps 가정
        return "".concat(hours.toString().padStart(2, '0'), ":").concat(minutes.toString().padStart(2, '0'), ":").concat(secs.toString().padStart(2, '0'), ":").concat(frames.toString().padStart(2, '0'));
    }
    /**
     * 클립 정보 검증
     */
    function validateClipInfo(clip) {
        if (!clip || typeof clip !== 'object') {
            return null;
        }
        // 필수 필드 검증
        var requiredFields = ['id', 'name', 'start', 'end', 'trackIndex'];
        for (var _i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
            var field = requiredFields_1[_i];
            if (!(field in clip)) {
                window.JSCUtils.logWarn("\uD074\uB9BD \uC815\uBCF4\uC5D0 \uD544\uC218 \uD544\uB4DC \uB204\uB77D: ".concat(field));
                return null;
            }
        }
        // 시간 필드 검증
        if (!isValidTimeCode(clip.start) || !isValidTimeCode(clip.end)) {
            window.JSCUtils.logWarn('클립의 시간 정보가 유효하지 않음');
            return null;
        }
        return clip;
    }
    /**
     * TimeCode 유효성 검사
     */
    function isValidTimeCode(timeCode) {
        return timeCode &&
            typeof timeCode.ticks === 'number' &&
            typeof timeCode.seconds === 'number' &&
            timeCode.ticks >= 0;
    }
    /**
     * 시간 차이를 사람이 읽기 쉬운 형태로 변환
     */
    function formatDuration(timeCode) {
        var seconds = timeCode.seconds;
        if (seconds < 60) {
            return "".concat(seconds.toFixed(1), "\uCD08");
        }
        else if (seconds < 3600) {
            var minutes = Math.floor(seconds / 60);
            var remainingSeconds = Math.floor(seconds % 60);
            return "".concat(minutes, "\uBD84 ").concat(remainingSeconds, "\uCD08");
        }
        else {
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds % 3600) / 60);
            return "".concat(hours, "\uC2DC\uAC04 ").concat(minutes, "\uBD84");
        }
    }
    // 공개 API 반환
    return {
        sortClipsByTime: sortClipsByTime,
        analyzeClipGaps: analyzeClipGaps,
        createInsertionPlan: createInsertionPlan,
        createMagnetPlan: createMagnetPlan,
        createTimeCode: createTimeCode,
        ticksToTimeCode: ticksToTimeCode,
        addTime: addTime,
        subtractTime: subtractTime,
        validateClipInfo: validateClipInfo,
        formatDuration: formatDuration
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.ClipTimeCalculator = ClipTimeCalculator;
}
//# sourceMappingURL=clip-time-calculator.js.map