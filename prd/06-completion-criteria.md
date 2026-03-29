# Chaos Lab — 완료 조건 (Completion Criteria)

> 이 문서는 원본 PRD에는 없는 **신규 문서**입니다.
> PRD 전체를 분석하여 구현 완료를 판단할 수 있는 검증 기준을 도출했습니다.
> 상세 체크리스트는 별도 파일(`docs/master-checklist-reference.md`)을 참조한다.

---

## Phase A (MVP) 완료 조건

> Phase A만 완료되면 터미널 기반 데모가 가능하다.
> **Phase A 완료 판정:** 아래 모든 항목 충족 + "시나리오 기반 검증" 시나리오 1 통과.

### A-1. Core 모듈

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| A-1-1 | `src/core/types.ts`에 Seed, ChecklistItem, CheckResult, Report, Verdict 타입이 정의됨 | 타입 임포트 후 컴파일 성공 |
| A-1-2 | `src/core/constants.ts`에 타임아웃(개별 30초, 그룹 3분, Step3 5분, 전체 10분), 상태 아이콘, 카테고리명이 정의됨 | 상수 값 참조 가능 |
| A-1-3 | `src/core/master-checklist.ts`에 11개 카테고리, 100개 항목이 정의됨 | 항목 수 카운트 === 100 |
| A-1-4 | 각 마스터 항목에 `CommandVariants { darwin, linux }` 양쪽 명령어가 존재 | darwin/linux 필드 모두 비어있지 않음 |
| A-1-5 | `src/core/risk-score.ts`에 Risk Score = Impact(1~5) x Likelihood(1~5) 계산 로직 존재 | 점수 범위 1~25 확인 |

### A-2. Step 1 — Seed 생성

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| A-2-1 | Quick Mode: 키워드 매칭으로 외부 서비스 20개+ 패턴 감지 | "google sheets notion 크롤링" 입력 시 3개 서비스 감지 |
| A-2-2 | Quick Mode: 로컬 의존성 감지 (Python, Node, Docker, MCP) | "python pandas" 입력 시 Python >= 3.10 감지 |
| A-2-3 | Quick Mode: 소요시간 추정 ("밤새" → 8~24시간) | 키워드별 예상 시간 매핑 확인 |
| A-2-4 | seed.json 출력이 PRD 3.4의 스키마와 일치 | task_summary, ambiguity_score, external_services, local_dependencies, estimated_duration, failure_impact, environment_assumptions 필드 존재 |
| A-2-5 | `.chaos-lab/run-{timestamp}/seed.json` 파일로 저장됨 (타임스탬프 디렉토리 격리) | 파일 존재 + JSON 파싱 성공 |
| A-2-6 | Deep Mode: Ouroboros 소크라테스 문답 2~3라운드 실행 | Ouroboros agent 호출 성공 + 문답 결과 반영 |
| A-2-7 | Deep Mode: `ambiguity_score ≤ 0.2` 달성 시 종료 | 종료 조건 판정 확인 |
| A-2-8 | Deep Mode: 최대 3라운드 후 best-effort Seed 생성 | 3라운드 초과 시 강제 종료 + Seed 출력 |

### A-3. Step 2 — 체크리스트 생성

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| A-3-1 | Layer 1: Seed 기반 규칙으로 관련 카테고리 자동 선별 | 외부 서비스 존재 시 AUTH, NET 활성화 확인 |
| A-3-2 | 항상 포함 카테고리: AUTH, NET, RT | 어떤 입력이든 해당 카테고리 항목 존재 |
| A-3-3 | Risk Score 동적 조정: Seed 맥락 반영 | 장시간 작업 시 HW likelihood +1 확인 |
| A-3-4 | 체크리스트 바운드: 최소 10개, 최대 50개 | 결과 항목 수 범위 확인 |
| A-3-5 | Risk Score 내림차순 정렬 | 첫 항목 >= 마지막 항목 |
| A-3-6 | `.chaos-lab/run-{timestamp}/checklist.json` 파일로 저장됨 | 파일 존재 + JSON 파싱 성공 |
| A-3-7 | Layer 2: Claude Code가 Seed 분석 후 커스텀 항목(CUSTOM-xx) 동적 생성 | 커스텀 항목에 item_id, description, verification_command, impact, likelihood 포함 |
| A-3-8 | Layer 1 + Layer 2 병합 시 중복 제거 (같은 검증 대상이면 커스텀 우선) | 중복 항목 없음 확인 |

