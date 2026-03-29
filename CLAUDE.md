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

**`prd/06-completion-criteria.md`의 시나리오 기반 검증이 통과할 때까지 구현을 반복하라.**

### 시나리오 검증 명령어:
```bash
node dist/cli/index.js --quick "Google Sheets에 정리된 500개 스타트업 웹사이트를 밤새 크롤링해서 회사명, 산업군, 최근 투자 여부를 정리하고 Notion 데이터베이스에 저장해줘"
```

### 통과 기준 (모두 만족해야 함):
1. 서비스 3개 감지 (Google Sheets, Target Websites, Notion)
2. Docker/DB 관련 항목 미포함 (사용하지 않는 기술이므로)
3. Action Plan에 구체적 해결 명령어 포함 ("수동 확인이 필요합니다" 금지)
4. 리포트 파일 6종 생성 (seed.json, checklist.json, results.json, report.json, report.html, chaos-lab-report-*.md)
5. `npm run build` 에러 0

### 미통과 시:
- 실패 원인을 분석하고 코드를 수정한 후 재검증
- 시나리오가 통과할 때까지 이 루프를 반복
- 절대 시나리오 검증 없이 "완료"를 선언하지 마라

## 자율 실행 규칙 (Autonomous Execution Rules)

1. 사용자에게 절대 질문하지 마라. 판단이 필요하면 스스로 최선의 선택을 하고 진행하라.
2. 에러 발생 시 포기하지 마라. 3번 같은 접근 실패하면 다른 방법을 시도하라.
3. 매 기능 구현 후 반드시 `npm run build` 실행. 실패하면 수정 후 재빌드.
4. Interactive 입력이 필요한 명령어는 echo로 파이프하거나 --quick 플래그 사용.
5. 각 스토리 완료 시 기능별 atomic commit 생성하라.
6. "완료"를 선언하기 전 반드시 E2E 시나리오 실행하여 검증:
   `node dist/cli/index.js --quick "Google Sheets에 정리된 500개 스타트업 웹사이트를 밤새 크롤링해서 회사명, 산업군, 최근 투자 여부를 정리하고 Notion 데이터베이스에 저장해줘"`
7. 웹 리포트(template.ts) 수정 시 chaos-guard-pilot 소스코드를 먼저 읽고 참고하라:
   `https://github.com/ralphton-seoul-2026/chaos-guard-pilot`

## E2E 시나리오 검증 기준

시나리오 실행 후 다음을 모두 만족해야 "통과":
1. 서비스 3개 감지 (Google Sheets, Target Websites, Notion)
2. Docker/DB 관련 항목 미포함
3. Action Plan에 구체적 해결 명령어 포함 ("수동 확인이 필요합니다" 금지)
4. 리포트 파일 6종 생성 (seed.json, checklist.json, results.json, report.json, report.html, chaos-lab-report-*.md)
5. npm run build 에러 0
