@echo off
chcp 65001 >nul
title Sound Inserter - 라이브러리 다운로드
echo ========================================
echo PlugPlugExternalObject 라이브러리 다운로드
echo ========================================
echo.

echo PlugPlugExternalObject 라이브러리를 다운로드합니다...
echo 이 라이브러리는 CEP 확장프로그램의 성능을 향상시킵니다.
echo (라이브러리 없이도 확장프로그램은 정상 작동합니다)
echo.

REM lib 폴더 생성
echo 1. lib 폴더 준비 중...
if not exist "lib" (
    mkdir "lib"
    echo   ✓ lib 폴더 생성됨
) else (
    echo   ✓ lib 폴더 이미 존재함
)
echo.

REM Windows용 DLL 다운로드
echo 2. Windows용 PlugPlugExternalObject.dll 다운로드 중...
echo   다운로드 URL: https://github.com/Adobe-CEP/CEP-Resources/...
echo   대상 파일: lib\PlugPlugExternalObject.dll
echo   다운로드 시작... (인터넷 연결이 필요합니다)
echo.

powershell -Command "& {
    try {
        Write-Host '   PowerShell 다운로드 모듈 초기화 중...'
        $ProgressPreference = 'SilentlyContinue'
        $url = 'https://github.com/Adobe-CEP/CEP-Resources/raw/master/CEP_9.x/ExtendScript/PlugPlugExternalObject.dll'
        $output = 'lib\PlugPlugExternalObject.dll'
        
        Write-Host '   웹 요청 시작...'
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        
        Write-Host '   다운로드 완료 확인 중...'
        if (Test-Path $output) {
            $fileSize = (Get-Item $output).Length
            Write-Host ('   ✓ Windows DLL 다운로드 성공 (크기: ' + $fileSize + ' bytes)')
            exit 0
        } else {
            Write-Host '   ✗ Windows DLL 파일이 생성되지 않음'
            exit 1
        }
    } catch {
        Write-Host ('   ✗ 다운로드 오류: ' + $_.Exception.Message)
        exit 1
    }
}"

set "WINDOWS_SUCCESS=false"
if %errorlevel% equ 0 (
    echo ✓ PlugPlugExternalObject.dll 다운로드 완료
    set "WINDOWS_SUCCESS=true"
) else (
    echo ✗ PlugPlugExternalObject.dll 다운로드 실패
    echo.
    echo 수동 다운로드 방법:
    echo 1. https://github.com/Adobe-CEP/CEP-Resources/tree/master/CEP_9.x/ExtendScript 방문
    echo 2. PlugPlugExternalObject.dll 파일을 다운로드
    echo 3. 이 폴더의 lib\ 폴더에 저장
    echo.
    echo 참고: 라이브러리 없이도 확장프로그램은 정상 작동합니다.
)
echo.

echo 3. macOS용 bundle 파일 다운로드 시도 중...
echo   (Windows에서는 필요없지만 크로스 플랫폼 호환성을 위해 시도)
echo   다운로드 URL: https://github.com/Adobe-CEP/CEP-Resources/...
echo   대상 파일: lib\PlugPlugExternalObject.bundle
echo.

powershell -Command "& {
    try {
        Write-Host '   macOS bundle 다운로드 시작...'
        $ProgressPreference = 'SilentlyContinue'
        $url = 'https://github.com/Adobe-CEP/CEP-Resources/raw/master/CEP_9.x/ExtendScript/PlugPlugExternalObject.bundle.zip'
        $output = 'lib\PlugPlugExternalObject.bundle.zip'
        
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        if (Test-Path $output) {
            Write-Host '   ✓ macOS bundle ZIP 다운로드 성공'
            Write-Host '   압축 해제 중...'
            try {
                Expand-Archive -Path $output -DestinationPath 'lib\' -Force
                Remove-Item $output
                Write-Host '   ✓ macOS bundle 압축 해제 완료'
                exit 0
            } catch {
                Write-Host ('   - 압축 해제 실패: ' + $_.Exception.Message)
                exit 0
            }
        } else {
            Write-Host '   - macOS bundle 다운로드 건너뜀 (선택사항)'
            exit 0
        }
    } catch {
        Write-Host ('   - macOS bundle 다운로드 건너뜀 (선택사항): ' + $_.Exception.Message)
        exit 0
    }
}"
echo ✓ macOS용 파일 처리 완료 (선택사항)
echo.

echo ========================================
echo PlugPlugExternalObject 다운로드 완료
echo ========================================
echo.
echo 다운로드 결과:
if exist "lib\PlugPlugExternalObject.dll" (
    for %%F in ("lib\PlugPlugExternalObject.dll") do (
        echo ✓ lib\PlugPlugExternalObject.dll (Windows) - 크기: %%~zF bytes
    )
) else (
    echo ✗ lib\PlugPlugExternalObject.dll (Windows) - 다운로드 실패
)

if exist "lib\PlugPlugExternalObject.bundle" (
    echo ✓ lib\PlugPlugExternalObject.bundle (macOS) - 크로스 플랫폼 지원
) else (
    echo - lib\PlugPlugExternalObject.bundle (macOS) - 선택사항 (없어도 됨)
)
echo.

if "%WINDOWS_SUCCESS%"=="true" (
    echo 🎉 라이브러리 다운로드가 성공적으로 완료되었습니다!
    echo 이제 install.bat을 실행하여 확장프로그램을 설치하세요.
) else (
    echo ⚠ Windows용 라이브러리 다운로드에 실패했습니다.
    echo 하지만 걱정하지 마세요 - 라이브러리 없이도 확장프로그램은 정상 작동합니다.
    echo install.bat을 실행하여 설치를 계속 진행하세요.
)
echo.

echo 창을 닫으려면 아무 키나 누르세요...
pause >nul
echo.
echo 5초 후 자동으로 창이 닫힙니다...
timeout /t 5 /nobreak >nul 2>&1 