### A-4. Step 3 — Shell 검증

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| A-4-1 | 각 항목의 Shell 명령어를 execa로 실행 | 실행 로그 확인 |
| A-4-2 | 개별 항목 타임아웃 30초 적용 | 30초 초과 시 WARNING 상태 |
| A-4-3 | 결과 상태 5가지 판정: PASSED, FAILED, WARNING, SKIPPED, HEALED | 6개 키워드 패턴별 판정 확인: `not found`/`not installed`→FAILED, `not running`/`not available`→FAILED, `expired`/`만료`→FAILED, `SKIPPED:`→SKIPPED, `denied`/`permission`→WARNING, exit code 0→PASSED |
| A-4-4 | 오류 처리: CommandNotFound→SKIPPED, PermissionError→SKIPPED, Timeout→WARNING | 에지 케이스 정상 처리 |
| A-4-5 | `process.platform` 기반 darwin/linux 명령어 분기 | macOS에서 darwin 명령어 실행 확인 |
| A-4-6 | 터미널 실시간 출력: ora 스피너 + 상태 아이콘 | 실행 중 진행 표시 확인 |
| A-4-7 | `.chaos-lab/run-{timestamp}/results.json` 파일로 저장됨 | 파일 존재 + JSON 파싱 성공 |

### A-5. Step 4 — Auto-fix

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| A-5-1 | CRITICAL 항목의 에러 출력을 분석하여 auto-fixable/manual-only 동적 분류 | 분류 결과 확인 |
| A-5-2 | 안전 가드레일: `rm -rf`, `sudo`, `chmod 777` 포함 명령어 자동 차단 | 위험 명령어 생성 시 manual-only로 격하 |
| A-5-3 | Auto-fix 실행 후 재검증 (verification command 재실행) | HEALED 상태 전환 확인 |
| A-5-4 | 재검증 실패 시 FAILED 유지 + "자동 수정 실패" 메모 | 실패 케이스 정상 처리 |
| A-5-5 | Auto-fix 실행 전 사용자 승인 대기 (승인 없이 실행하지 않음) | 사용자 미승인 시 실행 차단 확인 |
| A-5-6 | 커스텀 항목(CUSTOM-xx)도 Auto-fix 대상에 포함 | 커스텀 CRITICAL 항목의 동적 분석 + 수정 시도 |

### A-6. Step 5 — 리포트 + Verdict

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| A-6-1 | Verdict 판정: CRITICAL=0 & WARNING<=3 → READY | 조건별 판정 정확성 |
| A-6-2 | Verdict 판정: CRITICAL=0 & WARNING>3 → READY WITH CAUTION | 조건별 판정 정확성 |
| A-6-3 | Verdict 판정: CRITICAL>=1 → NOT READY | 조건별 판정 정확성 |
| A-6-4 | 터미널 포맷 출력: 상태별 카운트 + CRITICAL 항목 나열 + 수동 조치 안내 | 출력 포맷 확인 |
| A-6-5 | `.chaos-lab/run-{timestamp}/report.json` 파일로 저장됨 | 파일 존재 + JSON 파싱 성공 |
| A-6-6 | Markdown 리포트 생성 (`chaos-lab-report-{timestamp}.md` 형식) | `.chaos-lab/run-{timestamp}/chaos-lab-report-*.md` 파일 존재 + timestamp 포맷 확인 |

---

## Phase B (확장) 완료 조건

> Phase B 완료 시 웹 대시보드 데모가 가능하다.
> **Phase B 완료 판정:** 아래 모든 항목 충족 + 시나리오 1에서 report.html 정상 렌더링 확인.

