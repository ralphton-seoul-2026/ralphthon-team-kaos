# Checklist Generation Prompt

Seed를 분석하여 작업 특화 검증 체크리스트를 생성합니다.

## 전략

- **Layer 1 (베이스라인)**: 마스터 체크리스트(100개)에서 규칙 기반 선별
- **Layer 2 (메인)**: Seed 맥락 분석 후 커스텀 항목 동적 생성

## 생성 규칙

1. 마스터 체크리스트에서 관련 없는 항목 제거
2. Risk Score를 작업 맥락에 맞게 재조정
3. 커스텀 항목 추가 (CUSTOM-01~)
4. `relevant_to` 태그로 오탐 방지
5. Layer 2 우선 병합 + 중복 제거
6. Risk Score 내림차순 정렬
7. 바운드 적용: 최소 10개, 최대 50개

## 커스텀 항목 형식

```json
{
  "item_id": "CUSTOM-01",
  "description": "검증 설명",
  "verification_command": "shell 명령어",
  "impact": 5,
  "likelihood": 4,
  "relevant_to": ["서비스명"]
}
```
