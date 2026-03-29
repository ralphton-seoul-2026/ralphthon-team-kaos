# 기술 아키텍처 + Claude Code 플러그인 + README

> 원본 PRD 섹션 9, 10, 11에 해당

---

## 9. Claude Code 플러그인

### 9.1 배포 형태

Chaos Lab은 **Claude Code 스킬(skill)**로 배포된다. 어떤 프로젝트에서든 `/chaos-lab` 으로 실행 가능.

### 9.2 스킬 정의 (SKILL.md)

```yaml
---
name: chaos-lab
description: AI 에이전트 실행 전 환경을 자동 검증하는 Pre-flight Check
triggers:
  - preflight
  - pre-flight
  - chaos lab
  - 환경 검증
  - 환경 체크
  - 돌려도 되나
  - 돌릴 수 있나
  - 밤새 돌려
  - 밤새 실행
argument-hint: "<에이전트에게 시킬 작업 설명>"
---
```

### 9.3 스킬 실행 흐름

```
사용자: "/chaos-lab 밤새 크롤링 돌려도 되나?"
  ↓
Claude Code: chaos-lab Node.js 프로세스 실행
  ↓
Step 1~5 실행 (터미널에서 실시간 진행 표시)
  ↓
완료 후 report.html 생성 → 브라우저 자동 오픈 (file:// 프로토콜)
  ↓
Claude Code: report.json 읽고 한국어로 결과 요약 전달
  * 리포트에 구체적 해결 가이드 포함 (액셔너블 리포트: 명령어, 경로, 설정값 등 즉시 실행 가능한 안내)
  ↓
CRITICAL 발견 시: Auto-fix 제안 → 사용자 승인 → 실행 → 재검증
```

### 9.4 설치 방법

**방법 1: 원클릭 설치 스크립트 (권장)**

```bash
curl -fsSL https://raw.githubusercontent.com/chaos-lab/chaos-lab/main/scripts/install.sh | bash
```

> **현재 리포지토리**: 해커톤 기간에는 `https://github.com/ralphton-seoul-2026/team-kaos`에서 개발 중

이 스크립트가 수행하는 것:
1. Chaos Lab 소스 클론 + 빌드
2. **Ouroboros 자동 설치** (Deep Mode 의존성)
   ```bash
   claude plugin marketplace add Q00/ouroboros && claude plugin install ouroboros@ouroboros
   ```
3. Claude Code 스킬 등록 (`~/.claude/skills/chaos-lab/SKILL.md`)

**방법 2: Claude Code 마켓플레이스**

```bash
claude plugin marketplace add chaos-lab/chaos-lab && claude plugin install chaos-lab@chaos-lab
```

플러그인 설치 시 `postinstall` 훅에서 Ouroboros를 자동으로 함께 설치한다.

**방법 3: 수동 설치**

```bash
# 1. Chaos Lab 빌드
cd ~/ralphthon-at-seoul/chaos-lab && npm install && npm run build

# 2. Ouroboros 설치 (Deep Mode용)
claude plugin marketplace add Q00/ouroboros && claude plugin install ouroboros@ouroboros

# 3. 스킬 등록
mkdir -p ~/.claude/skills/chaos-lab
cp skill/SKILL.md ~/.claude/skills/chaos-lab/SKILL.md
```

### 9.5 마켓플레이스 등록 구조

```
chaos-lab/
├── scripts/
│   └── install.sh          # 원클릭 설치 (Ouroboros 포함)
├── skill/
│   └── SKILL.md            # 스킬 정의 (플러그인 메타데이터 + 실행 지침)
├── src/                     # TypeScript 소스
├── dist/                    # 빌드 결과물
├── prompts/                 # LLM 프롬프트 템플릿 (3개 파일: seed-generation.md, checklist-generation.md, result-interpretation.md)
├── package.json
├── tsconfig.json
├── CLAUDE.md                # 프로젝트 내 에이전트 지침
└── README.md                # 프로젝트 설명
```

---

## 10. 기술 아키텍처

### 10.1 시스템 구성도

