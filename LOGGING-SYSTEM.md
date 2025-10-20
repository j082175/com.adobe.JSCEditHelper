# 하이브리드 로깅 시스템

## 📊 로깅 레벨별 처리

### ERROR (빨간색)
- **콘솔**: ✅ 출력됨
- **UI 디버그 패널**: ✅ 자동으로 표시됨
- **형식**: `[HH:MM:SS] ERROR [ModuleName]: 메시지`
- **사용 예시**: `utils.logError("Failed to load SoundEngine")`

### WARN (노란색)
- **콘솔**: ✅ 출력됨
- **UI 디버그 패널**: ✅ 자동으로 표시됨
- **형식**: `[HH:MM:SS] WARN [ModuleName]: 메시지`
- **사용 예시**: `utils.logWarn("No clips selected")`

### INFO (파란색)
- **콘솔**: ✅ 출력됨
- **UI 디버그 패널**: ❌ 표시 안 됨
- **사용 예시**: `utils.logInfo("Processing completed")`

### DEBUG (회색)
- **콘솔**: ✅ 출력됨
- **UI 디버그 패널**: ❌ 표시 안 됨
- **사용 예시**: `utils.logDebug("Checking dependencies")`

---

## 🎯 사용 방법

### 개발자 (코드 작성 시)
```typescript
const utils = getUtils();

// 중요한 에러 - UI에 표시됨
utils.logError("Failed to initialize module");

// 경고 - UI에 표시됨
utils.logWarn("Folder path is empty");

// 일반 정보 - 콘솔만
utils.logInfo("Loading sound files");

// 디버그 정보 - 콘솔만
utils.logDebug("Dependencies loaded");
```

### 사용자 (UI에서)
1. **에러/경고 발생 시**: 자동으로 "📋 디버그 정보" 버튼이 활성화됨
2. **버튼 클릭**: 모든 ERROR/WARN 로그를 시간순으로 확인
3. **상세 로그 필요시**: 브라우저 개발자 도구 콘솔 확인 (F12)

---

## 💡 장점

### ✅ 사용자 친화적
- 문제 발생 시 즉시 UI에서 확인 가능
- 불필요한 디버그 정보로 UI가 복잡해지지 않음

### ✅ 개발자 친화적
- 모든 로그는 여전히 콘솔에서 확인 가능
- 중요한 문제는 UI에서도 추적 가능
- 기존 코드 수정 없이 자동으로 작동

### ✅ 성능
- UI는 ERROR/WARN만 업데이트 (오버헤드 최소)
- INFO/DEBUG는 콘솔에만 출력 (빠름)

---

## 📝 예시

### 에러 발생 시나리오
```typescript
// 코드에서 발생
utils.logError("SoundEngine not found");

// 사용자가 보는 것:
// 1. "📋 디버그 정보" 버튼 활성화
// 2. 버튼 클릭 → 디버그 패널 열림
// 3. 내용:
//    [14:32:15] ERROR [EventManager]: SoundEngine not found
```

### 경고 발생 시나리오
```typescript
// 코드에서 발생
utils.logWarn("No audio files found in folder");

// 사용자가 보는 것:
// 1. "📋 디버그 정보" 버튼 활성화
// 2. 버튼 클릭:
//    [14:32:20] WARN [AudioFileProcessor]: No audio files found in folder
```

---

## 🔧 기술 구현

### utils.ts
- `logError()`: 콘솔 + UI (lastDebugInfo에 추가)
- `logWarn()`: 콘솔 + UI (lastDebugInfo에 추가)
- `logInfo()`: 콘솔만
- `logDebug()`: 콘솔만

### di-helpers.ts
- Fallback 함수도 동일한 로직 적용
- 모듈 이름 포함하여 로그 출력

### 자동 기능
- ERROR/WARN 발생 시 자동으로 디버그 버튼 활성화
- 시간순으로 누적되어 히스토리 유지
- UI 업데이트 실패해도 콘솔 로그는 정상 출력

---

## 🎨 UI 표시 예시

```
=== 디버그 정보 ===

[14:30:12] ERROR [EventManager]: SoundEngine not found
[14:30:15] WARN [StateManager]: Folder path is empty
[14:31:05] ERROR [Communication]: ExtendScript timeout
[14:31:20] WARN [AudioFileProcessor]: No .wav files found

... (기존 디버그 정보도 함께 표시됨)
```

---

**생성일**: 2025-01-XX
**버전**: 1.0.0
**작성자**: Claude Code
