@echo off
chcp 65001 >nul
title Sound Inserter - 진단 도구
echo ========================================
echo Sound Inserter 확장프로그램 진단 도구
echo ========================================
echo.

echo 1. 현재 확장프로그램 설치 위치 확인:
echo %~dp0
echo.

echo 2. 필수 파일 존재 여부 확인:
if exist "CSXS\manifest.xml" (
    echo ✓ manifest.xml 존재
    echo   내용 확인 중...
    findstr /C:"<ExtensionBundleId>" "CSXS\manifest.xml" 2>nul
    findstr /C:"<ExtensionBundleName>" "CSXS\manifest.xml" 2>nul
    findstr /C:"<RequiredRuntimeList>" "CSXS\manifest.xml" 2>nul
) else (
    echo ✗ manifest.xml 없음
)

if exist "index.html" (
    echo ✓ index.html 존재
) else (
    echo ✗ index.html 없음
)

if exist "jsx\host.jsx" (
    echo ✓ host.jsx 존재
) else (
    echo ✗ host.jsx 없음
)

if exist "js\main.js" (
    echo ✓ main.js 존재
) else (
    echo ✗ main.js 없음
)
echo.

echo 3. Adobe 소프트웨어 설치 확인:
echo   Premiere Pro 설치 경로 검색 중...
set "PREMIERE_FOUND=false"
for %%d in (C D E F) do (
    if exist "%%d:\Program Files\Adobe\Adobe Premiere Pro*" (
        echo ✓ Premiere Pro 발견: %%d:\Program Files\Adobe\Adobe Premiere Pro*
        set "PREMIERE_FOUND=true"
    )
    if exist "%%d:\Program Files (x86)\Adobe\Adobe Premiere Pro*" (
        echo ✓ Premiere Pro 발견: %%d:\Program Files (x86)\Adobe\Adobe Premiere Pro*
        set "PREMIERE_FOUND=true"
    )
)
if "%PREMIERE_FOUND%"=="false" (
    echo ⚠ Premiere Pro 설치 경로를 찾을 수 없습니다
)
echo.

echo 4. CEP 확장프로그램 폴더 확인:
set "CEP_PATHS[0]=%APPDATA%\Adobe\CEP\extensions"
set "CEP_PATHS[1]=%PROGRAMFILES%\Common Files\Adobe\CEP\extensions"
set "CEP_PATHS[2]=%PROGRAMFILES(X86)%\Common Files\Adobe\CEP\extensions"
set "CEP_PATHS[3]=%USERPROFILE%\AppData\Roaming\Adobe\CEP\extensions"

echo   CEP 확장프로그램 설치 경로들:
for /L %%i in (0,1,3) do (
    call set "CURRENT_PATH=%%CEP_PATHS[%%i]%%"
    call :CheckCEPPath "!CURRENT_PATH!"
)
echo.

echo 5. 레지스트리 디버그 모드 설정 확인:
for %%v in (9 10 11 12) do (
    reg query "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%v" /v PlayerDebugMode 2>nul | find "0x1" >nul
    if !errorlevel! equ 0 (
        echo ✓ CSXS.%%v 디버그 모드 활성화됨
    ) else (
        echo ✗ CSXS.%%v 디버그 모드 비활성화
        echo   설정 중...
        reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
        echo ✓ CSXS.%%v 디버그 모드 설정 완료
    )
)
echo.

echo 6. Premiere Pro 프로세스 확인:
tasklist /fi "imagename eq Adobe Premiere Pro.exe" 2>nul | find /i "Adobe Premiere Pro.exe" >nul
if %errorlevel% equ 0 (
    echo ⚠ Premiere Pro가 실행 중입니다. 
    echo   확장프로그램 변경사항 적용을 위해 재시작이 필요할 수 있습니다.
    echo.
    echo   Premiere Pro 재시작 방법:
    echo   1. Premiere Pro 완전 종료
    echo   2. 3-5초 대기 
    echo   3. Premiere Pro 다시 실행
    echo   4. Window > Extensions > Sound Inserter 확인
) else (
    echo ✓ Premiere Pro가 실행되지 않음
)
echo.

