@echo off
chcp 65001 >nul
title Sound Inserter - 설치 도구
echo ========================================
echo Sound Inserter 확장프로그램 설치
echo ========================================
echo.

REM 관리자 권한 확인
echo 관리자 권한 확인 중...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 관리자 권한이 필요합니다. 
    echo.
    echo 해결 방법:
    echo 1. 이 파일을 마우스 우클릭
    echo 2. "관리자 권한으로 실행" 선택
    echo 3. 다시 실행해주세요
    echo.
    echo 창을 닫으려면 아무 키나 누르세요...
    pause >nul
    timeout /t 10 /nobreak >nul 2>&1
    exit /b 1
)
echo ✓ 관리자 권한 확인됨
echo.

echo 1. Premiere Pro 종료 확인...
tasklist /fi "imagename eq Adobe Premiere Pro.exe" 2>nul | find /i "Adobe Premiere Pro.exe" >nul
if %errorlevel% equ 0 (
    echo ✗ Premiere Pro가 실행 중입니다. 
    echo.
    echo Premiere Pro를 완전히 종료한 후 다시 실행해주세요.
    echo.
    echo 창을 닫으려면 아무 키나 누르세요...
    pause >nul
    timeout /t 10 /nobreak >nul 2>&1
    exit /b 1
)
echo ✓ Premiere Pro 종료됨
echo.

echo 2. CEP 디버그 모드 활성화...
REM 다양한 CSXS 버전에 대해 디버그 모드 설정
for %%v in (9 10 11 12) do (
    echo   CSXS.%%v 디버그 모드 설정 중...
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    echo   ✓ CSXS.%%v 디버그 모드 활성화 완료
)
echo ✓ 모든 CEP 디버그 모드 활성화 완료
echo.

echo 3. PlugPlugExternalObject 라이브러리 다운로드...
if exist "download_plugplug.bat" (
    echo   라이브러리 다운로드 스크립트 실행 중...
    call "download_plugplug.bat"
    if %errorlevel% equ 0 (
        echo   ✓ PlugPlugExternalObject 라이브러리 다운로드 완료
    ) else (
        echo   ⚠ PlugPlugExternalObject 다운로드 실패 (확장프로그램은 라이브러리 없이도 작동)
    )
) else (
    echo   ⚠ download_plugplug.bat 파일이 없습니다. 라이브러리 다운로드 건너뜀
)
echo.

echo 4. 확장프로그램 설치...
echo   설치 가능한 경로를 찾는 중...

REM 가능한 CEP 확장프로그램 경로들
set "PATHS[0]=%APPDATA%\Adobe\CEP\extensions"
set "PATHS[1]=%PROGRAMFILES%\Common Files\Adobe\CEP\extensions"
set "PATHS[2]=%PROGRAMFILES(X86)%\Common Files\Adobe\CEP\extensions"
set "PATHS[3]=%USERPROFILE%\AppData\Roaming\Adobe\CEP\extensions"

set "INSTALLED=false"
for /L %%i in (0,1,3) do (
    call set "CURRENT_PATH=%%PATHS[%%i]%%"
    call :InstallToPath "!CURRENT_PATH!" && set "INSTALLED=true" && goto :InstallComplete
)

:InstallComplete
if "%INSTALLED%"=="true" (
    echo.
    echo ========================================
    echo ✓ 설치 완료!
    echo ========================================
    echo.
    echo 다음 단계:
    echo 1. Premiere Pro를 실행하세요
    echo 2. Window 메뉴 > Extensions > Sound Inserter 선택
    echo 3. 확장프로그램 패널이 나타나면 성공!
    echo.
    echo 만약 확장프로그램이 보이지 않는다면:
    echo - debug_extension.bat을 실행하여 문제를 진단하세요
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ 설치 실패
    echo ========================================
    echo.
    echo 모든 경로에서 설치에 실패했습니다.
    echo.
    echo 수동 설치 방법:
    echo 1. 이 폴더의 모든 파일을 복사
    echo 2. 다음 경로에 붙여넣기:
    echo    %APPDATA%\Adobe\CEP\extensions\com.adobe.SoundInserter
    echo.
    echo 또는 debug_extension.bat을 실행하여 문제를 진단하세요.
    echo.
)

echo 창을 닫으려면 아무 키나 누르세요...
pause >nul
echo.
echo 10초 후 자동으로 창이 닫힙니다...
timeout /t 10 /nobreak >nul 2>&1
exit /b 0

:InstallToPath
setlocal
set "TARGET_PATH=%~1"
if "%TARGET_PATH%"=="" goto :InstallPathFailed

echo   시도 중: %TARGET_PATH%

if not exist "%TARGET_PATH%" (
    echo   폴더 생성 중: %TARGET_PATH%
    mkdir "%TARGET_PATH%" 2>nul
    if not exist "%TARGET_PATH%" (
        echo   ✗ 폴더 생성 실패: %TARGET_PATH%
        goto :InstallPathFailed
    )
)

set "FULL_TARGET=%TARGET_PATH%\com.adobe.SoundInserter"
echo   복사 대상: %FULL_TARGET%

if exist "%FULL_TARGET%" (
    echo   기존 설치 제거 중...
    rmdir /s /q "%FULL_TARGET%" 2>nul
)

echo   파일 복사 중...
xcopy "%~dp0*" "%FULL_TARGET%\" /E /I /H /Y >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ 파일 복사 실패
    goto :InstallPathFailed
)

REM 설치 파일들은 복사하지 않음
del "%FULL_TARGET%\install.bat" 2>nul
del "%FULL_TARGET%\debug_extension.bat" 2>nul
del "%FULL_TARGET%\download_plugplug.bat" 2>nul

echo   ✓ 성공적으로 설치됨: %FULL_TARGET%
endlocal
exit /b 0

:InstallPathFailed
echo   ✗ 이 경로에는 설치할 수 없습니다
endlocal
exit /b 1 