# Adobe Premiere Pro 사운드 인서터 확장 프로그램

## 개요

본 확장 프로그램은 Adobe Premiere Pro 사용자가 선택한 폴더의 음향 효과(사운드 파일)를 시퀀스에 보다 편리하게 삽입할 수 있도록 돕는 CEP(Common Extensibility Platform) 기반 패널입니다.

주요 목표는 반복적인 사운드 삽입 작업을 자동화하고, 사용자가 원하는 위치에 빠르고 쉽게 효과음을 추가할 수 있도록 하는 것입니다.

## 현재까지 구현된 주요 기능 및 개발 과정 요약

이 확장 프로그램은 다음과 같은 주요 기능들을 목표로 개발되었으며, 여러 단계의 디버깅과 기능 개선을 거쳤습니다:

1.  **기본 UI 구성**:
    *   효과음이 저장된 폴더를 선택할 수 있는 "폴더 찾아보기" 버튼.
    *   선택된 폴더 내의 음향 효과 파일 목록을 표시하고, 각 파일을 클릭하여 선택된 오디오 클립을 대체하는 기능 (개별 사운드 버튼).
    *   선택된 여러 클립 사이에 "Default" 접두사를 가진 음향 효과를 랜덤하게 삽입하는 기능 ("효과음 삽입" 버튼).
    *   상태 메시지 및 디버그 정보 표시 영역.

2.  **ExtendScript (`host.jsx`) 주요 로직**:
    *   **폴더 및 파일 처리**:
        *   지정된 폴더에서 오디오 파일 (`.mp3`, `.wav` 등)을 검색합니다.
        *   "Default" 접두사 필터링 기능을 구현하여, 랜덤 삽입 시 특정 파일들만 사용하도록 합니다.
        *   폴더 내 모든 오디오 파일 목록을 UI로 전송하여 개별 버튼을 생성합니다.
    *   **클립 간 랜덤 효과음 삽입 (`insertSoundsBetweenClips`)**:
        *   선택된 타임라인 클립들을 시간 순으로 정렬합니다.
        *   연결된 오디오 클립 문제를 피하기 위해, 비디오 클립이 선택된 경우 비디오 클립을 우선 기준으로 필터링합니다.
        *   두 번째 선택된 (주요) 클립부터 각 클립의 시작 지점에 "Default" 접두사를 가진 효과음을 랜덤으로 선택하여 삽입합니다.
        *   삽입된 효과음의 길이를 참조 클립(효과음이 삽입되는 지점의 기준 클립)의 길이에 맞게 조정합니다.
        *   효과음은 지정된 오디오 트랙(A2, A3 등, 또는 자동 선택)에 삽입됩니다.
        *   임포트된 사운드 파일에 대한 캐싱 기능을 구현하여 중복 임포트를 방지합니다.
    *   **선택된 오디오 클립 대체 (`replaceSelectedAudioClips`)**:
        *   사용자가 UI에서 특정 사운드 파일 버튼을 클릭하면 호출됩니다.
        *   타임라인에서 선택된 오디오 클립 (또는 비디오 클립에 연결된 오디오 클립)을 대상으로 합니다.
        *   원본 오디오 클립의 시작 시간, 길이, 트랙 정보를 저장합니다.
        *   (현재 개발 중/이슈 해결 중) 원본 오디오 클립을 효과적으로 제거하고, 그 자리에 사용자가 선택한 새 사운드 파일을 임포트(캐시 사용)하여 삽입한 후, 원본 길이에 맞게 조정합니다.

3.  **JavaScript (`main.js`) 주요 로직**:
    *   ExtendScript와 통신 (CSInterface 사용).
    *   UI 요소(버튼, 드롭다운, 상태 패널 등)의 이벤트 핸들링.
    *   ExtendScript로부터 받은 데이터를 파싱하고 UI에 동적으로 반영 (예: 폴더 경로 표시, 사운드 파일 목록으로 버튼 생성, 상태 메시지 업데이트).
    *   `JSON.stringify` 및 `JSON.parse`를 이용한 데이터 직렬화/역직렬화 (오류 핸들링 포함).

