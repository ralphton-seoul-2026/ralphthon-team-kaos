# Chaos Lab Pre-flight — Implementation Tasks

## Phase A: MVP (터미널 기반)

### A-1. Core 모듈
- [x] `src/core/types.ts` — Seed, ChecklistItem, CheckResult, Report, Verdict 타입 정의
- [x] `src/core/constants.ts` — 타임아웃, 상태 아이콘, 카테고리명 상수
- [x] `src/core/risk-score.ts` — Risk Score 계산 (Impact × Likelihood)
- [x] `src/core/master-checklist.ts` — 11개 카테고리, 100개 항목, darwin/linux 명령어

### A-2. Step 1 — Seed 생성
- [x] `src/step1-refine/local-seed-generator.ts` — Quick Mode 키워드 매칭
- [x] 서비스 감지 패턴 20개+ 등록
- [x] 로컬 의존성 감지 (Python, Node, Docker, MCP)
- [x] 소요시간 추정 (밤새 → 8~24시간)
- [x] seed.json 출력 스키마 준수
- [x] `src/step1-refine/socratic-questions.ts` — Deep Mode 질문 목록

### A-3. Step 2 — 체크리스트 생성
- [x] `src/step2-checklist/local-checklist-generator.ts` — Layer 1 + Layer 2 생성
- [x] Layer 1: 규칙 기반 카테고리 선별 (AUTH/NET/RT 필수)
- [x] Layer 2: Seed 맥락 기반 커스텀 항목 동적 생성 (CUSTOM-xx)
- [x] 병합 + 중복 제거 + relevant_to 필터링
- [x] Risk Score 동적 조정 (Seed 맥락 반영)
- [x] 바운드 적용 (10~50개), Risk Score 내림차순 정렬
- [x] `src/step2-checklist/risk-scorer.ts` — Seed 컨텍스트 기반 점수 조정

### A-4. Step 3 — Shell 검증
- [x] `src/step3-verify/executor.ts` — execa 래퍼 + 30초 타임아웃
- [x] 결과 해석 (키워드 기반 PASSED/FAILED/WARNING/SKIPPED 판정)
- [x] 오류 처리 (CommandNotFound→SKIPPED, Timeout→WARNING)
- [x] OS별 darwin/linux 명령어 분기
- [x] `src/step3-verify/orchestrator.ts` — 순차 실행 + ora 스피너 + 상태 아이콘

### A-5. Step 4 — Auto-fix
- [x] `src/step4-report/auto-fix.ts` — CRITICAL 동적 분석 + 수정 명령어 생성
- [x] auto-fixable / manual-only 분류
- [x] 안전 가드레일 (rm -rf, sudo, chmod 777 차단)
- [x] 재검증 로직 (HEALED 상태 전환)
- [x] 액셔너블 수동 조치 가이드 (구체적 명령어 포함)

### A-6. Step 5 — 리포트 + Verdict
- [x] `src/step4-report/verdict.ts` — READY / READY_WITH_CAUTION / NOT_READY
- [x] `src/step4-report/report-generator.ts` — JSON, Markdown, 터미널 포맷
- [x] 각 FAILED 항목에 Seed 컨텍스트 연결 (왜 필요한지 설명)
- [x] Action Plan에 구체적 해결 명령어 포함

## Phase B: 웹 대시보드

### B-1. 웹 리포트
- [x] `src/web/template.ts` — HTML 템플릿 (다크 테마, 인라인 CSS+JS)
- [x] `src/web/html-generator.ts` — report.html 생성 (데이터 인라인)
- [x] file:// 프로토콜 동작 (외부 의존성 없음)
- [x] Overview 영역: Hero, KPI 카드 5개, CTA 2개, System Panel
- [x] Checklist 영역: searchable table
- [x] Verify 영역: 상태 필터 + 카테고리별 collapsible 결과
- [x] Report 영역: Verdict + Action Plan
- [x] 브라우저 자동 오픈 (open/xdg-open)

## Phase C: 배포

### C-1. 플러그인 배포
- [x] `skill/SKILL.md` — 스킬 정의 (triggers, argument-hint)
- [x] `scripts/install.sh` — 원클릭 설치 스크립트
- [x] `prompts/` — LLM 프롬프트 3개 파일
- [x] `README.md` — 필수 10개 섹션 포함
- [x] `CLAUDE.md` — 프로젝트 에이전트 지침
- [x] `.gitignore` — node_modules, dist, .chaos-lab 제외

## E2E 시나리오 검증

### 시나리오 1: 크롤링 + Notion 저장
- [x] 서비스 3개 감지 (Google Sheets, Target Websites, Notion)
- [x] Docker/DB 항목 미포함
- [x] Action Plan에 구체적 해결 명령어 포함
- [x] 리포트 6종 생성 (seed.json, checklist.json, results.json, report.json, report.html, *.md)
- [x] npm run build 에러 0