### B-1. 웹 리포트 대시보드

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| B-1-1 | `.chaos-lab/run-{timestamp}/report.html` 생성 (단일 HTML, 인라인 CSS+JS+JSON) | 파일 존재 + 브라우저에서 정상 렌더링 |
| B-1-2 | `file://` 프로토콜로 동작 (서버 불필요, 오프라인 동작) | file:// 경로로 열기 성공 |
| B-1-3 | 외부 의존성 없음 (CDN, 외부 CSS/JS 없음) | HTML 내 외부 URL 참조 없음 |
| B-1-4 | REPORT, CHECKLIST, SEED 데이터가 HTML 내 인라인 | `<script>` 태그 내 JSON 데이터 존재 |
| B-1-5 | 웹 UI가 `Overview / Checklist / Verify / Report` 단일 페이지 구조로 렌더링됨 | 각 섹션 anchor 또는 scroll navigation 확인 |
| B-1-6 | Overview 영역에 Hero, KPI 카드 4개, CTA 2개, System Panel이 레퍼런스 UI 구조대로 렌더링됨 | 시각 구조 + 데이터 매핑 확인 |
| B-1-7 | Checklist 영역에 Total Checks / Categories / Highest Risk / Priority Window 카드와 searchable/filterable table이 렌더링됨 | UI 동작 확인 |
| B-1-8 | Verify 영역에 상태 카드 5개(Critical, Warning, Passed, Skipped, Healed)와 카테고리별 collapsible 결과가 렌더링됨 | 숫자 정확성 + 열기/닫기 확인 |
| B-1-9 | Report 영역에 Final Verdict와 manual action list가 렌더링되며, action item이 액셔너블 문장/명령어를 포함함 | 리스트 내용 확인 |
| B-1-10 | `Critical = failedCount`, `HEALED` 분리 집계, `verdict` 직접 렌더링 등 데이터 매핑 규칙이 정확히 반영됨 | report.json과 화면 값 대조 |
| B-1-11 | 첨부된 Chaos Lab 레퍼런스 UI와 동일한 정보 위계/레이아웃 방향을 갖는다 | 시각 비교 |
| B-1-12 | 검증 완료 후 브라우저 자동 오픈 (`open`/`xdg-open`) | 자동 오픈 동작 확인 |

---

## Phase C (배포) 완료 조건

> Phase C 완료 시 다른 사용자가 설치하여 사용할 수 있다.
> **Phase C 완료 판정:** 아래 모든 항목 충족 + 클린 환경에서 install.sh → 시나리오 1 전체 통과.

### C-1. 플러그인 배포

| ID | 완료 조건 | 검증 방법 |
|----|----------|----------|
| C-1-1 | `skill/SKILL.md` 존재 (name, description, triggers, argument-hint) | 파일 내용 확인 |
| C-1-2 | `scripts/install.sh` 실행 시 빌드 + Ouroboros 설치 + 스킬 등록 완료 | 클린 환경에서 install.sh 실행 성공 |
| C-1-3 | `/chaos-lab "작업 설명"` 으로 실행 가능 | Claude Code에서 스킬 호출 성공 |
| C-1-4 | README.md 필수 10개 섹션 포함 | 섹션 존재 확인 |
| C-1-5 | `npm run build` 성공 (TypeScript 컴파일 에러 없음) | exit code 0 |
| C-1-6 | `CLAUDE.md` 프로젝트 에이전트 지침 파일 존재 | 파일 존재 + 빌드/실행/구조 정보 포함 |
| C-1-7 | `prompts/` 디렉토리에 LLM 프롬프트 3개 파일 존재 | `seed-generation.md`, `checklist-generation.md`, `result-interpretation.md` 존재 |

---

## 시나리오 기반 검증 (Loop 종료 조건)

> 아래 시나리오가 기대 결과와 일치해야 Loop를 종료한다.

### 시나리오 1: 크롤링 + Notion 저장

**입력:**
```bash
node dist/cli/index.js "Google Sheets에 정리된 500개 스타트업 웹사이트를 밤새 크롤링해서 회사명, 산업군, 최근 투자 여부를 정리하고 Notion 데이터베이스에 저장해줘"
```