echo 7. 로그 파일 위치 및 확인:
echo CEP 로그: %TEMP%\CEP\
if exist "%TEMP%\CEP\" (
    echo ✓ CEP 로그 폴더 존재
    dir "%TEMP%\CEP\*.log" /b /o-d 2>nul | findstr . >nul
    if %errorlevel% equ 0 (
        echo ✓ 최근 CEP 로그 파일들:
        for /f %%f in ('dir "%TEMP%\CEP\*.log" /b /o-d 2^>nul') do (
            echo   - %%f
            echo     최근 오류 검색 중...
            findstr /i /C:"error" /C:"failed" /C:"exception" "%TEMP%\CEP\%%f" 2>nul | head -n 3
        )
    ) else (
        echo - CEP 로그 파일 없음 (Premiere Pro를 한 번 실행해보세요)
    )
) else (
    echo - CEP 로그 폴더 없음
)
echo.

echo 8. 확장프로그램 ID 및 버전 호환성 확인:
if exist "CSXS\manifest.xml" (
    echo   manifest.xml에서 호환성 정보 추출 중...
    findstr /C:"<Host Name=" "CSXS\manifest.xml" 2>nul
    findstr /C:"Version=" "CSXS\manifest.xml" 2>nul
    findstr /C:"<RequiredRuntime Name=" "CSXS\manifest.xml" 2>nul
)
echo.

echo 9. 네트워크 보안 설정 확인:
echo   CEP는 로컬 웹 서버를 사용하므로 방화벽/보안 소프트웨어가 차단할 수 있습니다.
netsh advfirewall show allprofiles state 2>nul | findstr /C:"State" >nul
if %errorlevel% equ 0 (
    echo ✓ Windows 방화벽 상태:
    netsh advfirewall show allprofiles state 2>nul | findstr /C:"State"
) else (
    echo - 방화벽 상태 확인 불가
)
echo.

echo ========================================
echo 진단 완료
echo ========================================
echo.
echo 📋 문제 해결 체크리스트:
echo.
echo □ 1. Premiere Pro를 완전히 종료하고 재시작했나요?
echo □ 2. Window 메뉴 > Extensions에서 Sound Inserter가 보이나요?
echo □ 3. 만약 보이지 않는다면:
echo     - 다른 확장프로그램들은 보이나요?
echo     - Extensions 메뉴 자체가 없나요?
echo □ 4. 확장프로그램이 목록에는 있지만 클릭해도 안 열리나요?
echo □ 5. 오류 메시지가 나타나나요?
echo.
echo 🔧 즉시 시도할 수 있는 해결책:
echo 1. install.bat을 관리자 권한으로 다시 실행
echo 2. Premiere Pro 완전 재시작 (작업 관리자에서 모든 Adobe 프로세스 종료)
echo 3. 컴퓨터 재부팅 (레지스트리 변경사항 완전 적용)
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause >nul
echo.
echo 10초 후 자동으로 창이 닫힙니다...
timeout /t 10 /nobreak >nul 2>&1
exit /b 0

:CheckCEPPath
setlocal
set "CHECK_PATH=%~1"
if "%CHECK_PATH%"=="" goto :CheckPathEnd

echo   경로: %CHECK_PATH%
if exist "%CHECK_PATH%" (
    echo   ✓ 폴더 존재
    set "SOUND_INSERTER=%CHECK_PATH%\com.adobe.SoundInserter"
    if exist "!SOUND_INSERTER!" (
        echo   ✓ Sound Inserter 설치됨: !SOUND_INSERTER!
        if exist "!SOUND_INSERTER!\CSXS\manifest.xml" (
            echo     ✓ manifest.xml 존재
        ) else (
            echo     ✗ manifest.xml 없음
        )
        if exist "!SOUND_INSERTER!\index.html" (
            echo     ✓ index.html 존재
        ) else (
            echo     ✗ index.html 없음
        )
    ) else (
        echo   - Sound Inserter 미설치
    )
) else (
    echo   ✗ 폴더 없음
)

:CheckPathEnd
endlocal
exit /b 0 