4.  **주요 문제 해결 과정**:
    *   `event.data`가 `[object Object]`로 넘어오는 문제 해결 (JSON 직렬화 강화).
    *   ExtendScript에서 `trim`, `indexOf` 등 일부 JavaScript 함수 미지원 문제 해결 (대체 로직 구현).
    *   `ImportOptions` 생성자 오류 해결 (`app.project.importFiles` 사용으로 변경).
    *   파일 임포트 후 `projectItem` 식별 및 캐싱 문제 해결.
    *   연결된 오디오 클립으로 인해 여러 효과음이 삽입되는 문제 해결 (비디오 클립 우선 필터링 로직 추가).
    *   삽입된 효과음 길이 조정 기능 구현.
    *   개별 사운드 버튼 클릭 시 특정 클립 대체 기능 구현 중, 원본 클립 제거 및 새 클립 정확한 위치/길이 삽입 관련 이슈 디버깅 진행 중. (현재 `insertClip` 또는 `overwriteClip`이 정상 작동하지 않는 현상 조사 중)

## 사용 방법 (기본)

1.  Premiere Pro에서 `Window > Extensions > Sound Inserter` (또는 지정된 이름)를 통해 패널을 엽니다.
2.  **폴더 찾아보기**: 효과음 파일이 있는 폴더를 선택합니다.
3.  **개별 효과음으로 대체**:
    *   타임라인에서 대체하고 싶은 오디오 클립(들)을 선택합니다.
    *   패널에 나타난 개별 효과음 버튼 중 하나를 클릭하면, 선택된 클립(들)이 해당 효과음으로 대체됩니다 (현재 이 기능의 클립 삽입 부분 디버깅 중).
4.  **클립 사이에 랜덤 효과음 삽입**:
    *   타임라인에서 2개 이상의 클립을 선택합니다.
    *   (필요시 삽입될 오디오 트랙을 드롭다운에서 선택 - 현재 UI에서는 제거됨, ExtendScript에서는 `auto` 또는 특정 트랙 지정 가능)
    *   "효과음 삽입" 버튼을 클릭하면, 선택된 두 번째 클립부터 각 클립의 시작 지점에 "Default" 접두사를 가진 효과음이 랜덤하게 삽입됩니다.

## 현재 상태 및 알려진 문제

*   개별 효과음 버튼을 통한 클립 대체 기능에서, 새 효과음이 타임라인에 정상적으로 삽입되지 않는 문제가 있습니다. 수동으로 해당 위치에 클립을 여러 번 드래그해야 삽입되는 현상이 있으며, 이로 인해 스크립트를 통한 자동 삽입(`insertClip`/`overwriteClip`)이 실패하고 있습니다. Premiere Pro 환경 또는 타임라인의 특정 조건과 관련된 문제로 추정되며 조사 중입니다.
*   UI 버튼이 간헐적으로 응답하지 않는 문제가 발생하여, ExtendScript 함수의 복잡도를 낮추는 방식으로 안정성을 확보하려 시도하고 있습니다. (현재 UI는 안정화된 상태)

## 향후 개선 방향 (제안)

*   클립 삽입 문제의 근본 원인 해결.
*   보다 상세한 사용자 피드백 및 오류 처리 메커니즘 개선.
*   설정 저장 기능 (예: 마지막으로 사용한 폴더 경로).
*   효과음 미리 듣기 기능.

---
이 README는 프로젝트의 현재 상태를 반영하며, 기능이 추가되거나 문제가 해결됨에 따라 업데이트될 예정입니다.

# 효과음 삽입 도구 (Sound Inserter)

Adobe Premiere Pro용 효과음 삽입 확장프로그램입니다.

## 설치 방법

### 1. 자동 설치 (권장)
1. **관리자 권한으로** `install.bat` 실행
   - 확장프로그램 폴더 복사
   - PlugPlugExternalObject 라이브러리 자동 다운로드
   - 레지스트리 설정 자동 적용