**기대 결과:**
1. Step 1: 서비스 3개 감지 (Google Sheets, Target Websites, Notion)
2. Step 1: estimated_duration 8~24시간 (밤새 키워드)
3. Step 2: Docker/DB 관련 항목 미포함 (사용하지 않으므로)
4. Step 2: Google/Notion 인증 관련 항목 포함 (AUTH-04, AUTH-08 또는 CUSTOM 대체)
5. Step 2: 장시간 작업 → HW, OS, COST, MON 카테고리 활성화
6. Step 3: 각 항목 검증 실행
7. Step 5: Action Plan에 구체적 해결 명령어 포함 ("수동 확인이 필요합니다" 금지)
8. Step 5: Verdict 값 유효 (READY / READY WITH CAUTION / NOT READY)
9. Step 5: 리포트에 Seed 컨텍스트 연결 (왜 이 검증이 필요한지 설명)
10. 출력 파일 6종 생성

**검증 방법 (로그 기반):**
- 로그에 "서비스 N개 감지" 출력 확인
- checklist.json에 DB-*, Docker 관련 항목 없음 확인
- report.json의 action_plan 항목에 구체적 명령어 포함 확인
- report.html 파일 크기 > 0 확인

**출력 파일 존재 확인 (타임스탬프 디렉토리 격리):**
```bash
ls -la .chaos-lab/run-*/
# 각 run-{timestamp}/ 디렉토리에: seed.json, checklist.json, results.json, report.json, report.html, chaos-lab-report-*.md
```

### 시나리오 2: 크롬 MCP + Notion + 이메일

**입력:** `"크롬MCP활용해서 뉴스 데이터 수집 후 노션페이지에 적재 + 최종적으로 이메일로 송신하는 자동화 시스템 구현하려고 해"`

**기대 결과:**
- 서비스 감지: Notion, Target Websites(크롤링), SendGrid/이메일
- MCP 관련 항목 포함 (CC 카테고리 또는 AUTH-10)
- Docker/DB 항목 미포함
- Action Plan에 Notion 토큰 설정, 이메일 SMTP 설정 가이드 포함

### 시나리오 3: 단순 Python 스크립트

**입력:** `"Python으로 CSV 파일 읽어서 데이터 정리하는 스크립트 만들어줘"`

**기대 결과:**
- 서비스 감지: 0개 (외부 서비스 없음)
- Python 관련 항목만 포함 (RT 카테고리)
- AUTH/NET/DB/CC 항목 최소화
- 체크리스트 10~20개 (소규모 작업)

### 시나리오 4: AWS 대규모 배포

**입력:** `"AWS Lambda에 배포해서 S3에서 데이터 읽고 PostgreSQL에 저장하는 서버리스 파이프라인 구축"`

**기대 결과:**
- 서비스 감지: AWS, PostgreSQL (2개 이상)
- DB 카테고리 활성화 (PostgreSQL)
- AUTH 카테고리에 AWS IAM 관련 항목 포함
- Docker 항목은 미포함 (서버리스)

### 시나리오 5: GitHub + Slack 연동

**입력:** `"GitHub 리포지토리의 PR이 머지되면 Slack 채널에 알림 보내는 봇 만들어줘"`

**기대 결과:**
- 서비스 감지: GitHub, Slack (2개)
- GIT 카테고리 활성화
- AUTH-03 (GitHub PAT), AUTH-09 (Slack Bot Token) 포함
- DB 항목 미포함

### 시나리오 6: 장시간 크롤링 (밤새)

**입력:** `"밤새 네이버 뉴스 크롤링해서 1000건 수집하고 MongoDB에 저장해줘"`

**기대 결과:**
- 서비스 감지: Target Websites, MongoDB (2개)
- HW 카테고리 활성화 (장시간 → 슬립 모드, 배터리)
- OS, COST, MON 카테고리 활성화 (밤새)
- DB 카테고리 활성화 (MongoDB)
- estimated_duration: 8~24시간

### 시나리오 7: Docker 기반 프로젝트

**입력:** `"Docker Compose로 Redis + Node.js 앱 + Nginx 프록시 구성해줘"`

**기대 결과:**
- 서비스 감지: Docker, Redis (2개)
- RT-11 (Docker Compose) 포함
- DB 카테고리 활성화 (Redis)
- HW 카테고리 활성화 (Docker → 리소스)

