// 간단한 테스트 스크립트

// 1. 기본 환경 확인
$.writeln("=== 기본 테스트 시작 ===");
$.writeln("app: " + (typeof app));
$.writeln("$: " + (typeof $));

// 2. 전역 변수 테스트
try {
    $.writeln("DEBUG_MODE: " + DEBUG_MODE);
} catch (e) {
    $.writeln("DEBUG_MODE 오류: " + e.toString());
}

// 3. JSCEditHelperJSON 테스트
try {
    $.writeln("\n=== JSCEditHelperJSON 테스트 ===");
    var testObj = {name: "test", value: 123};
    var jsonStr = JSCEditHelperJSON.stringify(testObj);
    $.writeln("stringify 결과: " + jsonStr);

    var parsed = JSCEditHelperJSON.parse(jsonStr);
    $.writeln("parse 결과: " + parsed.name + ", " + parsed.value);
} catch (e) {
    $.writeln("JSCEditHelperJSON 오류: " + e.toString());
    $.writeln("오류 라인: " + e.line);
}

// 4. 함수 테스트
try {
    $.writeln("\n=== 함수 테스트 ===");
    $.writeln("executeSoundEngineCommand 존재: " + (typeof executeSoundEngineCommand));
    $.writeln("getAudioFilesCommand 존재: " + (typeof getAudioFilesCommand));
} catch (e) {
    $.writeln("함수 테스트 오류: " + e.toString());
}

// 5. getAudioFiles 테스트
try {
    $.writeln("\n=== getAudioFiles 테스트 ===");
    var testData = {
        folderPath: "E:\\PremierePro_Projects\\00_Resources\\03_Audio\\자주쓰는효과음모음"
    };

    var testCommand = {
        action: "getAudioFiles",
        data: testData
    };

    var commandJson = JSCEditHelperJSON.stringify(testCommand);
    $.writeln("명령 JSON: " + commandJson);

    var result = executeSoundEngineCommand(commandJson);
    $.writeln("실행 결과: " + result);
} catch (e) {
    $.writeln("getAudioFiles 테스트 오류: " + e.toString());
    $.writeln("오류 라인: " + e.line);
    $.writeln("오류 파일: " + e.fileName);
}

$.writeln("\n=== 테스트 완료 ===");