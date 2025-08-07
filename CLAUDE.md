# JSCEditHelper - Claude 작업 가이드

## 🚨 중요한 작업 원칙

### TypeScript 프로젝트 작업 규칙
1. **항상 TypeScript 소스 파일(`src/`)에서 수정**
   - ❌ `js/*.js` 파일 직접 수정 금지
   - ✅ `src/*.ts` 파일만 수정
   
2. **작업 순서**
   ```
   문제 파악 → src/*.ts 수정 → npx tsc 컴파일 → 테스트
   ```

3. **컴파일 명령**
   ```bash
   cd "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.adobe.JSCEditHelper"
   npx tsc
   ```

## 📁 프로젝트 구조
- `src/` - TypeScript 소스 파일 (여기서 작업!)
- `js/` - 컴파일된 JavaScript (수정 금지!)
- `jsx/` - ExtendScript 파일
- `index.html` - UI 구조

## 🔧 주요 파일들
- `src/app.ts` - 메인 애플리케이션 초기화
- `src/event-manager.ts` - 이벤트 처리 및 사용자 인터랙션
- `src/ui-manager.ts` - UI 업데이트 및 상태 표시
- `src/state-manager.ts` - 애플리케이션 상태 관리
- `jsx/host.jsx` - Premiere Pro와의 통신

## ⚡ 자동 새로고침 기능 구현 완료
- 앱 시작 시 저장된 폴더의 효과음 자동 로드
- 폴더 선택 시 즉시 효과음 라이브러리 업데이트
- 수동 새로고침 버튼 클릭 불필요

## 🎯 작업 시 체크리스트
- [ ] TypeScript 파일(`src/`)에서 수정했는가?
- [ ] 컴파일(`npx tsc`) 했는가?
- [ ] JavaScript 파일을 직접 수정하지 않았는가?
- [ ] 테스트해봤는가?

---
*마지막 업데이트: 2024년 - 자동 새로고침 기능 추가*