### 시나리오 8: OpenAI API 활용

**입력:** `"OpenAI GPT-4를 사용해서 고객 리뷰 500건을 감성 분석하고 결과를 CSV로 저장"`

**기대 결과:**
- 서비스 감지: OpenAI API (rate_limit_concern: true)
- AUTH-02 (OpenAI API Key) 포함
- NET-09 (Rate Limit) likelihood 높음
- COST 카테고리 활성화 (API 비용)

### 시나리오 9: Firebase + React 앱

**입력:** `"Firebase Authentication + Firestore 연동하는 React 대시보드 만들어줘"`

**기대 결과:**
- 서비스 감지: Firebase (1개)
- AUTH-04 (Google/Firebase 인증) 포함
- BT 카테고리 활성화 (빌드/테스트)
- RT에 Node.js + React 관련 포함

### 시나리오 10: 단순 Git 작업

**입력:** `"현재 프로젝트를 GitHub에 push하고 README 정리해줘"`

**기대 결과:**
- 서비스 감지: GitHub (1개)
- GIT 카테고리 활성화
- AUTH-03 (GitHub PAT) 포함
- DB/HW/COST 항목 미포함 (단순 작업)

### 시나리오 11: Supabase 풀스택

**입력:** `"Supabase로 인증 + 데이터베이스 + 스토리지 연동하는 Next.js 앱 배포"`

**기대 결과:**
- 서비스 감지: Supabase (1개)
- DB 카테고리 활성화
- BT 카테고리 활성화 (빌드/배포)
- RT에 Node.js 포함

### 시나리오 12: Airtable + 이메일

**입력:** `"Airtable에서 고객 목록 가져와서 각 고객에게 맞춤 이메일 발송"`

**기대 결과:**
- 서비스 감지: Airtable, SendGrid/이메일 (2개)
- AUTH에 Airtable API Key 포함
- COST 활성화 (이메일 발송 비용)

### 시나리오 13: Claude API 활용

**입력:** `"Anthropic Claude API로 논문 100편 요약해서 Notion에 정리"`

**기대 결과:**
- 서비스 감지: Anthropic API, Notion (2개)
- AUTH-01 (Anthropic API Key) 포함
- AUTH-08 (Notion 토큰) 포함
- COST 활성화 (API 비용)

### 시나리오 14: Selenium 웹 테스트

**입력:** `"Selenium으로 우리 웹사이트 E2E 테스트 자동화해줘"`

**기대 결과:**
- 서비스 감지: Target Websites (1개)
- Python + Selenium + ChromeDriver 의존성 감지
- BT 카테고리 활성화 (테스트)

### 시나리오 15: Stripe 결제 연동

**입력:** `"Stripe 결제 시스템을 Node.js 백엔드에 연동하고 webhook 설정"`

**기대 결과:**
- 서비스 감지: Stripe (1개)
- AUTH에 Stripe API Key 포함
- NET 카테고리 (webhook 엔드포인트)
- BT 활성화 (빌드/포트)

### 시나리오 16: 대량 데이터 마이그레이션

**입력:** `"MySQL에서 PostgreSQL로 테이블 50개 데이터 마이그레이션 3시간 안에 완료"`

**기대 결과:**
- 서비스 감지: MySQL, PostgreSQL (2개)
- DB 카테고리 전체 활성화 (연결, 마이그레이션, 백업)
- HW 카테고리 (장시간)
- estimated_duration: 3~6시간

### 시나리오 17: Discord 봇

**입력:** `"Discord 봇 만들어서 서버에 새 멤버가 들어오면 환영 메시지 보내줘"`

**기대 결과:**
- 서비스 감지: Discord (1개)
- AUTH에 Discord Bot Token 포함
- NET 활성화 (WebSocket)

### 시나리오 18: Jira + Linear 동기화

**입력:** `"Jira 티켓이 생성되면 Linear에도 자동으로 이슈 생성하는 동기화 시스템"`

**기대 결과:**
- 서비스 감지: Jira, Linear (2개)
- AUTH에 두 서비스 API 토큰 포함
- 외부 서비스 2개+ → AUTH likelihood boost

