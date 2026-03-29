# Result Interpretation Prompt

Shell 검증 결과를 해석하여 상태를 판정하고 액셔너블 리포트를 생성합니다.

## 상태 판정 규칙

| 출력 키워드 | 판정 |
|------------|------|
| `not found`, `not installed` | FAILED |
| `not running`, `not available` | FAILED |
| `expired`, `만료` | FAILED |
| `SKIPPED:` 접두사 | SKIPPED |
| `denied`, `permission` | WARNING |
| `WARNING:` 접두사 | WARNING |
| exit code 0 + 정상 출력 | PASSED |

## Verdict 판정

| 조건 | Verdict |
|------|---------|
| CRITICAL = 0, WARNING ≤ 3 | ✅ READY |
| CRITICAL = 0, WARNING > 3 | 🟡 READY WITH CAUTION |
| CRITICAL ≥ 1 | ❌ NOT READY |

## 액셔너블 리포트 원칙

- 각 FAILED 항목에 "왜 이 검증이 필요한지" (Seed 컨텍스트 연결)
- 각 FAILED 항목에 "구체적 해결 명령어" 포함
- "수동 확인이 필요합니다" 대신 실행 가능한 명령어 제시
