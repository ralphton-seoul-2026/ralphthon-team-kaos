#!/bin/bash
# 전체 시나리오 검증 (Loop 종료 게이트)
# 모든 시나리오가 통과해야만 exit 0
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

TOTAL_PASS=0
TOTAL_FAIL=0
FAILED_SCENARIOS=""

echo "╔══════════════════════════════════════════════╗"
echo "║   Chaos Lab — 전체 시나리오 검증 게이트      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 0. 빌드 먼저
echo "━━━ [사전] npm run build ━━━"
if ! npm run build --silent 2>&1; then
  echo ""
  echo "❌ 빌드 실패 — 검증 중단"
  echo "npm run build를 먼저 성공시켜야 합니다."
  exit 1
fi
echo "✅ 빌드 성공"
echo ""

# 1. 시나리오 1: 크롤링 + Notion (외부 서비스 다수)
echo "━━━ 시나리오 1: 크롤링 + Notion ━━━"
if bash "$SCRIPT_DIR/validate-scenario1.sh"; then
  TOTAL_PASS=$((TOTAL_PASS+1))
else
  TOTAL_FAIL=$((TOTAL_FAIL+1))
  FAILED_SCENARIOS="${FAILED_SCENARIOS}\n  - 시나리오 1 (크롤링+Notion)"
fi
echo ""

# 2. 시나리오 3: 단순 Python (서비스 0개 — negative test)
echo "━━━ 시나리오 3: 단순 Python ━━━"
if bash "$SCRIPT_DIR/validate-scenario3.sh"; then
  TOTAL_PASS=$((TOTAL_PASS+1))
else
  TOTAL_FAIL=$((TOTAL_FAIL+1))
  FAILED_SCENARIOS="${FAILED_SCENARIOS}\n  - 시나리오 3 (단순 Python)"
fi
echo ""

# 3. 시나리오 23: 최소 입력 (엣지 케이스)
echo "━━━ 시나리오 23: 최소 입력 ━━━"
if bash "$SCRIPT_DIR/validate-scenario23.sh"; then
  TOTAL_PASS=$((TOTAL_PASS+1))
else
  TOTAL_FAIL=$((TOTAL_FAIL+1))
  FAILED_SCENARIOS="${FAILED_SCENARIOS}\n  - 시나리오 23 (최소 입력)"
fi
echo ""

# 최종 결과
echo "╔══════════════════════════════════════════════╗"
echo "║   최종 결과: PASS=${TOTAL_PASS} / FAIL=${TOTAL_FAIL} (총 3개 시나리오)  ║"
echo "╚══════════════════════════════════════════════╝"

if [ "$TOTAL_FAIL" -gt 0 ]; then
  echo -e "\n실패 시나리오:${FAILED_SCENARIOS}"
  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║   ❌ LOOP 종료 불가 — 실패 시나리오 수정 필요  ║"
  echo "╚══════════════════════════════════════════════╝"
  exit 1
else
  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║   ✅ 모든 시나리오 통과 — LOOP 종료 가능      ║"
  echo "╚══════════════════════════════════════════════╝"
  exit 0
fi
