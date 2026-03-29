# Step 3~5: Shell 검증 + Auto-fix + 리포트/웹 대시보드

> 원본 PRD 섹션 5, 6, 7, 8에 해당

---

## 5. Step 3 — Shell 기반 검증 실행

### 5.1 검증 결과 상태 (5가지)

| 상태 | 의미 | 아이콘 |
|------|------|--------|
| `PASSED` | 검증 통과 | 🟢 |
| `FAILED` | 즉시 조치 필요 | 🔴 |
| `WARNING` | 통과했지만 위험 요소 | 🟡 |
| `SKIPPED` | 자동 검증 불가 | ⚪ |
| `HEALED` | Auto-fix로 자동 수정됨 | 🔧 |

### 5.2 실행 전략

**타임아웃:**
- 개별 항목: 30초
- SubAgent 그룹: 3분
- 전체 Step 3: 5분
- 전체 파이프라인: 10분

**오류 처리:**
- `CommandNotFound` → SKIPPED ("검증 도구가 설치되지 않음")
- `PermissionError` → SKIPPED ("권한 부족으로 검증 불가")
- `Timeout` → WARNING ("검증 시간 초과")

### 5.3 결과 해석 로직

Shell 명령어 출력에서 키워드를 기반으로 상태를 판정:

| 출력 키워드 | 판정 |
|------------|------|
| `not found`, `not installed` | FAILED |
| `not running`, `not available` | FAILED |
| `expired`, `만료` | FAILED |
| `SKIPPED:` | SKIPPED |
| `denied`, `permission` | WARNING |
| exit code 0 + 정상 출력 | PASSED |

### 5.4 검증 명령어 작성 원칙 (실제 검증 필수)

> **핵심 원칙: 모든 검증 항목은 실제로 해당 조건을 확인하는 명령어를 사용해야 한다. "확인한 척"하는 명령어는 금지한다.**

**금지 패턴 (False Positive를 유발하는 가짜 검증):**

| 금지 패턴 | 문제점 | 올바른 대체 |
|-----------|--------|-----------|
| `echo $VAR` | 변수가 비어있어도 exit 0 반환 → 항상 PASSED | `test -n "${VAR}" && echo "set" \|\| echo "not found: VAR"` |
| `echo "Manual check..."` | 단순 문자열 출력 → 항상 PASSED | `echo "SKIPPED: ..."` (SKIPPED 접두사로 수동 확인 유도) |
| `curl ... \| head -1` (토큰 없이) | HTTP 401도 출력이 있어 exit 0 → PASSED | HTTP 상태 코드를 확인: `curl -so /dev/null -w "%{http_code}" ... \| grep 200` |

**필수 규칙:**

1. **환경변수 확인**: 반드시 `test -n "${VAR}"` 사용. `echo $VAR`는 금지.
2. **API 연결 확인**: HTTP 상태 코드까지 검증. 200이 아니면 FAILED.
3. **수동 확인 항목**: `echo "SKIPPED: ..."` 접두사를 사용하여 SKIPPED 상태로 분류.
4. **파일 존재 확인**: `test -f <path>` 사용. `ls`나 `cat`은 오류 메시지가 키워드 매칭에 간섭 가능.
5. **프로세스 확인**: `pgrep` 또는 `systemctl status` 사용. `ps aux | grep`은 자기 자신을 매칭할 수 있음.

---

## 6. Step 4 — Auto-fix Self-healing

### 6.1 목적
CRITICAL 항목 중 자동으로 수정 가능한 것을 사용자 승인 후 즉시 실행하고, 재검증하여 HEALED 상태로 전환한다.

### 6.2 Auto-fix 판단: LLM 동적 분석 (고정 목록이 아님)

Auto-fixable 여부는 **하드코딩된 목록이 아니라, Claude Code가 각 CRITICAL 항목의 에러 출력을 분석하여 동적으로 판단**한다.

**판단 플로우:**

