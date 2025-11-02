// host.jsx 로드 디버깅

$.writeln("=== host.jsx 로드 테스트 ===");

try {
    $.writeln("1. host.jsx 파일 포함 시작...");

    // #include가 아닌 $.evalFile 사용 (오류 위치를 더 정확히 파악)
    var hostPath = File($.fileName).parent.fsName + "\\host.jsx";
    $.writeln("   경로: " + hostPath);

    $.evalFile(hostPath);

    $.writeln("2. host.jsx 로드 성공!");

    // 주요 함수들이 로드되었는지 확인
    $.writeln("3. 함수 확인:");
    $.writeln("   - JSCEditHelperJSON: " + (typeof JSCEditHelperJSON));
    $.writeln("   - executeSoundEngineCommand: " + (typeof executeSoundEngineCommand));
    $.writeln("   - getAudioFilesCommand: " + (typeof getAudioFilesCommand));

} catch (e) {
    $.writeln("❌ 오류 발생!");
    $.writeln("   메시지: " + e.toString());
    $.writeln("   라인: " + e.line);
    $.writeln("   파일: " + e.fileName);
    $.writeln("   소스: " + e.source);

    // 오류가 난 라인 번호 근처를 확인하기 위해
    if (e.line) {
        $.writeln("\n오류가 발생한 라인 번호: " + e.line);
        $.writeln("host.jsx 파일의 " + e.line + "번째 줄을 확인하세요.");
    }
}

$.writeln("\n=== 테스트 종료 ===");