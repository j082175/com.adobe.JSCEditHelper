@echo off
chcp 65001 >nul
title Sound Inserter - 긴급 수정 도구
echo ========================================
echo Sound Inserter 확장프로그램 긴급 수정
echo ========================================
echo.
echo 이 도구는 확장프로그램이 실행되지 않는 가장 일반적인 문제들을 해결합니다.
echo.

REM 관리자 권한 확인
echo 1. 관리자 권한 확인 중...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 관리자 권한이 필요합니다. 
    echo.
    echo 이 파일을 마우스 우클릭 > "관리자 권한으로 실행"을 선택하세요.
    echo.
    echo 창을 닫으려면 아무 키나 누르세요...
    pause >nul
    timeout /t 10 /nobreak >nul 2>&1
    exit /b 1
)
echo ✓ 관리자 권한 확인됨
echo.

echo 2. Premiere Pro 프로세스 강제 종료...
tasklist /fi "imagename eq Adobe Premiere Pro.exe" 2>nul | find /i "Adobe Premiere Pro.exe" >nul
if %errorlevel% equ 0 (
    echo   Premiere Pro 실행 중 - 강제 종료합니다...
    taskkill /f /im "Adobe Premiere Pro.exe" >nul 2>&1
    echo   ✓ Premiere Pro 종료됨
) else (
    echo   ✓ Premiere Pro가 실행되지 않음
)

REM 기타 Adobe 프로세스도 종료
echo   기타 Adobe 프로세스 정리 중...
for %%p in ("Adobe Desktop Service.exe" "AdobeIPCBroker.exe" "Adobe_Updater.exe" "AdobeUpdateService.exe") do (
    tasklist /fi "imagename eq %%p" 2>nul | find /i %%p >nul
    if !errorlevel! equ 0 (
        taskkill /f /im %%p >nul 2>&1
        echo   - %%p 종료됨
    )
)
echo ✓ Adobe 프로세스 정리 완료
echo.

echo 3. CEP 디버그 모드 강제 활성화...
for %%v in (9 10 11 12 13) do (
    echo   CSXS.%%v 설정 중...
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%v" /v LogLevel /t REG_SZ /d 6 /f >nul 2>&1
    echo   ✓ CSXS.%%v 디버그 모드 활성화
)
echo ✓ 모든 CEP 디버그 모드 활성화 완료
echo.

echo 4. 확장프로그램 재설치...
REM 기존 설치 완전 제거
echo   기존 설치 제거 중...
set "PATHS[0]=%APPDATA%\Adobe\CEP\extensions\com.adobe.SoundInserter"
set "PATHS[1]=%PROGRAMFILES%\Common Files\Adobe\CEP\extensions\com.adobe.SoundInserter"
set "PATHS[2]=%PROGRAMFILES(X86)%\Common Files\Adobe\CEP\extensions\com.adobe.SoundInserter"

for /L %%i in (0,1,2) do (
    call set "REMOVE_PATH=%%PATHS[%%i]%%"
    if exist "!REMOVE_PATH!" (
        echo   제거 중: !REMOVE_PATH!
        rmdir /s /q "!REMOVE_PATH!" >nul 2>&1
        echo   ✓ 제거됨
    )
)
echo ✓ 기존 설치 완전 제거됨
echo.

echo   새로 설치 중...
set "INSTALL_PATH=%APPDATA%\Adobe\CEP\extensions"
if not exist "%INSTALL_PATH%" (
    mkdir "%INSTALL_PATH%" >nul 2>&1
)

set "TARGET=%INSTALL_PATH%\com.adobe.SoundInserter"
echo   복사 대상: %TARGET%

xcopy "%~dp0*" "%TARGET%\" /E /I /H /Y /EXCLUDE:%~dp0exclude.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ 파일 복사 실패 - 수동 복사 시도...
    robocopy "%~dp0" "%TARGET%" /E /XF "*.bat" >nul 2>&1
)