```
각 CRITICAL 항목에 대해:
1. 검증 명령어의 실패 출력(details)을 Claude Code가 분석
2. 판단 기준:
   - 이 에러를 Shell 명령어 하나로 고칠 수 있는가?
   - 명령어 실행이 사용자 데이터에 안전한가? (읽기 전용, 비파괴적)
   - 명령어 실행에 사용자 상호작용(브라우저 로그인 등)이 필요 없는가?
3. 세 가지 모두 YES → auto-fixable로 분류 + 수정 명령어 생성
4. 하나라도 NO → manual-only로 분류 + 수동 조치 안내 생성
```

**Claude Code가 생성하는 판단 예시:**

| 에러 출력 | Claude Code 판단 | 생성 명령어 |
|-----------|-----------------|-----------|
| `packaging is not installed` | 패키지 미설치 → auto-fixable | `pip3 install --user packaging` |
| `caffeinate not running` | 프로세스 미실행 → auto-fixable | `caffeinate -i &` |
| `.env not found` | 설정 파일 부재 → auto-fixable | `touch .env && echo "# Add your env vars" > .env` |
| `OAuth token expired` | 브라우저 로그인 필요 → manual-only | "gcloud auth login 실행 필요" |
| `API scope insufficient` | 대시보드 설정 필요 → manual-only | "서비스 대시보드에서 권한 추가" |
| `disk space below 1GB` | 사용자 판단 필요 → manual-only | "불필요한 파일 삭제 또는 디스크 정리" |
| `port 3000 already in use` | 프로세스 종료 → auto-fixable | `lsof -ti:3000 \| xargs kill` |
| `node_modules missing` | 패키지 설치 → auto-fixable | `npm install` |

**이 방식의 장점:**
- 마스터 체크리스트에 없는 **커스텀 항목(CUSTOM-xx)**도 Auto-fix 가능
- 새로운 에러 패턴이 나타나도 별도 코드 수정 없이 대응
- 에러 메시지의 맥락을 이해하여 더 정확한 수정 명령어 생성

**안전 가드레일:**
- 생성된 명령어가 `rm -rf`, `sudo`, `chmod 777` 등 위험 패턴을 포함하면 자동 차단 → manual-only로 격하
- 사용자 승인 없이 실행하지 않음

### 6.3 Self-healing 플로우 (리포트 생성과 병렬)

Step 3(검증) 완료 후, Auto-fix와 리포트 생성이 병렬로 진행된다:

```
Step 3 완료 (전체 검증 결과 확보)
    │
    ├──→ 리포트 뼈대 생성 (PASSED/WARNING/SKIPPED 즉시 반영)
    │
    └──→ Auto-fix 병렬 실행:
           1. 각 CRITICAL 항목의 에러 출력을 Claude Code가 분석
           2. auto-fixable / manual-only 동적 분류 + 수정 명령어 생성
           3. auto-fixable 항목을 사용자에게 표시 (명령어 포함)
           4. 사용자 승인 대기
           5. 승인된 항목 실행
           6. 해당 항목 재검증 (verification command 재실행)
           7. 성공 시: FAILED → HEALED 상태 변경
           8. 실패 시: FAILED 유지 + "자동 수정 실패" 메모
              │
              └──→ 전체 완료 후 Verdict 재계산 + 최종 리포트 확정 + report.html 생성
```

PASSED/WARNING/SKIPPED 항목은 이미 확정이므로 Auto-fix를 기다릴 필요 없이 리포트에 먼저 반영된다. Auto-fix 결과만 최종 반영 후 report.html을 생성하고 브라우저를 오픈한다.

### 6.5 Auto-fix 동작 예시

> **참고:** 아래는 데모 진행 시 참고할 시나리오이며, 구현 대상이 아닙니다.

예를 들어 `pip packaging` 패키지가 없는 환경이라면:
- RT-07이 CRITICAL로 탐지됨
- Auto-fix: `pip3 install packaging` 실행
- 재검증: PASSED로 변경 → HEALED 표시
- 웹 UI에서 🔴→🔧 전환

---

## 7. Step 4+5 — 리포트 생성 (Auto-fix와 병렬)

### 7.1 Verdict 판정 로직