### 2. 수동 설치
1. 이 프로젝트 폴더 전체를 다음 경로에 복사:
   ```
   Windows: C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.adobe.SoundInserter
   macOS: /Library/Application Support/Adobe/CEP/extensions/com.adobe.SoundInserter
   ```

2. **PlugPlugExternalObject 라이브러리 설치** (중요!)
   - `download_plugplug.bat` 실행 (Windows)
   - 또는 수동으로 다음 파일들을 `lib` 폴더에 복사:
     - Windows: `PlugPlugExternalObject.dll`
     - macOS: `PlugPlugExternalObject.bundle`

3. 디버그 모드 활성화 (필수)

## PlugPlugExternalObject 라이브러리 문제 해결

### 문제 증상
- 다른 컴퓨터에서 확장프로그램이 작동하지 않음
- "PlugPlugExternalObject 라이브러리 로드 실패" 메시지
- CSXSEvent 관련 오류

### 해결 방법

#### 방법 1: 자동 다운로드 스크립트 사용
```batch
# Windows에서 실행
download_plugplug.bat
```

#### 방법 2: 수동 다운로드
1. 다음 URL에서 파일 다운로드:
   - Windows: https://github.com/Adobe-CEP/CEP-Resources/raw/master/CEP_8.x/ExtendScript/PlugPlugExternalObject.dll
   - macOS: https://github.com/Adobe-CEP/CEP-Resources/raw/master/CEP_8.x/ExtendScript/PlugPlugExternalObject.bundle

2. 다운로드한 파일을 확장프로그램의 `lib` 폴더에 복사

#### 방법 3: 시스템 라이브러리 확인
일부 Adobe 제품 설치 시 자동으로 설치되는 경우가 있습니다:
- Windows: `C:\Program Files\Common Files\Adobe\CEP\extensions\`
- macOS: `/Library/Application Support/Adobe/CEP/extensions/`

### 라이브러리 없이도 작동하는 기능
PlugPlugExternalObject가 없어도 다음 기능들은 정상 작동합니다:
- 효과음 파일 임포트 및 삽입
- 폴더 탐색 및 파일 목록 표시
- 클립 대체 기능
- 기본적인 타임라인 조작

단, 일부 이벤트 통신 기능이 제한될 수 있습니다.

## 디버그 모드 활성화

### Windows에서:
1. 레지스트리 편집기를 관리자 권한으로 실행
2. 다음 경로로 이동: `HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.9` (또는 CSXS.10, CSXS.11)
3. 새 DWORD 값 생성: `PlayerDebugMode`
4. 값을 `1`로 설정

### macOS에서:
터미널에서 다음 명령어 실행:
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
```

## 문제 해결

### 확장프로그램이 메뉴에 나타나지 않는 경우

1. **폴더 경로 확인**
   - 확장프로그램이 정확한 CEP 폴더에 있는지 확인
   - 폴더명이 `com.adobe.SoundInserter`인지 확인

2. **디버그 모드 확인**
   - 레지스트리(Windows) 또는 defaults(macOS) 설정 확인
   - Premiere Pro 재시작 필수

3. **Premiere Pro 버전 호환성**
   - 지원 버전: Premiere Pro 2019 (13.0) 이상
   - 매니페스트 파일에서 버전 범위 확인

### CSXSEvent 오류가 발생하는 경우

1. **PlugPlugExternalObject 라이브러리 확인**
   ```
   lib/PlugPlugExternalObject.dll (Windows)
   lib/PlugPlugExternalObject.bundle (macOS)
   ```

2. **라이브러리 권한 확인**
   - 파일이 차단되지 않았는지 확인
   - 보안 소프트웨어에서 제외 처리

3. **대체 통신 방법**
   - 라이브러리가 없어도 기본 기능은 작동
   - 일부 실시간 피드백 기능만 제한됨

### 성능 문제

1. **대용량 폴더 처리**
   - 효과음 폴더의 파일 수를 적절히 관리
   - "Default" 접두사 파일 사용 권장

2. **메모리 사용량**
   - 장시간 사용 시 Premiere Pro 재시작 권장

## 지원되는 오디오 형식
- WAV, MP3, AIF, AIFF, M4A

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다. 