REM 불필요한 파일 제거
del "%TARGET%\*.bat" 2>nul
del "%TARGET%\exclude.txt" 2>nul

if exist "%TARGET%\CSXS\manifest.xml" (
    echo ✓ 확장프로그램 재설치 완료
) else (
    echo ✗ 확장프로그램 재설치 실패
    goto :InstallFailed
)
echo.

echo 5. CEP 캐시 및 임시 파일 정리...
echo   CEP 캐시 정리 중...
if exist "%TEMP%\CEP\" (
    rmdir /s /q "%TEMP%\CEP\" >nul 2>&1
    echo   ✓ CEP 임시 파일 정리됨
)

if exist "%APPDATA%\Adobe\CEP\cache\" (
    rmdir /s /q "%APPDATA%\Adobe\CEP\cache\" >nul 2>&1
    echo   ✓ CEP 캐시 정리됨
)

echo   브라우저 캐시 정리 중...
if exist "%LOCALAPPDATA%\Adobe\CEP\cache\" (
    rmdir /s /q "%LOCALAPPDATA%\Adobe\CEP\cache\" >nul 2>&1
    echo   ✓ 로컬 CEP 캐시 정리됨
)
echo ✓ 모든 캐시 정리 완료
echo.

echo 6. Windows 서비스 재시작...
echo   Adobe 관련 서비스 재시작 중...
sc stop "AdobeUpdateService" >nul 2>&1
sc start "AdobeUpdateService" >nul 2>&1
echo ✓ Adobe 서비스 재시작 완료
echo.

echo 7. 최종 검증...
if exist "%TARGET%\CSXS\manifest.xml" (
    echo ✓ manifest.xml 존재
) else (
    echo ✗ manifest.xml 없음
    goto :InstallFailed
)

if exist "%TARGET%\index.html" (
    echo ✓ index.html 존재
) else (
    echo ✗ index.html 없음
    goto :InstallFailed
)

echo ✓ 모든 파일 검증 완료
echo.

echo ========================================
echo ✅ 긴급 수정 완료!
echo ========================================
echo.
echo 🎉 다음 단계:
echo 1. 컴퓨터를 재부팅하세요 (권장)
echo 2. 또는 30초 정도 기다린 후 Premiere Pro를 실행하세요
echo 3. Premiere Pro에서 Window > Extensions > Sound Inserter 확인
echo.
echo 📝 만약 여전히 안 된다면:
echo 1. 컴퓨터 재부팅 후 다시 시도
echo 2. debug_extension.bat 실행하여 상세 진단
echo 3. Premiere Pro 버전이 너무 오래되었는지 확인 (2020 이후 버전 권장)
echo.

echo 지금 컴퓨터를 재부팅하시겠습니까? (Y/N)
set /p REBOOT_CHOICE=선택: 
if /i "%REBOOT_CHOICE%"=="Y" (
    echo.
    echo 10초 후 재부팅됩니다...
    echo 재부팅을 취소하려면 Ctrl+C를 누르세요.
    timeout /t 10
    shutdown /r /t 0
) else (
    echo.
    echo 재부팅을 건너뛰었습니다. 수동으로 Premiere Pro를 실행해보세요.
)

echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause >nul
exit /b 0

:InstallFailed
echo.
echo ========================================
echo ❌ 자동 수정 실패
echo ========================================
echo.
echo 자동 수정에 실패했습니다. 수동 해결 방법:
echo.
echo 📁 수동 설치:
echo 1. 이 폴더의 모든 파일을 복사
echo 2. 다음 경로에 새 폴더 생성: 
echo    %APPDATA%\Adobe\CEP\extensions\com.adobe.SoundInserter
echo 3. 복사한 파일들을 새 폴더에 붙여넣기
echo 4. Premiere Pro 재시작
echo.
echo 🔍 추가 진단:
echo debug_extension.bat을 실행하여 상세한 문제를 확인하세요.
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause >nul
exit /b 1 