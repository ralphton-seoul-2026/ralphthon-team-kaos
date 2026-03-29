# 구현 로드맵 + 데모 시나리오 + 리스크

> 원본 PRD 섹션 12, 13, 14, 부록 A에 해당

---

## 12. 데모 시나리오

> **이 섹션은 구현 대상이 아닙니다.** 해커톤 발표 시 데모를 어떻게 진행할지 기술한 참고 자료입니다.

### 12.1 추천 데모 시나리오

```
사용자 프롬프트:
"/chaos-lab Google Sheets에 정리된 500개의 한국 스타트업 URL 목록을 크롤링해서
회사명, 설립연도, 투자 라운드 정보를 추출하고,
Python pandas로 투자 트렌드를 분석한 뒤,
결과를 Notion 데이터베이스에 저장하고 팀원들에게 공유해줘.
밤새 돌려놓을 거니까 안정적으로 해줘."
```

### 12.2 데모 흐름 (3분)

```
[0:00~0:05] /chaos-lab 실행 → 터미널에서 진행 시작
[0:05~0:15] Step 1~2 → 서비스 3개 감지, 체크리스트 35개 생성
[0:15~1:30] Step 3 → 실시간 검증 (항목이 하나씩 🟢/🔴 전환)
[1:30~1:45] CRITICAL 2개 발견:
            - AUTH-05: .env 미존재
            - RT-07: pip packaging 미설치 → [Fix 🔧] 버튼 표시
[1:45~2:15] Auto-fix 실행: pip3 install packaging
            → 재검증 → 🔴→🔧 전환 애니메이션 (💥 데모 하이라이트)
[2:15~2:45] 최종 리포트 → NOT READY + 구체적 해결 방법: `gcloud auth login` 실행 안내, `.env` 파일 생성 템플릿 제공
[2:45~3:00] Claude Code가 결과 요약: "1건만 수동 조치하면 바로 실행 가능합니다" + 액셔너블 명령어 안내
```

### 12.3 의도적 실패 세팅 (데모 전 준비)

| 의도적 실패 | 유형 | 데모 임팩트 |
|------------|------|-----------|
| pip packaging 제거 (`pip3 uninstall packaging -y`) | Auto-fixable | **Self-healing 데모** — 자동 설치 후 🔴→🔧 전환 |
| .env 파일 없음 | Manual-only | "수동 조치 필요" 안내 표시 |
| 슬립 모드 10분 설정 | Auto-fixable (선택) | caffeinate 자동 실행 |

### 12.4 스토리텔링

> **오프닝**: "여러분, 밤새 에이전트를 돌려본 적 있나요? 다음 날 아침에 '다 됐겠지' 하고 봤는데... 10분 만에 죽어있던 경험 있으시죠?"
>
> **핵심 메시지**: "Chaos Lab은 에이전트의 Pre-flight Checklist입니다. 환경 문제를 사전에 잡고, 고칠 수 있는 건 자동으로 고칩니다."
>
> **Self-healing 포인트**: "보세요, pip 패키지 하나가 빠져있었는데 Chaos Lab이 자동으로 설치하고 재검증까지 완료했습니다. 여러분이 자는 동안 이 작업이 안 끝날 뻔했어요."
>
> **클로징**: "Pre-flight check 없이 에이전트를 띄우는 것은, 연료 게이지 안 보고 비행기를 띄우는 것과 같습니다."

---

## 13. 구현 로드맵 (해커톤 타임라인)

### Phase A (MVP): 기본 파이프라인 + 터미널 출력

```
├── core/ (types, constants, master-checklist, risk-score)
├── step1-refine/ (local-seed-generator, socratic-questions)
├── step2-checklist/ (local-checklist-generator, risk-scorer)
├── step3-verify/ (executor, orchestrator)
├── step4-report/ (verdict, auto-fix, report-generator, formatters/)
├── cli/ (index.ts)
└── 빌드 + 테스트
```

### Phase B (확장): 웹 리포트 UI

```
├── web/ (server.ts, events.ts, public/index.html)
├── CLI에 --web 플래그 추가 (기본 활성화)
├── CLI에서 완료 후 report.html 생성 + 브라우저 자동 오픈
└── Auto-fix 웹 UI 연동
```