### 시나리오 19: Vercel 배포

**입력:** `"Next.js 프로젝트 Vercel에 배포하고 커스텀 도메인 연결"`

**기대 결과:**
- 서비스 감지: Vercel (1개)
- AUTH에 Vercel API Token 포함
- BT 활성화 (빌드)
- GIT 활성화 (배포 연동)

### 시나리오 20: MCP 서버 구축

**입력:** `"Claude Code용 커스텀 MCP 서버 만들어서 우리 내부 API 연결"`

**기대 결과:**
- CC 카테고리 활성화 (MCP)
- AUTH-10 (MCP 인증) 포함
- RT에 Node.js 18+ 포함
- NET 활성화 (API 연결)

### 시나리오 21: Playwright 크롤링

**입력:** `"Playwright로 JavaScript 렌더링되는 사이트 100페이지 크롤링"`

**기대 결과:**
- 서비스 감지: Target Websites (1개)
- Python + Playwright 의존성 감지
- estimated_duration: 30분~1시간

### 시나리오 22: Twilio SMS

**입력:** `"Twilio로 고객 500명에게 SMS 프로모션 메시지 일괄 발송"`

**기대 결과:**
- 서비스 감지: Twilio (1개)
- AUTH에 Twilio API Key 포함
- COST 활성화 (SMS 비용)
- rate_limit_concern 고려

### 시나리오 23: 빈 프롬프트 (최소 입력)

**입력:** `"간단한 스크립트 실행"`

**기대 결과:**
- 서비스 감지: 0개
- 체크리스트 최소 10개, 최대 20개 (바운드 하한)
- AUTH/NET/RT 필수 카테고리 반드시 포함 (PRD A-3-2 항상 포함 규칙)
- DB/DOCKER/COST/HW 카테고리 미포함 (오탐 방지)
- ambiguity_score 높음 (0.5~1.0)

### 시나리오 24: 복합 서비스 (5개 이상)

**입력:** `"GitHub에서 코드 가져와서 Docker로 빌드하고, PostgreSQL에 테스트 데이터 넣고, AWS S3에 결과 업로드하고, Slack으로 완료 알림"`

**기대 결과:**
- 서비스 감지: GitHub, Docker, PostgreSQL, AWS, Slack (5개)
- 체크리스트 40~50개 (상한 근접)
- 대부분 카테고리 활성화
- AUTH likelihood +1 (서비스 2개 이상)

### 시나리오 25: Google Drive + Docs

**입력:** `"Google Drive에서 파일 다운로드해서 Google Docs로 보고서 작성"`

**기대 결과:**
- 서비스 감지: Google Drive, Google Docs (Google 서비스 2개)
- AUTH-04 (Google 인증) 포함
- DB/Docker 항목 미포함

### 시나리오 26: Redis 캐싱

**입력:** `"Redis 캐시 레이어 추가해서 API 응답 속도 최적화"`

**기대 결과:**
- 서비스 감지: Redis (1개)
- DB 카테고리 활성화
- BT 활성화 (빌드/테스트)
- AUTH/HW/COST 최소화

### 시나리오 27: 한국어 + 영어 혼합

**입력:** `"Notion API로 database query해서 pandas DataFrame으로 변환 후 matplotlib chart 생성"`

**기대 결과:**
- 서비스 감지: Notion (1개)
- Python + pandas + matplotlib 의존성 감지
- AUTH-08 (Notion) 포함

### 시나리오 28: CI/CD 파이프라인

**입력:** `"GitHub Actions로 테스트 자동화하고 lint 통과하면 Vercel에 자동 배포"`

**기대 결과:**
- 서비스 감지: GitHub, Vercel (2개)
- GIT 카테고리 활성화
- BT 카테고리 활성화 (테스트, lint)
- AUTH-03 (GitHub), Vercel 토큰 포함

### 시나리오 29: SQLite 로컬 앱

**입력:** `"SQLite 데이터베이스로 로컬 메모 앱 만들어줘"`

**기대 결과:**
- 서비스 감지: 0개 (SQLite는 로컬)
- DB 카테고리 활성화 (SQLite)
- NET/AUTH 최소화 (로컬 앱)
- HW/COST 미포함

