# Step 1~2: Seed 생성 + 체크리스트 자동 생성

> 원본 PRD 섹션 3, 4에 해당

---

## 3. Step 1 — 요구사항 분석 (Seed 생성)

### 3.1 목적
사용자의 자연어 프롬프트를 분석하여, 에이전트 실행에 필요한 **환경 의존성**을 구조화된 Seed로 추출한다.

### 3.2 두 가지 분석 모드 (사용자 선택)

실행 시작 시 사용자에게 선택지를 제공한다 (AskUserQuestion 활용).

```
🧪 Chaos Lab — Seed 생성 방식을 선택하세요:

  [1] Quick Mode (즉시, 로컬 키워드 매칭)
      → 빠르고 무료, 단순한 작업에 적합

  [2] Deep Mode (Ouroboros 소크라테스 문답)
      → 정밀하지만 시간 소요 (1~3분), 복잡한 작업에 권장
      → Claude Code 내에서 Ouroboros agent 호출 (추가 비용 없음)
```

#### 모드 1: Quick Mode (로컬 키워드 매칭)
- **시간**: 즉시 (~0초)
- **비용**: 무료 (API 호출 없음)
- **방식**: 키워드 패턴 매칭으로 의존성 추출
- **적합**: 단순한 작업, 빠른 검증이 필요할 때
- **한계**: 암묵적 의존성을 놓칠 수 있음

