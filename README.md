<p align="center">
  <br/>
  ◈ ─────────────────── ◈
  <br/><br/>
  <img src="./docs/images/chaos-lab-logo.png" width="420" alt="Chaos Lab">
  <br/><br/>
  <strong>C H A O S &nbsp; L A B</strong>
  <br/>
  <sub>AI 에이전트 Pre-flight Check 시스템</sub>
  <br/><br/>
  ◈ ─────────────────── ◈
  <br/>
</p>

<p align="center">
  <strong>밤새 돌린 크롤링이 3시간 만에 API 키 만료로 죽었다면?</strong>
  <br/>
  <sub>AI 에이전트를 실행하기 <b>전에</b> 환경을 자동 검증하여 실패를 미리 방지하는 Pre-flight Check 시스템.</sub>
</p>

<p align="center">
  <a href="#설치-방법">설치</a> ·
  <a href="#사용법">사용법</a> ·
  <a href="#아키텍처-5단계-파이프라인">아키텍처</a> ·
  <a href="#체크리스트-카테고리-11개-100개-항목">체크리스트</a> ·
  <a href="#auto-fix">Auto-fix</a>
</p>

---

## Before / After

| | Without Chaos Lab | With Chaos Lab |
|---|---|---|
| 🕐 **발견 시점** | 실행 후 수시간 뒤 | 실행 전 30초 |
| 💸 **비용** | 토큰비 + 수면 시간 낭비 | 사전 검증 무료 |
| 🔴 **API 키 만료** | 3시간 후 전체 실패 → 아침에 발견 | 실행 전 탐지 → 즉시 갱신 |
| 😴 **슬립 모드** | 10분 후 작업 중단 → 모름 | 실행 전 경고 → caffeinate 자동 실행 |
| 📦 **패키지 누락** | ImportError로 크래시 | 실행 전 탐지 → Auto-fix 자동 설치 |
| 🔧 **조치** | 수동으로 하나씩 디버깅 | CRITICAL은 자동 수정, 나머지는 조치 방법 제시 |

## 설치 방법

### 아래 스크립트 실행

```bash
git clone https://github.com/ralphton-seoul-2026/ralphthon-team-kaos.git
cd ralphthon-team-kaos
bash scripts/install.sh
```

## 사용법

### Claude Code 스킬

```
/chaos-lab "슬랙 채널의 일일 문의 로그를 수집해 요약/분류한 뒤 각 담당자에게 메일로 자동 보고하는 운영 자동화 만들거야."
```

## 아키텍처: 5단계 파이프라인

```
사용자 프롬프트
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ Step 1: Seed 생성                                                │
│ 키워드 매칭으로 외부 서비스 25종 + 로컬 의존성 감지               │
│ 소요시간·위험도·환경 가정까지 자동 추정 → seed.json               │
├──────────────────────────────────────────────────────────────────┤
│ Step 2: 체크리스트 생성                                           │
│ Layer 1: 마스터 100개 항목에서 태스크에 맞는 항목 선택             │
│ Layer 2: 감지된 서비스별 커스텀 항목 동적 생성                     │
│ Risk Score(impact × likelihood) 정렬, 중복 제거 → checklist.json │
├──────────────────────────────────────────────────────────────────┤
│ Step 3: Shell 검증                                               │
│ execa로 각 항목의 검증 명령어 실행 (항목당 30초 타임아웃)          │
│ 결과: PASSED / FAILED / WARNING / SKIPPED → results.json         │
├──────────────────────────────────────────────────────────────────┤
│ Step 4: Auto-fix                                                 │
│ 실패 항목을 auto-fixable / manual-only로 분류                     │
│ 안전 가드레일 통과 시 자동 수정 → 재검증                          │
├──────────────────────────────────────────────────────────────────┤
│ Step 5: Verdict + 리포트                                         │
│ READY (실패 0, 경고 ≤3) / READY_WITH_CAUTION / NOT_READY         │
│ → report.json, report.html, chaos-lab-report-*.md                │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
  브라우저 자동 오픈 (file:// 프로토콜)
```

**감지 가능한 외부 서비스 (25종)**: Google Sheets, Notion, GitHub, Slack, Discord, AWS, PostgreSQL, MySQL, MongoDB, Redis, Docker, OpenAI, Anthropic, Firebase, Supabase, Stripe, Twilio, SendGrid, Vercel, Airtable, Jira, Linear, Selenium, Playwright, 웹 크롤링

## 체크리스트 카테고리 (11개, 100개 항목)

