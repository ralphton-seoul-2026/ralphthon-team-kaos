# Seed Generation Prompt

사용자의 자연어 프롬프트를 분석하여 에이전트 실행에 필요한 환경 의존성을 구조화된 Seed로 추출합니다.

## 분석 항목

1. **외부 서비스 식별**: API, 데이터베이스, 웹사이트 등
2. **인증 요구사항**: OAuth, API Key, Bearer Token, MCP 등
3. **로컬 의존성**: Python, Node.js, Docker, 패키지 등
4. **소요시간 추정**: 키워드 기반 (밤새 → 8~24시간)
5. **실패 영향**: 각 서비스 실패 시 데이터 유실 범위
6. **환경 가정**: 인터넷 연결, 슬립 모드, 디스크 공간 등

## 출력 형식

```json
{
  "task_summary": "작업 요약",
  "ambiguity_score": 0.15,
  "external_services": [{"name": "서비스명", "auth_type": "인증타입", "operations": ["op"]}],
  "local_dependencies": ["Python >= 3.10"],
  "estimated_duration": "2~4시간",
  "failure_impact": ["실패 시나리오"],
  "environment_assumptions": ["가정 사항"]
}
```
