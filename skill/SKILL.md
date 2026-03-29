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

# Chaos Lab — Pre-flight Check

AI 에이전트 실행 전 환경(하드웨어, 네트워크, 인증, 런타임 등 11개 카테고리, 100개 항목)을 자동 검증합니다.

## 실행 방법

```bash
node dist/cli/index.js --quick "<작업 설명>"
```

## 파이프라인

1. **Step 1 — Seed 생성**: 자연어 프롬프트에서 외부 서비스, 의존성, 소요시간 추출
2. **Step 2 — 체크리스트 생성**: Layer 1(마스터) + Layer 2(커스텀) 병합, Risk Score 정렬
3. **Step 3 — Shell 검증**: execa로 각 항목 실행 (30초 타임아웃)
4. **Step 4 — Auto-fix**: CRITICAL 항목 동적 분석 + 자동 수정
5. **Step 5 — 리포트**: JSON/Markdown/HTML 리포트 생성 + 브라우저 자동 오픈
