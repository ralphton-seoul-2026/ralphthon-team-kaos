#!/bin/bash
# 시나리오 23: 빈 프롬프트 (최소 입력) — 엣지 케이스
# ambiguity 높고, 서비스 0개, 체크리스트 최소 바운드
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

PASS=0
FAIL=0
ERRORS=""

log_pass() { PASS=$((PASS+1)); echo "  ✅ PASS: $1"; }
log_fail() { FAIL=$((FAIL+1)); ERRORS="${ERRORS}\n  ❌ FAIL: $1"; echo "  ❌ FAIL: $1"; }

echo "============================================"
echo " 시나리오 23: 최소 입력 (엣지 케이스) 검증"
echo "============================================"

# 이전 run 디렉토리 기록
BEFORE_RUNS=$(ls -d .chaos-lab/run-* 2>/dev/null | sort || true)

# 1. 시나리오 실행
echo ""
echo "[1/5] 시나리오 23 실행"
node dist/cli/index.js --quick "간단한 스크립트 실행" || true

# 새로 생성된 run 디렉토리 찾기
AFTER_RUNS=$(ls -d .chaos-lab/run-* 2>/dev/null | sort || true)
RUN_DIR=$(comm -13 <(echo "$BEFORE_RUNS") <(echo "$AFTER_RUNS") | tail -1)

if [ -z "$RUN_DIR" ]; then
  RUN_DIR=$(ls -td .chaos-lab/run-* 2>/dev/null | head -1)
fi

if [ -z "$RUN_DIR" ]; then
  log_fail ".chaos-lab/run-* 디렉토리가 없음"
  echo "실행 결과 없음 — 검증 중단"
  exit 1
fi
echo "  📁 RUN_DIR: $RUN_DIR"

# 2. 출력 파일 6종 존재 확인
echo ""
echo "[2/5] 출력 파일 6종 확인"
for f in seed.json checklist.json results.json report.json report.html; do
  if [ -f "$RUN_DIR/$f" ]; then
    log_pass "$f 존재"
  else
    log_fail "$f 없음"
  fi
done

if ls "$RUN_DIR"/chaos-lab-report-*.md >/dev/null 2>&1; then
  log_pass "chaos-lab-report-*.md 존재"
else
  log_fail "chaos-lab-report-*.md 없음"
fi

# 3. seed.json: 서비스 0개, ambiguity_score 높음
echo ""
echo "[3/5] seed.json 검증 (서비스 0개, 높은 ambiguity)"
if [ -f "$RUN_DIR/seed.json" ]; then
  SERVICE_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const seed = JSON.parse(readFileSync('$RUN_DIR/seed.json', 'utf-8'));
    const services = seed.external_services || [];
    services.forEach(s => console.error('    오탐 서비스: ' + (s.name || s)));
    console.log(services.length);
  " 2>/dev/null || echo "-1")

  if [ "$SERVICE_COUNT" = "0" ]; then
    log_pass "서비스 0개 (정확)"
  else
    log_fail "서비스 ${SERVICE_COUNT}개 (0이어야 함 — 최소 입력)"
  fi

  # ambiguity_score 확인 (≥0.5)
  AMBIGUITY_OK=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const seed = JSON.parse(readFileSync('$RUN_DIR/seed.json', 'utf-8'));
    const score = seed.ambiguity_score ?? 0;
    console.error('    ambiguity_score: ' + score);
    console.log(score >= 0.5 ? 'yes' : 'no');
  " 2>/dev/null || echo "no")

  if [ "$AMBIGUITY_OK" = "yes" ]; then
    log_pass "ambiguity_score ≥ 0.5 (모호한 입력 반영)"
  else
    log_fail "ambiguity_score < 0.5 (최소 입력인데 낮음)"
  fi
else
  log_fail "seed.json 없음"
fi

# 4. checklist.json: 바운드 하한 (정확히 10개 근처), 불필요 카테고리 미포함
echo ""
echo "[4/5] checklist.json 바운드 및 카테고리 확인"
if [ -f "$RUN_DIR/checklist.json" ]; then
  ITEM_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const cl = JSON.parse(readFileSync('$RUN_DIR/checklist.json', 'utf-8'));
    const items = cl.items || cl || [];
    console.log(items.length);
  " 2>/dev/null || echo "0")

  if [ "$ITEM_COUNT" -ge 10 ] && [ "$ITEM_COUNT" -le 50 ]; then
    log_pass "체크리스트 ${ITEM_COUNT}개 (10~50 범위)"
  else
    log_fail "체크리스트 ${ITEM_COUNT}개 (10~50 범위 벗어남)"
  fi

  # 최소 입력이므로 20개 이하 권장
  if [ "$ITEM_COUNT" -le 20 ] 2>/dev/null; then
    log_pass "체크리스트 ${ITEM_COUNT}개 (최소 입력 ≤20 권장)"
  else
    log_fail "체크리스트 ${ITEM_COUNT}개 (최소 입력인데 20개 초과)"
  fi

  # DB/Docker/COST/HW 미포함 (단순 작업)
  HEAVY_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const cl = JSON.parse(readFileSync('$RUN_DIR/checklist.json', 'utf-8'));
    const items = cl.items || cl || [];
    const heavy = items.filter(i => {
      const id = (i.item_id || '').toUpperCase();
      return id.startsWith('DB-') || id.includes('DOCKER') || id.startsWith('COST-') || id.startsWith('HW-');
    });
    heavy.forEach(h => console.error('    불필요 항목: ' + h.item_id));
    console.log(heavy.length);
  " 2>/dev/null || echo "-1")

  if [ "$HEAVY_COUNT" = "0" ]; then
    log_pass "DB/Docker/COST/HW 항목 0개 (단순 작업)"
  else
    log_fail "DB/Docker/COST/HW 항목 ${HEAVY_COUNT}개 (단순 작업에 불필요)"
  fi
else
  log_fail "checklist.json 없음"
fi

# 5. report.json: 기본 검증
echo ""
echo "[5/5] report.json 기본 검증"
if [ -f "$RUN_DIR/report.json" ]; then
  MANUAL_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const report = JSON.parse(readFileSync('$RUN_DIR/report.json', 'utf-8'));
    const actions = report.action_plan || report.actions || [];
    const bad = actions.filter(a => {
      const desc = JSON.stringify(a).toLowerCase();
      return desc.includes('수동 확인이 필요합니다') || desc.includes('수동으로 확인');
    });
    console.log(bad.length);
  " 2>/dev/null || echo "-1")

  if [ "$MANUAL_COUNT" = "0" ]; then
    log_pass "Action Plan에 '수동 확인' 문구 없음"
  else
    log_fail "Action Plan에 '수동 확인' 문구 ${MANUAL_COUNT}건"
  fi
else
  log_fail "report.json 없음"
fi

# 결과 요약
echo ""
echo "============================================"
echo " 시나리오 23 결과: PASS=${PASS} / FAIL=${FAIL}"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n실패 항목:${ERRORS}"
  echo ""
  echo "❌ SCENARIO 23 FAILED"
  exit 1
else
  echo ""
  echo "✅ SCENARIO 23 ALL PASSED"
  exit 0
fi