| 조건 | Verdict |
|------|---------|
| CRITICAL = 0, WARNING ≤ 3 | ✅ **READY** |
| CRITICAL = 0, WARNING > 3 | 🟡 **READY WITH CAUTION** |
| CRITICAL ≥ 1 | ❌ **NOT READY** |

### 7.2 리포트 출력 포맷 (3가지) — 액셔너블 리포트

모든 리포트 포맷에서 **액셔너블 리포트** 원칙을 적용한다:
- 각 FAILED 항목에 **"왜 이 검증이 필요한지"** (Seed 컨텍스트 연결) 표시
  - 예: "Google Sheets를 사용하므로 Google OAuth 토큰이 필요합니다"
- 각 FAILED 항목에 **"구체적 해결 명령어"** 포함
  - 예: `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/spreadsheets`
- 단순 "FAIL" 표시가 아닌, 사용자가 즉시 행동할 수 있는 가이드 제공

| 포맷 | 용도 | 파일 |
|------|------|------|
| **웹 브라우저** | 실시간 시각화, 데모 | `.chaos-lab/run-{timestamp}/report.html` (file:// 프로토콜) |
| **Markdown** | 기록 보관, Git | `.chaos-lab/run-{timestamp}/chaos-lab-report-{timestamp}.md` |
| **JSON** | 프로그래밍 소비 | `.chaos-lab/run-{timestamp}/report.json` |

### 7.3 출력 파일 목록

각 실행은 타임스탬프 디렉토리에 격리되어 저장된다. 이전 실행 결과를 덮어쓰지 않는다.

```
.chaos-lab/
└── run-{YYYYMMDD}-{HHMMSS}/   # 실행별 격리 디렉토리
    ├── seed.json              # Step 1 출력: 작업 분석 결과
    ├── checklist.json         # Step 2 출력: Risk Score 체크리스트
    ├── results.json           # Step 3 출력: 검증 결과
    ├── report.json            # Step 5 출력: 최종 리포트 (JSON)
    ├── report.html            # Step 3~5 출력: 웹 리포트 (브라우저용)
    └── chaos-lab-report-*.md  # Step 5 출력: 최종 리포트 (Markdown)
```

---

## 8. 웹 리포트 대시보드 (서버리스)

### 8.1 역할 분리

| 채널 | 역할 | 시점 |
|------|------|------|
| **터미널** | 실시간 진행 표시 (ora 스피너, 상태 아이콘) | 검증 진행 중 |
| **웹 브라우저** | 최종 리포트 대시보드 (예쁜 HTML) | 검증 완료 후 자동 오픈 |

### 8.2 동작 흐름

```
Node.js 프로세스                         브라우저
    │                                      │
    ├─ Step 1~3: 터미널에서 실시간 진행       │ (아직 안 열림)
    ├─ Step 4: Auto-fix 실행                │
    ├─ Step 5: 리포트 생성                   │
    ├─ report.html 생성 (최종 결과 인라인)    │
    └─ open report.html ──────────────────→ │ 브라우저 자동 오픈!
```

**서버 없음.** `file://` 프로토콜로 동작. 오프라인에서도 완벽 동작.

### 8.3 HTML 파일 구조

단일 HTML 파일에 모든 것을 인라인 (외부 의존성 없음):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chaos Lab — Pre-flight Report</title>
  <style>/* 인라인 CSS — 다크 테마, 카드 레이아웃, 애니메이션 */</style>
</head>
<body>
  <div id="app"></div>
  <script>
    // 최종 리포트 데이터 (Node.js가 생성 시 인라인)
    const REPORT = { /* report.json 전체 내용 */ };
    const CHECKLIST = [ /* checklist.json 전체 내용 */ ];
    const SEED = { /* seed.json 전체 내용 */ };
  </script>
  <script>/* 인라인 JS — 데이터를 읽어 대시보드 렌더링 */</script>
</body>
</html>
```

### 8.4 디자인 레퍼런스

웹 UI의 디자인과 레이아웃은 아래 GitHub 리포지토리의 소스코드를 참고하여 구현한다:

> **https://github.com/ralphton-seoul-2026/chaos-guard-pilot**

이 리포지토리의 소스코드(컴포넌트 구조, CSS 스타일링, 레이아웃 패턴)를 분석하여 Chaos Lab의 웹 리포트에 적용한다. 특히 다크 테마, 카드 레이아웃, 상태별 색상, 애니메이션 등의 시각적 스타일을 참고하되, Chaos Lab의 데이터 구조에 맞게 조정한다.

### 8.5 대시보드 핵심 기능

**Summary 카드:**
- 상태별 카운트 (CRITICAL, WARNING, PASSED, SKIPPED, HEALED)
- 각 카드에 색상 + 아이콘 + 숫자

**Verdict 배너:**
- READY → 초록 배경
- READY WITH CAUTION → 노랑 배경
- NOT READY → 빨강 배경

**카테고리별 상세 뷰:**
- 접이식 (collapsible) 섹션
- 각 항목: 아이콘 + item_id + 설명 + 상세 출력
- 각 실패 항목에 **"왜 이 검증이 필요한지"** 설명 표시 (Seed 맥락 기반)
  - 예: "이 작업은 Google Sheets API를 사용하므로 OAuth 인증이 필요합니다"
  - 예: "8시간 이상 장시간 실행이므로 슬립 모드 방지가 필수입니다"

**Auto-fix 결과:**
- HEALED 항목에 🔧 배지 + "자동 수정됨" 태그
- 원래 에러 → 수정 명령어 → 수정 후 결과 표시

**Action Plan (액셔너블 가이드):**
- 남은 수동 조치 항목 체크리스트
- 각 항목에 구체적 명령어 표시
- "수동 확인이 필요합니다" 대신 **구체적 단계별 가이드** 제공:
  - 예: "OAuth 토큰 만료 → `gcloud auth application-default login` 실행 후 재검증"
  - 예: "Notion MCP 서버 미실행 → `claude mcp add notion` 으로 MCP 서버 등록"
  - 예: "디스크 공간 부족 → `du -sh ~/Library/Caches/* | sort -rh | head -10` 으로 대용량 캐시 확인 후 정리"

### 8.6 실행 흐름 예시

> **참고:** 아래는 데모 발표 시 예상 흐름이며, 구현 대상이 아닙니다.

```
[0:00~1:30] 터미널: 실시간 검증 진행 (스피너 + 🟢🔴🟡 하나씩 표시)
[1:30~2:00] 터미널: Auto-fix 실행 → pip install → 재검증 HEALED
[2:00~2:15] 터미널: "리포트 생성 완료" → 브라우저 자동 오픈
[2:15~3:00] 브라우저: 대시보드에서 전체 결과 확인
```

---

## 구현 시 핵심 포인트

### Step 3 구현 체크리스트
- [ ] `src/step3-verify/executor.ts` — execa 래퍼 + 타임아웃(30초) + 오류 처리
- [ ] `src/step3-verify/orchestrator.ts` — 병렬 실행 + 결과 수집
- [ ] 결과 해석 로직 (키워드 기반 PASSED/FAILED/WARNING/SKIPPED 판정)
- [ ] 실시간 터미널 출력 (ora 스피너 + 상태 아이콘)

### Step 4 구현 체크리스트
- [ ] `src/step4-report/auto-fix.ts` — CRITICAL 동적 분석 + 수정 명령어 생성
- [ ] 안전 가드레일 (`rm -rf`, `sudo`, `chmod 777` 차단)
- [ ] 재검증 → HEALED 상태 전환
- [ ] `src/step4-report/verdict.ts` — Verdict 판정 로직

### Step 5 + 웹 구현 체크리스트
- [ ] `src/step4-report/report-generator.ts` — JSON/Markdown/터미널 포맷터
- [ ] `src/web/html-generator.ts` — report.html 생성 (데이터 인라인)
- [ ] `src/web/template.ts` — HTML 템플릿 (다크 테마, 카드 레이아웃)
- [ ] 브라우저 자동 오픈 (`open` / `xdg-open` 분기)
