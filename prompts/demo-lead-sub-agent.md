# Chaos Lab — Lead-Sub Agent 파이프라인

당신은 **Lead Agent**입니다. Chaos Lab 프로젝트의 빌드→검증→배포 파이프라인을 Sub-Agent 아키텍처로 실행합니다.

## 핵심 원칙

1. **직접 실행 최소화**: 빌드/검증/코드수정은 모두 Agent 도구로 Sub-Agent에게 위임
2. **당신의 역할**: Sub-Agent 생성 → 결과 수집 → 판단 → 다음 단계 결정 → 최종 보고
3. **scripts/ 수정 절대 금지**: validate-engine.mjs, scenarios.json 수정 불가

## 실행 순서

### PHASE 1: 병렬 정찰 (Sub-Agent 2개 동시 실행)

다음 두 Sub-Agent를 반드시 **한 턴에 동시** 실행하세요:

**Sub-Agent A — Build Agent:**
```
프로젝트 /Users/seongwoo/ralphthon-team-kaos 에서:
1. npm install 실행 (이미 설치되어 있으면 빠르게 완료됨)
2. npm run build 실행
3. 아래 형식으로 보고:

## 빌드 결과
- **상태**: [SUCCESS | FAILURE]
- **에러** (실패 시): [에러 메시지 전문]
- **dist/ 파일 수**: [N]개
```

**Sub-Agent B — Code Audit Agent:**
```
프로젝트 /Users/seongwoo/ralphthon-team-kaos 코드 구조를 감사:
1. src/ 하위 디렉토리 목록과 각 .ts 파일 수
2. scripts/scenarios.json의 시나리오 총 개수
3. package.json dependencies / devDependencies 개수
4. 아래 형식으로 보고:

## 코드 감사
- **모듈**: [목록]
- **소스 파일**: [N]개
- **시나리오**: [N]개
- **dependencies**: [N]개 / devDependencies: [N]개
```

### PHASE 1 판단

- Build Agent SUCCESS → PHASE 2 진행
- Build Agent FAILURE → PHASE 1.5 실행

### PHASE 1.5: 빌드 수정 (조건부)

빌드 실패 시에만 실행:

**Sub-Agent C — Fix Agent:**
```
프로젝트 /Users/seongwoo/ralphthon-team-kaos 빌드 에러 수정:
에러: [Build Agent에서 받은 에러 메시지 삽입]

규칙:
- src/ 만 수정 가능, scripts/ 수정 금지
- 수정 후 npm run build 재실행하여 성공 확인
- 3회 시도 후에도 실패하면 실패 보고

보고 형식:
## 수정 결과
- **수정 파일**: [경로]
- **변경 내용**: [요약]
- **재빌드**: [SUCCESS | FAILURE]
```

→ 재빌드 성공하면 PHASE 2 진행

### PHASE 2: 시나리오 검증 (Sub-Agent 1개)

**Sub-Agent D — Validation Agent:**
```
프로젝트 /Users/seongwoo/ralphthon-team-kaos 에서:
1. npm run validate 실행 (타임아웃 5분)
2. 출력의 마지막 10줄에서 PASS/FAIL 개수 파악
3. 아래 형식으로 보고:

## 검증 결과
- **통과**: [N]/30
- **실패**: [N]개
- **exit code**: [0 | 1]

### 실패 시나리오 (있을 경우)
| ID | 이름 | 실패 항목 |
|----|------|----------|
| [N] | [이름] | [FAIL 내용] |
```

### PHASE 2 판단

- 30/30 통과 (exit code 0) → PHASE 3 진행
- 실패 존재 → 실패 시나리오를 5개씩 묶어 Fix Sub-Agent 생성 (병렬 최대 2개)
  - Fix Agent에게 실패 시나리오 ID, FAIL 로그, 수정 대상 파일 힌트 전달
  - Fix 후 PHASE 2 재실행 (최대 3라운드)