### Phase C (배포): 플러그인 + README

```
├── skill/SKILL.md
├── README.md
└── ~/.claude/skills/chaos-lab/ 설치
```

---

## 14. 리스크 및 완화 전략

### 14.1 본질적 리스크: 오탐과 미탐

Pre-flight Check 도구가 피할 수 없는 근본적 한계:

| 리스크 | 설명 | 예시 | 완화 |
|--------|------|------|------|
| **오탐 (False Positive)** | 실패라고 떴지만 실제론 문제없음 | API 키가 없다고 경고했지만, 해당 서비스를 실제로는 사용 안 함 | `relevant_to` 태그 기반 필터링으로 작업과 무관한 항목 자동 제외. Layer 2 커스텀 체크리스트로 작업 맥락에 맞는 정밀 판단. SKIPPED 상태로 수동 확인 유도 |
| **미탐 (False Negative)** | 통과라고 떴지만 실제론 실패함 | API 키가 존재하지만 scope 부족으로 런타임에 403 발생 | Deep Mode(Ouroboros)로 암묵적 의존성 발견. 커스텀 항목으로 실제 API test call 추가 |
| **환경 변화** | 검증 시점에는 정상이었지만 실행 중 변경됨 | 검증 시 토큰 유효 → 실행 3시간 후 만료 | 토큰 만료시간 vs 예상 소요시간 비교 경고 (AUTH-07) |

### 14.2 제품 한계 명시

> **Chaos Lab은 에이전트 실행 성공을 보장하는 도구가 아니다.**
> 실행 전에 **발견 가능한** 환경 리스크를 줄이는 도구이다.
>
> Pre-flight Check는 비행기의 이륙 전 점검과 같다 — 점검을 통과해도 비행 중 난기류를 만날 수 있지만, 점검 없이 이륙하는 것보다 확실히 안전하다.

이 한계를 인지하고, Chaos Lab은 다음을 **하지 않는다**:
- 런타임 에러 예측 (코드 버그, 로직 오류)
- 외부 서비스의 가용성 보장 (서버 다운, 점검)
- 실행 중 환경 변화 감지 (실시간 모니터링은 범위 밖)

대신 다음을 **확실히 한다**:
- 검증 시점에 확인 가능한 모든 환경 전제 조건을 체크
- 자동 수정 가능한 문제는 즉시 해결
- 수동 확인이 필요한 항목을 명확히 안내

### 14.3 구현 리스크

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 시간 부족 | 높 | 높 | Phase A만으로도 데모 가능 |
| Shell 명령어 OS 호환 | 중 | 중 | macOS/Linux 양쪽 매핑 |
| 브라우저가 HTML을 자동으로 못 열음 | 낮 | 낮 | `open` (macOS) / `xdg-open` (Linux) 분기 |
| 데모 시 네트워크 불안정 | 중 | 높 | 오프라인 체크 항목 우선 |
| 커스텀 체크리스트 품질 편차 | 중 | 중 | Layer 1(마스터) 베이스라인이 항상 포함되어 최소 안전망 보장 |

---

## 부록 A: 용어 정의

| 용어 | 정의 |
|------|------|
| Seed | 사용자 작업에서 추출한 구조화된 환경 의존성 명세 |
| Risk Score | Impact × Likelihood (1~25) |
| Pre-flight Check | 에이전트 실행 전 환경 전제 조건 검증 |
| Self-healing | CRITICAL 항목을 자동 수정하고 재검증하는 과정 |
| Verdict | 최종 판정 (READY / READY WITH CAUTION / NOT READY) |
| HEALED | Auto-fix로 수정 후 재검증 통과한 상태 |
| Layer 1 | 마스터 체크리스트 (100개 사전 정의 항목) |
| Layer 2 | LLM 커스텀 체크리스트 (Seed 기반 동적 생성) |
| Quick Mode | 로컬 키워드 매칭 기반 Seed 생성 (즉시, 무료) |
| Deep Mode | Ouroboros 소크라테스 문답 기반 Seed 생성 (정밀) |