### 시나리오 30: 대규모 overnight 멀티서비스

**입력:** `"밤새 AWS Lambda로 S3 버킷의 이미지 10000장을 OpenAI Vision으로 분석하고, 결과를 PostgreSQL에 저장한 후, Slack으로 진행 상황 알림을 보내고, 최종 보고서를 Notion에 작성해줘"`

**기대 결과:**
- 서비스 감지: AWS, OpenAI, PostgreSQL, Slack, Notion (5개)
- 체크리스트 40~50개 (상한 근접)
- HW/OS/COST/MON/AUTH/DB 전부 활성화 (밤새 + 멀티서비스)
- estimated_duration: 8~24시간
- AUTH likelihood 최대 boost
- rate_limit_concern: true (OpenAI)
- 모든 카테고리 활성화 가능

---

## 시나리오 검증 공통 기준

모든 시나리오는 아래 기준을 만족해야 한다:

1. **서비스 감지 정확성**: 입력에 명시된 서비스가 seed.json에 포함
2. **오탐 방지**: 사용하지 않는 기술(Docker, DB 등)이 체크리스트에 미포함
3. **바운드 준수**: 체크리스트 10~50개
4. **Risk Score 정렬**: 내림차순
5. **액셔너블 리포트**: Action Plan에 "수동 확인이 필요합니다" 대신 구체적 명령어
6. **출력 파일 6종**: seed.json, checklist.json, results.json, report.json, report.html, chaos-lab-report-*.md
7. **빌드 에러 0**: `npm run build` 성공
8. **seed.json 스키마 완전성**: task_summary, ambiguity_score, external_services, local_dependencies, estimated_duration, failure_impact, environment_assumptions 7개 필드 필수
9. **Verdict 유효성**: report.json의 verdict 값이 READY / READY WITH CAUTION / NOT READY 중 하나
10. **report.html 외부 의존성 0**: `<link href="http` 또는 `<script src="http` 패턴 없음
11. **필수 카테고리 검증**: 시나리오별 requiredCategories에 명시된 카테고리가 체크리스트에 포함
12. **필수 항목 검증**: 시나리오별 requiredItems에 명시된 항목(또는 동일 카테고리의 CUSTOM 대체 항목)이 포함
13. **소요시간 추정 검증**: 장시간 작업 시나리오(밤새, N시간 등)의 estimated_duration이 기대 범위와 일치

---

## 로그 기반 검증

> 각 Step 완료 시 구조화된 로그를 출력하여, 로그만으로 로직 동작을 확인할 수 있어야 한다.

| Step | 로그 출력 예시 | 확인 포인트 |
|------|---------------|------------|
| Step 1 | `[Step1] 서비스 3개 감지: Google Sheets, Target Websites, Notion` | 감지된 서비스 목록과 개수 |
| Step 2 | `[Step2] 체크리스트 28개 생성 (Layer1: 20, Layer2: 8), DB/Docker 항목 제외됨` | 항목 수, 제외된 카테고리 |
| Step 3 | `[Step3] 검증 완료: PASSED 22, FAILED 3, WARNING 2, SKIPPED 1` | 상태별 카운트 |
| Step 4 | `[Step4] Auto-fix 2건 시도 → 1건 HEALED, 1건 실패` | fix 시도/성공/실패 수 |
| Step 5 | `[Step5] Verdict: NOT READY (CRITICAL 2건), 액션 플랜 3건 생성` | 최종 판정 + 액션 수 |

---

## 품질 기준

| 항목 | 기준 |
|------|------|
| 전체 파이프라인 실행 시간 | 10분 이내 |
| 개별 검증 항목 타임아웃 | 30초 이내 |
| TypeScript 컴파일 | 에러 0 |
| 마스터 체크리스트 항목 수 | 정확히 100개 |
| 체크리스트 바운드 | 10~50개 |
| 위험 명령어 차단 | `rm -rf`, `sudo`, `chmod 777` 100% 차단 |
| 웹 리포트 외부 의존성 | 0 (완전 인라인) |
| 지원 OS | macOS (darwin) 필수, Linux 권장 |