**Fix Agent 프롬프트 템플릿:**
```
프로젝트 /Users/seongwoo/ralphthon-team-kaos

실패 시나리오:
- 시나리오 {N}: {FAIL 내용}
- 시나리오 {M}: {FAIL 내용}

주요 파일: src/core/master-checklist.ts, src/step1-refine/local-seed-generator.ts,
src/step2-checklist/local-checklist-generator.ts, src/step4-report/report-generator.ts

규칙: src/만 수정, scripts/ 수정 금지
완료 후: npm run build && npm run validate:scenario -- {N},{M} 실행

보고:
## 수정 요약
- 파일: [목록]
- 변경: [1-2줄 요약]
## 검증: 시나리오 {N} [PASS|FAIL], 시나리오 {M} [PASS|FAIL]
## 미해결: [있으면 기술]
```

### PHASE 3: 배포 (Sub-Agent 1개)

**Sub-Agent E — Ship Agent:**
```
프로젝트 /Users/seongwoo/ralphthon-team-kaos 에서:
1. git status 확인
2. 변경 사항이 있으면:
   - git add (변경된 src/ 파일만)
   - git commit -m "fix: lead-sub agent 검증 완료 — 30/30 시나리오 통과"
   - git push -u origin claude/review-commit-changes-qEleK
3. 변경 없으면 "이미 최신 상태" 보고
4. 변경 사항 유무와 관계없이 git push -u origin claude/review-commit-changes-qEleK 실행

보고:
## 배포 결과
- **변경 파일**: [N]개
- **커밋**: [해시 또는 SKIPPED]
- **푸시**: [SUCCESS | FAILURE]
- **브랜치**: [브랜치명]
```

### PHASE 4: 최종 보고 (Lead Agent 직접)

모든 Sub-Agent 결과를 종합하여 출력:
```
╔══════════════════════════════════════════════════════════════╗
║  Chaos Lab — Lead-Sub Agent 파이프라인 완료                  ║
╠══════════════════════════════════════════════════════════════╣
║  PHASE 1: 병렬 정찰                                         ║
║     Build:      [결과]                                      ║
║     Code Audit: [결과]                                      ║
║  PHASE 2: 시나리오 검증                                      ║
║     결과: [N]/30 통과                                        ║
║     수정 라운드: [N]회                                       ║
║  PHASE 3: 배포                                              ║
║     커밋: [해시]                                             ║
║     푸시: [결과]                                             ║
║  총 Sub-Agent 수: [N]개                                      ║
╚══════════════════════════════════════════════════════════════╝
```

## 금지 사항

- 자기 판단으로 "통과" 선언 금지 — exit code만이 기준
- scripts/ 수정 금지
- 같은 에러에 3회 같은 접근 실패 시 다른 전략 시도
- 한 턴에 3개 이상 Sub-Agent 동시 실행 금지 (파일 충돌 방지)

## 설계 의도

| 설계 요소 | 이유 |
|----------|------|
| PHASE 1 병렬 실행 | 데모에서 병렬 처리 시각적으로 보여줌 |
| 구조화된 보고 형식 | 리드 에이전트의 컨텍스트 절약 + 파싱 용이 |
| Fix Agent 최대 5개 시나리오 | 서브 에이전트 컨텍스트 소진 방지 |
| 최대 3라운드 재시도 | 무한 루프 방지 |
| PHASE 4 요약 박스 | 데모에서 깔끔한 마무리 |
| 절대 경로 포함 | 서브 에이전트는 CLAUDE.md를 상속하지 않을 수 있음 |

## 검증 방법

1. 새 Claude Code 세션에서 이 프롬프트 붙여넣기
2. PHASE 1에서 2개 Agent 호출이 한 턴에 나가는지 확인 (병렬)
3. PHASE 2에서 `npm run validate` 결과가 정확히 파싱되는지 확인
4. PHASE 3에서 리모트 푸시 성공 확인
5. PHASE 4 최종 보고서가 출력되는지 확인

## 주의사항

- 현재 프로젝트는 이미 30/30 통과 상태이므로, PHASE 1.5와 PHASE 2의 Fix 경로는 실행되지 않음
- 이것은 정상 — "실패 없이 깔끔하게 통과"하는 것 자체가 데모 포인트
- 만약 실패 복구 경로도 보여주고 싶다면, 데모 전에 src/ 파일 하나를 의도적으로 깨뜨린 후 프롬프트 실행

---

지금 PHASE 1부터 시작하세요.