#### 모드 2: Deep Mode (Ouroboros 연동)
- **시간**: 1~3분 (소크라테스 문답 2~3라운드)
- **비용**: 추가 비용 없음 (Claude Code 내에서 Ouroboros agent/skill 호출로 실행)
- **방식**: [Ouroboros](https://github.com/Q00/ouroboros)의 BigBang 방식으로 소크라테스 문답 수행
- **적합**: 복잡한 작업, 여러 서비스 연동, 장시간 실행
- **장점**: 표면적 요구와 실제 전제조건의 차이를 발견, ambiguity_score 기반 품질 보장

**Deep Mode 소크라테스 질문 예시:**
1. "이 작업에서 외부 서비스는 무엇이 필요한가?" → API, DB, 웹사이트 식별
2. "각 서비스에 어떤 인증이 필요한가?" → OAuth, API Key, MCP 식별
3. "작업 중간에 실패하면 어떤 데이터가 유실되는가?" → failure_impact 도출
4. "이 작업의 예상 소요시간은?" → 슬립/배터리/네트워크 중요도 판단
5. "어떤 로컬 도구가 필요한가?" → Python, Node, pip 패키지 등

**Deep Mode 종료 조건:**
- `ambiguity_score ≤ 0.2` 달성
- 최대 3라운드 질문 후 best-effort Seed 생성

**설치**: Ouroboros는 Chaos Lab 플러그인 설치 시 함께 설치된다 (의존성으로 포함).

### 3.3 Quick Mode 구현: 로컬 키워드 매칭

외부 LLM API 호출 없이 로컬에서 동작한다.

**서비스 감지 패턴 (20개+):**

| 패턴 | 감지되는 서비스 | 인증 타입 |
|------|---------------|----------|
| `google sheets` | Google Sheets API | OAuth2 / API Key |
| `notion` | Notion API | Bearer Token / MCP |
| `github` | GitHub API | Personal Access Token |
| `slack` | Slack API | Bot Token |
| `aws`, `s3`, `lambda` | AWS | IAM / Access Key |
| `postgres`, `postgresql` | PostgreSQL | Connection String |
| `크롤링`, `scraping` | Target Websites | none |
| `docker` | Docker | none (local) |
| `google drive` | Google Drive API | OAuth2 / API Key |
| `google docs` | Google Docs API | OAuth2 / API Key |
| ... | (20개 이상 서비스 패턴) | ... |

**로컬 의존성 감지 패턴:**

| 패턴 | 감지되는 의존성 |
|------|---------------|
| `python`, `pandas` | Python >= 3.10 |
| `node`, `typescript` | Node.js >= 18 |
| `docker` | Docker Desktop |
| `mcp` | Node.js >= 18 (MCP 서버용) |

**소요시간 추정:**

| 패턴 | 예상 소요시간 |
|------|-------------|
| `밤새`, `overnight` | 8~24시간 |
| `시간`, `hour` | 2~4시간 |
| `500`, `1000`, `대량` | 1~3시간 |
| 기본 | 30분~1시간 |

### 3.4 Seed 출력 형식 (seed.json)

```json
{
  "task_summary": "Google Sheets의 URL 목록을 크롤링하여 Python으로 분석하고 Notion에 저장",
  "ambiguity_score": 0.15,
  "external_services": [
    {"name": "Google Sheets API", "auth_type": "OAuth2", "operations": ["read"], "estimated_calls": 10, "rate_limit_concern": false},
    {"name": "Target Websites", "auth_type": "none", "operations": ["HTTP GET"], "estimated_calls": 500, "rate_limit_concern": true},
    {"name": "Notion API", "auth_type": "Bearer Token / MCP", "operations": ["create_page"], "estimated_calls": 50}
  ],
  "local_dependencies": ["Python >= 3.10", "pip: pandas, beautifulsoup4", "Node.js >= 18"],
  "estimated_duration": "2~4시간",
  "failure_impact": ["크롤링 중단 시: 부분 데이터 유실", "Notion 실패 시: 분석 결과 전체 유실"],
  "environment_assumptions": ["안정적인 인터넷 연결", "슬립 모드 비활성화", "충분한 디스크 공간"]
}
```

---

## 4. Step 2 — 체크리스트 자동 생성

### 4.1 체크리스트 생성 전략: Layer 2(커스텀)가 핵심, Layer 1은 보완

체크리스트는 두 레이어로 구성되며, **Layer 2가 메인 체크리스트**이다:

```
┌───────────────────────────────────────────────────┐
│  Layer 2: 메인 체크리스트 (Seed 맥락 기반 동적 생성)  │  ★ 핵심
│  → Claude Code가 Seed를 분석하여 맥락 맞춤 항목 생성  │
│  → 서비스/도구별 구체적 검증 항목 + relevant_to 태그   │
│  → 작업 특성에 맞는 Risk Score 동적 조정              │
├───────────────────────────────────────────────────┤
│  Layer 1: 참조용 베이스라인 (최소한의 안전망)          │  보완 역할
│  → 11개 카테고리 사전 정의 항목                       │
│  → Seed 기반으로 관련 항목 자동 선별                  │
│  → 기본 Risk Score 제공                             │
└───────────────────────────────────────────────────┘
```

**Layer 2가 체크리스트의 핵심**이며, Seed의 작업 맥락을 깊이 분석하여 정밀한 검증 항목을 동적으로 생성한다. **Layer 1**은 Layer 2가 놓칠 수 있는 기본적인 안전 항목을 보완하는 참조용 베이스라인 역할을 한다.

### 4.2 Layer 1: 참조용 베이스라인 (11개 카테고리 요약)

> **참고:** Layer 1은 보완 역할의 안전망이다. 각 카테고리의 상세 항목(100개)은 `docs/master-checklist-reference.md`를 참조한다.

| 카테고리 | 코드 | 항목 수 | 주요 검증 내용 |
|----------|------|---------|--------------|
| 하드웨어 & 전력 | HW | 10 | 슬립 모드, 배터리, 디스크, 메모리, tmux |
| 네트워크 | NET | 10 | 인터넷, DNS, 엔드포인트, Rate Limit, SSL |
| API 인증 | AUTH | 10 | API 키 존재, 유효성, scope, 만료시간, MCP |
| Claude Code | CC | 12 | 버전, 구독, MCP 서버, 도구 목록, 로그 |
| 런타임 & 의존성 | RT | 13 | Python, Node, pip/npm, 가상환경, Docker |
| 빌드 & 테스트 | BT | 10 | 빌드, 테스트, lint, 포트 충돌, 환경변수 |
| 데이터베이스 | DB | 8 | DB 연결, 마이그레이션, 백업, 격리 |
| Git & 버전 관리 | GIT | 9 | remote, 브랜치, uncommitted, 권한 |
| OS & 프로세스 | OS | 8 | ulimit, cron, 자동 업데이트, 타임존 |
| 비용 & 안전장치 | COST | 6 | spending limit, 예상 비용, kill switch |
| 모니터링 | MON | 4 | 알림 채널, 로그, 롤백, 결과 검증 |

**규칙 기반 선별 (베이스라인):**

| 조건 | 활성화되는 카테고리 |
|------|-------------------|
| 외부 서비스 존재 | AUTH, NET |
| 장시간 작업 (시간 이상) | HW, OS, COST, MON |
| Claude/MCP 언급 | CC |
| DB 키워드 | DB |
| Git 키워드 | GIT |
| 빌드/테스트 키워드 | BT |
| 항상 포함 (필수) | AUTH, NET, RT |

### 4.3 Layer 2: 메인 체크리스트 (Seed 맥락 기반 동적 생성)

> **Layer 2가 체크리스트의 핵심이다.** Seed의 작업 맥락을 분석하여 정밀한 검증 항목을 동적으로 생성하며, Layer 1(베이스라인)은 이를 보완하는 역할만 한다.

Claude Code(스킬 실행 주체)가 Seed를 분석하여 **작업 특화 검증 항목**을 동적으로 생성한다.

**`relevant_to` 태그 기반 필터링 (오탐 방지):**

각 생성 항목에 `relevant_to` 태그를 부여하여, Seed에 명시된 서비스/도구와 관련된 항목만 활성화한다. 이를 통해 작업에 무관한 항목이 검증 대상에 포함되는 **오탐(false positive)을 방지**하고, Google Drive/Google Docs 등 Seed에 명시되었으나 기본 패턴에 누락된 서비스도 커버하여 **미탐(false negative)을 최소화**한다.

**생성 프롬프트 (Claude Code가 내부적으로 수행):**

```
Seed를 분석하여 다음을 수행하세요:
1. 마스터 체크리스트에서 이 작업에 관련 없는 항목은 제거
2. 각 항목의 Risk Score를 작업 맥락에 맞게 재조정
3. 마스터에 없지만 이 작업에 필요한 커스텀 검증 항목 추가
   - 각 항목에 item_id (CUSTOM-01~), description, verification_command (Shell),
     impact, likelihood, relevant_to (관련 서비스/도구 태그 배열) 포함
4. relevant_to 태그가 Seed의 서비스 목록과 매칭되지 않는 항목은 제외

출력: JSON 배열
```

**커스텀 항목 예시:**

| Seed 내용 | 생성되는 커스텀 항목 | 검증 명령어 |
|-----------|-------------------|-----------|
| Google Sheets API 사용 | CUSTOM-01: Google OAuth 토큰 파일 존재 | `test -f ~/.config/gcloud/application_default_credentials.json` |
| Notion MCP 서버 사용 | CUSTOM-02: Notion MCP 서버 프로세스 확인 | `claude mcp list \| grep -i notion` |
| pandas 사용 | CUSTOM-03: pandas 임포트 가능 확인 | `python3 -c "import pandas; print(pandas.__version__)"` |
| 500건 크롤링 | CUSTOM-04: 크롤링 대상 첫 URL 접근 가능 | `curl -sI --max-time 5 {{first_url}}` |
| 밤새 실행 | CUSTOM-05: 배터리 잔량 4시간 이상 | `pmset -g batt \| grep -o '[0-9]*%'` |

**커스텀 항목의 힘 — 마스터로는 불가능한 것들:**
- 특정 pip 패키지가 import 가능한지 (RT-03은 설치 여부만 확인)
- 특정 API 엔드포인트의 실제 응답 확인 (NET-03은 범용 엔드포인트만)
- 프로젝트 고유 설정 파일 존재 여부
- 작업에 필요한 최소 디스크 공간 계산 (HW-03은 일반 여유 공간만)

### 4.4 체크리스트 병합 및 정렬

> **Layer 2(메인)를 우선**하고, Layer 1(베이스라인)은 Layer 2가 커버하지 못하는 기본 안전 항목만 보완한다.

```
1. Layer 2 생성: Claude Code가 Seed 분석 후 메인 체크리스트 동적 생성 (핵심)
2. Layer 1 생성: 마스터 체크리스트에서 규칙 기반 선별 (보완용)
3. 병합: Layer 2를 기준으로 Layer 1 항목 추가 (Layer 2 우선)
4. 중복 제거: 같은 검증 대상이면 Layer 2 항목 우선 (더 구체적이고 맥락 반영)
5. relevant_to 필터링: Seed의 서비스 목록과 무관한 Layer 1 항목 제거
6. Risk Score 재조정: Seed 맥락 반영 (장시간 → HW 항목 boost 등)
7. 정렬: Risk Score 내림차순
8. 바운드 적용: 최소 10개, 최대 50개
```

### 4.5 Risk Score 산정

```
Risk Score = Impact(1~5) × Likelihood(1~5)
```

- 범위: 1~25
- 정렬: Score 내림차순
- Claude Code가 Seed 맥락을 반영하여 동적 조정:
  - 외부 서비스 2개 이상 → AUTH 항목 likelihood +1
  - 장시간 작업 → HW 항목 likelihood +1
  - rate_limit_concern → NET-09 likelihood = 5

### 4.6 OS별 명령어 분기

각 체크리스트 항목은 macOS와 Linux 양쪽 Shell 명령어를 보유. `process.platform`으로 분기.

```typescript
interface CommandVariants {
  darwin: string;  // macOS
  linux: string;   // Linux
}
```

커스텀 항목은 Claude Code가 현재 OS를 감지하여 적합한 명령어를 생성한다.

---

## 구현 시 핵심 포인트

### Step 1 구현 체크리스트
- [ ] `src/step1-refine/local-seed-generator.ts` — 키워드 매칭 로직
- [ ] `src/step1-refine/socratic-questions.ts` — Deep Mode 질문 목록
- [ ] 서비스 감지 패턴 20개 이상 등록
- [ ] seed.json 출력 형식 준수

### Step 2 구현 체크리스트
- [ ] `src/core/master-checklist.ts` — 100개 항목 정의
- [ ] `src/step2-checklist/local-checklist-generator.ts` — Layer 1 선별 로직
- [ ] `src/step2-checklist/risk-scorer.ts` — Risk Score 계산 + Seed 맥락 조정
- [ ] Layer 1 + Layer 2 병합 + 중복 제거
- [ ] 바운드 적용 (10~50개)
