#!/bin/bash
# 시나리오 1: 크롤링 + Notion 저장
# 외부 서비스 다수 감지 + 오탐 방지 검증
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
echo " 시나리오 1: 크롤링 + Notion 저장 검증"
echo "============================================"

# 0. 빌드 확인
echo ""
echo "[0/6] npm run build"
if npm run build --silent 2>&1; then
  log_pass "npm run build 성공"
else
  log_fail "npm run build 실패"
  echo ""
  echo "빌드 실패 — 검증 중단"
  exit 1
fi

# 1. 시나리오 실행
echo ""
echo "[1/6] 시나리오 1 실행"
node dist/cli/index.js --quick "Google Sheets에 정리된 500개 스타트업 웹사이트를 밤새 크롤링해서 회사명, 산업군, 최근 투자 여부를 정리하고 Notion 데이터베이스에 저장해줘" || true

# 가장 최근 run 디렉토리 찾기
RUN_DIR=$(ls -td .chaos-lab/run-* 2>/dev/null | head -1)
if [ -z "$RUN_DIR" ]; then
  log_fail ".chaos-lab/run-* 디렉토리가 없음"
  echo ""
  echo "실행 결과 없음 — 검증 중단"
  exit 1
fi
echo "  📁 RUN_DIR: $RUN_DIR"

# 2. 출력 파일 6종 존재 확인
echo ""
echo "[2/6] 출력 파일 6종 확인"
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

# 3. seed.json: 서비스 3개 이상 감지
echo ""
echo "[3/6] seed.json 서비스 감지 확인"
if [ -f "$RUN_DIR/seed.json" ]; then
  SERVICE_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const seed = JSON.parse(readFileSync('$RUN_DIR/seed.json', 'utf-8'));
    const services = seed.external_services || [];
    console.log(services.length);
  " 2>/dev/null || echo "0")

  if [ "$SERVICE_COUNT" -ge 3 ] 2>/dev/null; then
    log_pass "서비스 ${SERVICE_COUNT}개 감지 (≥3)"
  else
    log_fail "서비스 ${SERVICE_COUNT}개 감지 (최소 3개 필요)"
  fi

  # 감지된 서비스 목록 출력
  node --input-type=module -e "
    import { readFileSync } from 'fs';
    const seed = JSON.parse(readFileSync('$RUN_DIR/seed.json', 'utf-8'));
    const services = seed.external_services || [];
    services.forEach(s => console.log('    → ' + (s.name || s)));
  " 2>/dev/null || true
else
  log_fail "seed.json 없어서 서비스 감지 확인 불가"
fi

# 4. checklist.json: Docker/DB 항목 미포함
echo ""
echo "[4/6] checklist.json Docker/DB 오탐 확인"
if [ -f "$RUN_DIR/checklist.json" ]; then
  DOCKER_DB_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const cl = JSON.parse(readFileSync('$RUN_DIR/checklist.json', 'utf-8'));
    const items = cl.items || cl || [];
    const bad = items.filter(i => {
      const id = (i.item_id || '').toUpperCase();
      return id.startsWith('DB-') || id.includes('DOCKER');
    });
    bad.forEach(i => console.error('    오탐: ' + i.item_id));
    console.log(bad.length);
  " 2>/dev/null || echo "-1")

  if [ "$DOCKER_DB_COUNT" = "0" ]; then
    log_pass "Docker/DB 항목 0개 (오탐 없음)"
  else
    log_fail "Docker/DB 항목 ${DOCKER_DB_COUNT}개 포함됨 (0이어야 함)"
  fi

  # 체크리스트 바운드 확인 (10~50)
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
else
  log_fail "checklist.json 없어서 오탐 확인 불가"
fi

# 5. report.json: Action Plan에 "수동 확인이 필요합니다" 없음
echo ""
echo "[5/6] report.json Action Plan 검증"
if [ -f "$RUN_DIR/report.json" ]; then
  MANUAL_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const report = JSON.parse(readFileSync('$RUN_DIR/report.json', 'utf-8'));
    const actions = report.action_plan || report.actions || [];
    const bad = actions.filter(a => {
      const desc = JSON.stringify(a).toLowerCase();
      return desc.includes('수동 확인이 필요합니다') || desc.includes('수동으로 확인');
    });
    bad.forEach(a => console.error('    금지 문구: ' + JSON.stringify(a).substring(0, 100)));
    console.log(bad.length);
  " 2>/dev/null || echo "-1")

  if [ "$MANUAL_COUNT" = "0" ]; then
    log_pass "Action Plan에 '수동 확인' 문구 없음"
  else
    log_fail "Action Plan에 '수동 확인' 문구 ${MANUAL_COUNT}건 발견"
  fi

  # Action Plan에 구체적 명령어 포함 확인
  ACTION_COUNT=$(node --input-type=module -e "
    import { readFileSync } from 'fs';
    const report = JSON.parse(readFileSync('$RUN_DIR/report.json', 'utf-8'));
    const actions = report.action_plan || report.actions || [];
    console.log(actions.length);
  " 2>/dev/null || echo "0")

  if [ "$ACTION_COUNT" -ge 1 ] 2>/dev/null; then
    log_pass "Action Plan ${ACTION_COUNT}건 존재"
  else
    log_fail "Action Plan 0건 (최소 1건 필요)"
  fi
else
  log_fail "report.json 없어서 Action Plan 확인 불가"
fi

# 6. report.html 크기 확인
echo ""
echo "[6/6] report.html 크기 확인"
if [ -f "$RUN_DIR/report.html" ]; then
  HTML_SIZE=$(wc -c < "$RUN_DIR/report.html")
  if [ "$HTML_SIZE" -gt 1000 ]; then
    log_pass "report.html ${HTML_SIZE} bytes (>1KB)"
  else
    log_fail "report.html ${HTML_SIZE} bytes (너무 작음, >1KB 필요)"
  fi
else
  log_fail "report.html 없음"
fi

# 결과 요약
echo ""
echo "============================================"
echo " 시나리오 1 결과: PASS=${PASS} / FAIL=${FAIL}"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n실패 항목:${ERRORS}"
  echo ""
  echo "❌ SCENARIO 1 FAILED"
  exit 1
else
  echo ""
  echo "✅ SCENARIO 1 ALL PASSED"
  exit 0
fi
