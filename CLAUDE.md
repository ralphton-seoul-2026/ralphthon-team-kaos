# Chaos Lab for Agents

AI 에이전트 실행 전 환경을 자동 검증하는 Pre-flight Check 시스템.

## 기술 스택

- TypeScript (Node.js, ESM)
- execa (Shell 실행), chalk + ora (터미널 UI)
- 서버리스 웹 리포트 (단일 HTML, file:// 프로토콜)

## 빌드 & 실행

```bash
npm install          # 의존성 설치
npm run build        # TypeScript → dist/
npm start -- "작업 설명"  # 실행
```

## 프로젝트 구조

```
src/
├── core/           # 타입, 상수, 마스터 체크리스트(100개), Risk Score
├── step1-refine/   # Seed 생성 (Quick/Deep Mode)
├── step2-checklist/ # 체크리스트 생성 (Layer 1 + Layer 2)
├── step3-verify/   # Shell 기반 병렬 검증
├── step4-report/   # Auto-fix + Verdict + 리포트 (JSON/MD/터미널)
├── web/            # 웹 대시보드 (HTML 생성)
└── cli/            # CLI 엔트리포인트
```

## 코딩 컨벤션

- ESM imports: `.js` 확장자 필수 (`import { x } from './types.js'`)
- 한국어 UI 메시지, 영어 코드
- OS별 명령어 분기: `CommandVariants { darwin, linux }`

## PRD 문서 구조

프로젝트 요구사항은 `prd/` 폴더의 6개 마크다운 파일로 정의되어 있다:

| 파일 | 내용 |
|------|------|
| `prd/01-overview.md` | 제품 비전, 문제 정의, 핵심 차별점, 5단계 파이프라인 개요 |
| `prd/02-pipeline-seed-checklist.md` | Step 1(Seed 생성: Quick/Deep Mode) + Step 2(체크리스트: Layer 1 참조 + Layer 2 커스텀 메인) |
| `prd/03-pipeline-verify-autofix-report.md` | Step 3(Shell 검증) + Step 4(Auto-fix) + Step 5(리포트/웹 대시보드) |
| `prd/04-architecture-deployment.md` | 기술 아키텍처, 디렉토리 구조, Claude Code 플러그인, README 요구사항 |
| `prd/05-roadmap-risks.md` | 구현 로드맵(Phase A→B→C), 데모 시나리오, 리스크 및 완화 전략 |
| `prd/06-completion-criteria.md` | **완료 조건 체크리스트 + 시나리오 기반 검증 (Loop 종료 조건)** |

## OpenSpec 기반 개발 워크플로우

이 프로젝트는 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 기반으로 스펙 생성 및 구현을 진행한다.

### 실행 순서

1. **`openspec init`** — 프로젝트 초기화 (이미 완료됨, `openspec/` 디렉토리 존재)
2. **`/opsx:propose`** — PRD/설계 기반으로 변경 사항 제안 (스펙 + 태스크 생성)
3. **`/opsx:apply`** — 제안된 스펙을 기반으로 실제 코드 구현

### Autopilot 모드와의 연동

- `openspec init` 실행 후, **oh-my-claudecode의 autopilot 모드**로 구현을 진행한다.
- autopilot 내에서 `/opsx:propose` → `/opsx:apply` 순서로 자동 진행된다.
- autopilot이 스펙 제안 → 구현 → 검증을 자율적으로 반복한다.

### 참조 파일

| 파일 | 용도 |
|------|------|
| `openspec/changes/chaos-lab-preflight/design.md` | 기술 결정사항 (TypeScript ESM, 2-Layer 체크리스트 등) |
| `openspec/changes/chaos-lab-preflight/specs/` | 모듈별 상세 스펙 (8개 모듈) |
| `openspec/changes/chaos-lab-preflight/tasks.md` | 구현 태스크 목록 (체크박스 추적) |
| `prd/` | 요구사항 상세 (6개 문서) |

## 종료 조건 (Loop 종료 기준)

**자동 검증 스크립트가 exit 0을 반환할 때까지 구현을 반복하라.**
**에이전트 자기 판단으로 "통과"를 선언하는 것은 금지된다. 반드시 스크립트 exit code로 판정한다.**

### 검증 명령어 (단일 명령어로 전체 30개 시나리오 검증):
```bash
npm run validate
```

### 개별 시나리오 검증 (디버깅용):
```bash
npm run validate:scenario -- 1       # 시나리오 1만
npm run validate:scenario -- 1,3,23  # 복수 시나리오
```

### 시나리오 정의:
- `scripts/scenarios.json`에 30개 시나리오 정의 (prd/06-completion-criteria.md 기반)
- `scripts/validate-engine.mjs`가 프로그래밍적으로 각 시나리오를 실행 + 검증
- 각 시나리오별로 서비스 감지 수, 필수/금지 카테고리, 체크리스트 바운드, 오탐 방지 등을 자동 판정

### 통과 기준:
1. `npm run build` exit code 0
2. `npm run validate` exit code 0 (**30개 시나리오 모두 통과**)
3. 위 두 명령 모두 exit 0이 아니면 절대 "완료" 선언 금지

### Loop 종료 금지 조건 (절대 위반 불가):
- `npm run validate`를 실행하지 않고 "완료" 선언 **금지**
- 검증 스크립트 stdout에 "FAIL"이 포함되면 종료 **불가**
- `npm run build`가 실패하면 종료 **불가**
- **검증 스크립트(`scripts/validate-engine.mjs`, `scripts/scenarios.json`)를 수정하여 통과시키는 것 금지**
- 에이전트가 로그를 읽고 자기 판단으로 "통과했다"고 선언하는 것 **금지** — exit code만이 판정 기준

### 미통과 시:
- `npm run validate` 출력에서 ❌ FAIL 항목을 확인
- 해당 실패 원인을 분석하고 **소스 코드**(scripts/ 가 아닌 src/)를 수정
- 수정 후 `npm run build && npm run validate` 재실행
- 30개 시나리오가 모두 통과할 때까지 이 루프를 반복

## 자율 실행 규칙 (Autonomous Execution Rules)

1. 사용자에게 절대 질문하지 마라. 판단이 필요하면 스스로 최선의 선택을 하고 진행하라.
2. 에러 발생 시 포기하지 마라. 3번 같은 접근 실패하면 다른 방법을 시도하라.
3. 매 기능 구현 후 반드시 `npm run build` 실행. 실패하면 수정 후 재빌드.
4. Interactive 입력이 필요한 명령어는 echo로 파이프하거나 --quick 플래그 사용.
5. 각 스토리 완료 시 기능별 atomic commit 생성하라.
6. "완료"를 선언하기 전 반드시 `npm run validate` 실행하여 exit 0 확인. 자기 판단으로 통과 선언 금지.
7. 웹 리포트(template.ts) 수정 시 chaos-guard-pilot 소스코드를 먼저 읽고 참고하라:
   `https://github.com/ralphton-seoul-2026/chaos-guard-pilot`

## E2E 시나리오 검증 기준

**자동 검증 스크립트 기반 — 수동 판정 금지**

```bash
npm run validate                     # 전체 30개 시나리오 검증
npm run validate:scenario -- 1,3     # 특정 시나리오만 디버깅
```

검증 엔진(`scripts/validate-engine.mjs`)이 각 시나리오마다 다음을 자동 검증한다:
1. 파일 6종 존재 (seed.json, checklist.json, results.json, report.json, report.html, chaos-lab-report-*.md)
2. seed.json: 서비스 감지 수 (시나리오별 기대 범위)
3. checklist.json: 오탐 방지 (금지 카테고리), 필수 카테고리, 바운드, Risk Score 정렬
4. report.json: Action Plan에 "수동 확인이 필요합니다" 금지 문구 없음
5. report.html: 크기 > 1KB
6. npm run build exit code 0

시나리오 정의는 `scripts/scenarios.json`에 30개 전부 포함.

**판정 기준: `npm run validate` exit code 0 = 통과 (30개 전부), 그 외 = 실패**
