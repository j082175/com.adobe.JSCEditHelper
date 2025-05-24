# 텍스트 색상 변경 도구 CEP 확장 프로그램

Adobe Premiere Pro를 위한 텍스트 및 캡션 색상 변경 확장 프로그램입니다.

## 주요 기능

- 선택한 텍스트와 캡션의 색상을 쉽게 변경
- 8가지 기본 색상 지원 (빨강, 녹색, 파랑, 노랑, 시안, 마젠타, 흰색, 검정)
- 직관적인 UI 패널
- 다중 항목 동시 변경 지원

## 설치 방법

1. 모든 파일을 zip으로 압축하여 `.zxp` 파일 확장자로 변경합니다.
2. Adobe Extension Manager 또는 ZXP Installer를 사용하여 설치합니다.

### 수동 설치:

1. 모든 파일을 다음 경로의 폴더에 압축 해제합니다:

   - Windows: `C:\Users\[사용자명]\AppData\Roaming\Adobe\CEP\extensions\ColorChanger`
   - Mac: `~/Library/Application Support/Adobe/CEP/extensions/ColorChanger`

2. Adobe Premiere Pro를 실행하고 `창 > 확장 > 색상 변경 도구`에서 패널을 열 수 있습니다.

## 디버그 모드 활성화 (개발용)

### Windows:

1. 레지스트리 편집기(regedit)를 실행합니다.
2. `HKEY_CURRENT_USER\Software\Adobe\CSXS.10` 경로로 이동합니다. 
   (Adobe 버전에 따라 CSXS.8, CSXS.9 등이 될 수 있습니다)
3. `PlayerDebugMode` 라는 문자열 값을 생성하고 값을 `1`로 설정합니다.

### Mac:

1. 터미널을 열고 다음 명령어를 실행합니다:

```bash
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
```

## 패널 구조

- `manifest.xml`: 확장 프로그램 정의
- `index.html`: 메인 UI
- `css/styles.css`: UI 스타일
- `js/main.js`: 클라이언트 코드
- `jsx/host.jsx`: ExtendScript(JSX) 호스트 코드
- `lib/CSInterface.js`: Adobe CEP 인터페이스

## 개발 팁

- `index.html`을 Chrome에서 열어 UI를 미리 볼 수 있습니다.
- CEP의 개발 콘솔은 패널이 열린 상태에서 `Ctrl+Alt+Shift+D`(Windows) 또는 `Cmd+Opt+Shift+D`(Mac)로 열 수 있습니다.
- 코드를 수정한 후에는 Premiere Pro를 재시작해야 변경 사항이 적용됩니다.

## 호환성

- Adobe Premiere Pro CC 2020 이상
- CEP 9.0 이상

## 라이선스

이 확장 프로그램은 자유롭게 사용 및 수정이 가능합니다.

## 버전 정보

- 1.0.0: 첫 번째 릴리스 