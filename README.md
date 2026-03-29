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
┌─────────────────────────┐
│ Step 1: Seed 생성        │  키워드 매칭으로 서비스/의존성 추출
│ (Quick Mode / Deep Mode) │  → seed.json
├─────────────────────────┤
│ Step 2: 체크리스트 생성    │  Layer 1(마스터 100개) + Layer 2(커스텀)
│ (Layer 1 + Layer 2)      │  → checklist.json (10~50개)
├─────────────────────────┤
│ Step 3: Shell 검증        │  execa로 각 항목 실행 (30초 타임아웃)
│ (병렬 실행)               │  → results.json
├─────────────────────────┤
│ Step 4: Auto-fix          │  CRITICAL 항목 동적 분석 + 자동 수정
│ (안전 가드레일)            │  rm -rf, sudo, chmod 777 차단
├─────────────────────────┤
│ Step 5: 리포트 + Verdict  │  READY / READY WITH CAUTION / NOT READY
│ (JSON, MD, HTML)         │  → report.json, report.html, *.md
└─────────────────────────┘
    │
    ▼
  브라우저 자동 오픈 (file:// 프로토콜)
```

## 체크리스트 카테고리 (11개, 100개 항목)

| 카테고리 | 코드 | 항목 수 | 주요 검증 |
|----------|------|---------|----------|
| 하드웨어 & 전력 | HW | 10 | 슬립 모드, 배터리, 디스크, 메모리 |
| 네트워크 | NET | 10 | 인터넷, DNS, 엔드포인트, Rate Limit |
| API 인증 | AUTH | 10 | API 키, OAuth, 토큰 유효성, MCP |
| Claude Code | CC | 12 | CLI 설치, MCP 서버, 플러그인 |
| 런타임 & 의존성 | RT | 13 | Python, Node, Docker, 패키지 |
| 빌드 & 테스트 | BT | 10 | 빌드, 테스트, lint, 포트 충돌 |
| 데이터베이스 | DB | 8 | PostgreSQL, MySQL, MongoDB, Redis |
| Git & 버전 관리 | GIT | 9 | Remote, 브랜치, GitHub CLI |
| OS & 프로세스 | OS | 8 | ulimit, cron, 타임존, 좀비 프로세스 |
| 비용 & 안전장치 | COST | 6 | Spending limit, Kill switch |
| 모니터링 | MON | 4 | 알림, 로그, 롤백 |

## Auto-fix

CRITICAL 항목 중 안전하게 자동 수정 가능한 것을 탐지합니다:

| 에러 | Auto-fix 명령어 |
|------|----------------|
| pip 패키지 미설치 | `pip3 install --user <package>` |
| caffeinate 미실행 | `caffeinate -i &` |
| .env 파일 없음 | `touch .env` |
| node_modules 없음 | `npm install` |
| 포트 충돌 | `lsof -ti:<port> \| xargs kill` |

**안전 가드레일**: `rm -rf`, `sudo`, `chmod 777` 포함 명령어는 자동 차단됩니다.

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
