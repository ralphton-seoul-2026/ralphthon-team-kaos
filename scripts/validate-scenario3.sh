#!/bin/bash
# 시나리오 3: 단순 Python 스크립트
# 외부 서비스 0개 — 오탐 방지 테스트 (negative test)
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
echo " 시나리오 3: 단순 Python 스크립트 검증"
echo "============================================"

# 이전 run 디렉토리 기록
BEFORE_RUNS=$(ls -d .chaos-lab/run-* 2>/dev/null | sort || true)

# 1. 시나리오 실행
echo ""
echo "[1/5] 시나리오 3 실행"
node dist/cli/index.js --quick "Python으로 CSV 파일 읽어서 데이터 정리하는 스크립트 만들어줘" || true

# 새로 생성된 run 디렉토리 찾기
AFTER_RUNS=$(ls -d .chaos-lab/run-* 2>/dev/null | sort || true)
RUN_DIR=$(comm -13 <(echo "$BEFORE_RUNS") <(echo "$AFTER_RUNS") | tail -1)

if [ -z "$RUN_DIR" ]; then
  # fallback: 가장 최근 디렉토리
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

# 3. seed.json: 외부 서비스 0개 (단순 Python이므로)
echo ""
echo "[3/5] seed.json 서비스 감지 확인 (0개여야 함)"
if [ -f "$RUN_DIR/seed.json" ]; then
  SERVICE_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const seed = JSON.parse(readFileSync('$RUN_DIR/seed.json', 'utf-8'));
    const services = seed.external_services || [];
    services.forEach(s => console.error('    오탐 서비스: ' + (s.name || s)));
    console.log(services.length);
  " 2>/dev/null || echo "-1")

  if [ "$SERVICE_COUNT" = "0" ]; then
    log_pass "서비스 0개 (오탐 없음)"
  else
    log_fail "서비스 ${SERVICE_COUNT}개 감지됨 (0이어야 함 — 단순 Python 작업)"
  fi
else
  log_fail "seed.json 없음"
fi

# 4. checklist.json: Docker/DB/AUTH(외부서비스용) 항목 최소화
echo ""
echo "[4/5] checklist.json 항목 검증"
if [ -f "$RUN_DIR/checklist.json" ]; then
  # Docker 항목 없어야 함
  DOCKER_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const cl = JSON.parse(readFileSync('$RUN_DIR/checklist.json', 'utf-8'));
    const items = cl.items || cl || [];
    const bad = items.filter(i => (i.item_id || '').toUpperCase().includes('DOCKER'));
    console.log(bad.length);
  " 2>/dev/null || echo "-1")

  if [ "$DOCKER_COUNT" = "0" ]; then
    log_pass "Docker 항목 0개"
  else
    log_fail "Docker 항목 ${DOCKER_COUNT}개 (단순 Python에 Docker 불필요)"
  fi

  # 체크리스트 바운드 10~50
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

  # 단순 작업이므로 20개 이하 권장
  if [ "$ITEM_COUNT" -le 25 ] 2>/dev/null; then
    log_pass "체크리스트 ${ITEM_COUNT}개 (단순 작업 ≤25 권장)"
  else
    log_fail "체크리스트 ${ITEM_COUNT}개 (단순 Python 작업인데 25개 초과)"
  fi
else
  log_fail "checklist.json 없음"
fi

# 5. report.json: Action Plan에 금지 문구 없음
echo ""
echo "[5/5] report.json Action Plan 검증"
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
echo " 시나리오 3 결과: PASS=${PASS} / FAIL=${FAIL}"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n실패 항목:${ERRORS}"
  echo ""
  echo "❌ SCENARIO 3 FAILED"
  exit 1
else
  echo ""
  echo "✅ SCENARIO 3 ALL PASSED"
  exit 0
fi
