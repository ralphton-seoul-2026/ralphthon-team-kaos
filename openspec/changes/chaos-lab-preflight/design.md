# Chaos Lab Pre-flight — Design Decisions

## 기술 결정사항

### 언어 & 런타임
- **TypeScript (Node.js, ESM)**: 타입 안전성 + Claude Code 생태계 호환
- `"type": "module"` in package.json, `.js` 확장자 ESM imports

### 핵심 의존성
- **execa**: Shell 명령어 실행 (타임아웃, reject 옵션, cross-platform)
- **chalk**: 터미널 색상 출력
- **ora**: 스피너 UI

### 2-Layer 체크리스트 아키텍처
- **Layer 1 (베이스라인)**: 마스터 체크리스트 100개에서 규칙 기반 선별
- **Layer 2 (메인)**: Seed 맥락 분석 후 커스텀 항목 동적 생성
- Layer 2 우선 병합, 중복 제거, Risk Score 내림차순

### Risk Score
- `Impact(1-5) × Likelihood(1-5)` = 1~25
- Seed 맥락 반영 동적 조정 (외부 서비스 수, 장시간 작업 등)

### 검증 결과 5가지 상태
- PASSED, FAILED, WARNING, SKIPPED, HEALED

### OS별 명령어 분기
- `CommandVariants { darwin: string; linux: string }`
- `process.platform` 기반 자동 선택

### 웹 리포트
- 단일 HTML 파일, 인라인 CSS+JS+JSON
- `file://` 프로토콜 (서버 불필요)
- 다크 테마, 4 섹션 (Overview/Checklist/Verify/Report)

### Auto-fix 안전 가드레일
- `rm -rf`, `sudo`, `chmod 777` 자동 차단
- 사용자 승인 없이 실행하지 않음