```
chaos-lab/
│
├── src/
│   ├── core/                     # 핵심 타입, 상수, 마스터 체크리스트
│   │   ├── types.ts              # Seed, ChecklistItem, CheckResult, Report, Verdict
│   │   ├── risk-score.ts         # Risk Score 계산
│   │   ├── constants.ts          # 타임아웃, 상수, 아이콘, 카테고리명
│   │   └── master-checklist.ts   # 100개 항목 (OS별 명령어 포함)
│   │
│   ├── step1-refine/             # Step 1: 로컬 Seed 생성
│   │   ├── local-seed-generator.ts    # 키워드 매칭 기반 Seed 생성
│   │   └── socratic-questions.ts      # 소크라테스 문답 질문 목록
│   │
│   ├── step2-checklist/          # Step 2: 규칙 기반 체크리스트
│   │   ├── local-checklist-generator.ts  # 카테고리 매칭 + Risk Score
│   │   └── risk-scorer.ts               # Seed 컨텍스트 기반 점수 조정
│   │
│   ├── step3-verify/             # Step 3: Shell 검증
│   │   ├── executor.ts           # execa 래퍼 + 타임아웃 + 오류 처리
│   │   └── orchestrator.ts       # SubAgent 그룹 관리 + 결과 수집
│   │
│   ├── step4-report/             # Step 4~5: Auto-fix + 리포트
│   │   ├── auto-fix.ts           # 분류 + 실행 + 재검증
│   │   ├── verdict.ts            # Verdict 판정
│   │   ├── report-generator.ts   # 리포트 조합
│   │   └── formatters/
│   │       ├── terminal.ts       # chalk + ANSI
│   │       ├── markdown.ts       # .md 파일
│   │       └── json.ts           # .json 파일
│   │
│   ├── web/                      # 웹 리포트 대시보드 (서버리스)
│   │   ├── html-generator.ts     # report.html 생성 (완료 후 1회, 데이터 인라인)
│   │   └── template.ts           # HTML 템플릿 (인라인 CSS + JS, 다크 테마)
│   │
│   └── cli/                      # CLI 엔트리포인트
│       └── index.ts              # 메인 오케스트레이터
│
├── skill/
│   └── SKILL.md                  # Claude Code 스킬 정의
│
├── prompts/                      # LLM 프롬프트 (확장용)
│   ├── seed-generation.md
│   ├── checklist-generation.md
│   └── result-interpretation.md
│
├── docs/                         # 참조 문서
│   └── master-checklist-reference.md  # 마스터 체크리스트 전체 참조
│
├── CLAUDE.md
├── README.md
├── package.json
└── tsconfig.json
```

### 10.2 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| 언어 | TypeScript (Node.js, ESM) | 타입 안전성, Claude Code 생태계 호환 |
| Shell 실행 | execa | 타임아웃, reject 옵션, cross-platform |
| 터미널 UI | chalk + ora | 색상, 스피너 |
| 웹 리포트 | 파일 기반 HTML 갱신 (서버 없음) | 의존성 제로, file:// 프로토콜 동작 |
| 실시간 갱신 | `<meta http-equiv="refresh" content="1">` | 1초마다 자동 새로고침, 완료 시 제거 |
| 프론트엔드 | 단일 HTML (인라인 CSS + JS + JSON) | 번들러 불필요, 오프라인 동작 |

---

## 11. README.md 요구사항

프로젝트 루트에 `README.md`를 포함해야 한다.

### 필수 섹션:
1. **프로젝트 소개**: 한 줄 설명 + 문제 정의
2. **Before / After**: 제품 가치를 한눈에 보여주는 비교 (아래 참고)
3. **데모 스크린샷/GIF**: 웹 리포트 UI 캡처
4. **설치 방법**: 원클릭 스크립트 + 마켓플레이스 + 수동
5. **사용법**: `/chaos-lab "작업 설명"` 예시
6. **아키텍처**: 5단계 파이프라인 다이어그램
7. **체크리스트 카테고리**: 11개 카테고리 테이블
8. **Auto-fix 목록**: 자동 수정 가능 항목 목록
9. **한계**: "리스크를 줄이는 도구이지 성공을 보장하는 도구가 아님" 명시
10. **Ralphthon 맥락**: Ouroboros → Chaos Lab → Oh-My-Codex 파이프라인 설명

### Before / After 섹션 (심사용 핵심 메시지):

README 상단(프로젝트 소개 바로 아래)에 배치하여, 읽는 사람이 3초 안에 제품 가치를 파악할 수 있게 한다.

```markdown
## Before / After

| | Without Chaos Lab | With Chaos Lab |
|---|---|---|
| 🕐 **발견 시점** | 실행 후 수시간 뒤 | 실행 전 30초 |
| 💸 **비용** | 토큰비 + 수면 시간 낭비 | 사전 검증 무료 |
| 🔴 **API 키 만료** | 3시간 후 전체 실패 → 아침에 발견 | 실행 전 탐지 → 즉시 갱신 |
| 😴 **슬립 모드** | 10분 후 작업 중단 → 모름 | 실행 전 경고 → caffeinate 자동 실행 |
| 📦 **패키지 누락** | ImportError로 크래시 | 실행 전 탐지 → Auto-fix 자동 설치 |
| 🔧 **조치** | 수동으로 하나씩 디버깅 | CRITICAL은 자동 수정, 나머지는 조치 방법 제시 |
```

---

## 구현 시 핵심 포인트

### 플러그인/배포 체크리스트
- [ ] `skill/SKILL.md` — 스킬 정의 파일 (triggers, argument-hint 포함)
- [ ] `scripts/install.sh` — 원클릭 설치 스크립트
- [ ] `CLAUDE.md` — 프로젝트 내 에이전트 지침
- [ ] `README.md` — 필수 10개 섹션 포함

### 아키텍처 체크리스트
- [ ] ESM imports: `.js` 확장자 필수
- [ ] 한국어 UI 메시지, 영어 코드
- [ ] OS별 명령어 분기: `CommandVariants { darwin, linux }`
- [ ] `src/core/types.ts` — 모든 타입 정의