| 카테고리 | 코드 | 항목 수 | 활성화 조건 | 주요 검증 |
|----------|------|---------|------------|----------|
| 하드웨어 & 전력 | HW | 10 | 장시간 태스크 (≥2시간) | 슬립 방지, caffeinate, 디스크 5GB, 메모리 2GB, 배터리 20%, CPU, 스왑, GPU |
| 네트워크 | NET | 10 | 항상 포함 | 인터넷 연결, DNS, API 엔드포인트, SSL/TLS, WebSocket, VPN, 방화벽, Rate Limit, 대역폭 |
| API 인증 | AUTH | 10 | 항상 포함 | Anthropic/OpenAI/GitHub/Google/AWS/Slack/Discord/Notion 키, 만료 검증, MCP 인증 |
| Claude Code | CC | 12 | 키워드 감지 | CLI 설치, 버전, 구독, MCP 서버, 설정 디렉토리, CLAUDE.md, 플러그인, 스킬, 모델 접근 |
| 런타임 & 의존성 | RT | 13 | 항상 포함 | Node ≥18, Python ≥3.10, npm, pip3, venv, TypeScript, Docker, curl, git, jq, make |
| 빌드 & 테스트 | BT | 10 | 키워드 감지 | npm build, 테스트 스위트, lint, 타입 체크, dev 서버, 커버리지, 캐싱, HMR |
| 데이터베이스 | DB | 8 | 키워드 감지 | PostgreSQL/MySQL/MongoDB/Redis 실행, 연결 문자열, 스키마 마이그레이션, 백업, 커넥션 풀 |
| Git & 버전 관리 | GIT | 9 | 키워드 감지 | 레포 초기화, origin remote, 브랜치, 커밋 히스토리, 충돌, .gitignore, SSH 키 |
| OS & 프로세스 | OS | 8 | 장시간 태스크 (≥2시간) | ulimit, 시그널 핸들링, 자동 업데이트 비활성화, 타임존, 좀비 프로세스, 시스템 로드 |
| 비용 & 안전장치 | COST | 6 | 장시간 태스크 (≥2시간) | API 쿼터, 지출 한도, Rate Limiting, 에러 버짓, 빌링 알림, 리소스 정리 |
| 모니터링 | MON | 4 | 장시간 태스크 (≥2시간) | 로그 수집, 메트릭 익스포트, 알림, 헬스체크 |

**동적 체크리스트 생성**: Layer 1(마스터 100개에서 선택) + Layer 2(서비스별 커스텀 생성) → 중복 제거 후 Risk Score 정렬 (MIN 10 ~ MAX 50개)

## Auto-fix

실패 항목을 `auto-fixable` / `manual-only`로 분류하고, 안전한 항목만 자동 수정 후 재검증합니다.

### 자동 수정 가능 (8종)

| 에러 패턴 | Auto-fix 명령어 |
|----------|----------------|
| pip 패키지 미설치 | `pip3 install --user <package>` |
| caffeinate 미실행 | `caffeinate -i &` |
| tmux 미실행 | `tmux new-session -d -s work` |
| .env 파일 없음 | `touch .env && echo "# Add your environment variables here" > .env` |
| .gitignore 없음 | `.gitignore` 자동 생성 (node_modules, dist, .env 포함) |
| node_modules 없음 | `npm install` |
| lockfile 없음 | `npm install` |
| 포트 충돌 | `lsof -ti:<port> \| xargs kill -9` |

### 수동 조치 안내 (manual-only)

자동 수정이 불가능한 항목은 서비스별 구체적인 조치 방법을 안내합니다:

| 실패 유형 | 안내 내용 |
|----------|----------|
| OAuth/토큰 만료 | `gcloud auth application-default login` |
| Notion API 키 | Notion Integrations 페이지 링크 |
| OpenAI/Anthropic 키 | 각 콘솔 API Keys 페이지 링크 |
| GitHub 토큰 | `gh auth login` 명령어 |
| AWS 자격증명 | `aws configure` 가이드 |
| Docker 미실행 | `open -a Docker` |
| DB 미실행 | `brew services start <service>` |
| 디스크/메모리/CPU | 진단 명령어 + 정리 방법 제시 |

### 안전 가드레일

다음 패턴이 포함된 명령어는 **자동 차단**됩니다:

`rm -rf` · `sudo` · `chmod 777` · `mkfs.` · `dd if=` · fork bomb

## 한계

Chaos Lab은 **리스크를 줄이는 도구**이지 **성공을 보장하는 도구가 아닙니다.**

- Quick Mode는 키워드 매칭 기반이므로 암묵적 의존성을 놓칠 수 있습니다
- API 토큰 유효성 검증은 실제 API 호출이 필요한 경우 한계가 있습니다
- Auto-fix는 안전한 명령어만 실행하며, 복잡한 설정은 수동 조치가 필요합니다
- 외부 서비스의 실시간 상태(Rate Limit 잔여량 등)는 정확히 확인할 수 없습니다

## 기술 스택

- **언어**: TypeScript (Node.js, ESM)
- **Shell 실행**: execa (타임아웃, cross-platform)
- **터미널 UI**: chalk + ora
- **웹 리포트**: 단일 HTML (인라인 CSS+JS+JSON, file:// 프로토콜)

## 라이선스

MIT
