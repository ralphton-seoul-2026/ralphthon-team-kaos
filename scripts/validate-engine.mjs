#!/usr/bin/env node
/**
 * Chaos Lab — 시나리오 검증 엔진
 *
 * Usage:
 *   node scripts/validate-engine.mjs                  # 전체 30개 시나리오
 *   node scripts/validate-engine.mjs --scenario 1     # 특정 시나리오
 *   node scripts/validate-engine.mjs --scenario 1,3,23  # 복수 시나리오
 *   node scripts/validate-engine.mjs --build-only     # 빌드만 확인
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '..');
process.chdir(PROJECT_DIR);

// ── Args ──
const args = process.argv.slice(2);
const scenarioArg = args.find((_, i, a) => a[i - 1] === '--scenario');
const buildOnly = args.includes('--build-only');
const requestedIds = scenarioArg
  ? scenarioArg.split(',').map(Number)
  : null;

// ── Load scenarios ──
const scenarios = JSON.parse(readFileSync(resolve(__dirname, 'scenarios.json'), 'utf-8'));
const toRun = requestedIds
  ? scenarios.filter(s => requestedIds.includes(s.id))
  : scenarios;

// ── Helpers ──
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(msg) { process.stdout.write(msg + '\n'); }
function logPass(msg) { log(`  ${GREEN}✅ PASS:${RESET} ${msg}`); }
function logFail(msg) { log(`  ${RED}❌ FAIL:${RESET} ${msg}`); }

function findLatestRunDir(beforeDirs) {
  const chaosDir = resolve(PROJECT_DIR, '.chaos-lab');
  if (!existsSync(chaosDir)) return null;
  const allDirs = readdirSync(chaosDir)
    .filter(d => d.startsWith('run-'))
    .map(d => resolve(chaosDir, d))
    .filter(d => statSync(d).isDirectory())
    .sort()
    .reverse();
  // Return the newest one not in beforeDirs
  for (const d of allDirs) {
    if (!beforeDirs.includes(d)) return d;
  }
  return allDirs[0] || null;
}

function getRunDirsBefore() {
  const chaosDir = resolve(PROJECT_DIR, '.chaos-lab');
  if (!existsSync(chaosDir)) return [];
  return readdirSync(chaosDir)
    .filter(d => d.startsWith('run-'))
    .map(d => resolve(chaosDir, d));
}

function readJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Build check ──
log(`${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
log(`${BOLD}║  Chaos Lab — 전체 시나리오 검증 게이트 (${toRun.length}개)     ║${RESET}`);
log(`${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
log('');

log(`${CYAN}━━━ [사전] npm run build ━━━${RESET}`);
try {
  execSync('npm run build', { cwd: PROJECT_DIR, stdio: 'pipe' });
  log(`${GREEN}✅ 빌드 성공${RESET}`);
} catch (e) {
  log(`${RED}❌ 빌드 실패 — 검증 중단${RESET}`);
  const stderr = e.stderr?.toString() || '';
  if (stderr) log(stderr.slice(0, 2000));
  process.exit(1);
}

if (buildOnly) {
  log('\n빌드 확인 완료.');
  process.exit(0);
}

// ── Run each scenario ──
let totalPass = 0;
let totalFail = 0;
const failedScenarios = [];

for (const scenario of toRun) {
  log('');
  log(`${CYAN}━━━ 시나리오 ${scenario.id}: ${scenario.name} ━━━${RESET}`);

  let scenarioPass = 0;
  let scenarioFails = [];

  const pass = (msg) => { scenarioPass++; logPass(msg); };
  const fail = (msg) => { scenarioFails.push(msg); logFail(msg); };

  // 1. Execute scenario
  const beforeDirs = getRunDirsBefore();
  try {
    execSync(
      `node dist/cli/index.js --quick ${JSON.stringify(scenario.prompt)}`,
      { cwd: PROJECT_DIR, stdio: 'pipe', timeout: 120000 }
    );
  } catch {
    // CLI may exit non-zero (NOT READY verdict), that's OK
  }

  const runDir = findLatestRunDir(beforeDirs);
  if (!runDir) {
    fail('run 디렉토리 생성 안 됨');
    totalFail++;
    failedScenarios.push(scenario);
    continue;
  }
  log(`  📁 ${runDir}`);

  // 2. Check 6 output files
  const requiredFiles = ['seed.json', 'checklist.json', 'results.json', 'report.json', 'report.html'];
  for (const f of requiredFiles) {
    const fpath = resolve(runDir, f);
    if (existsSync(fpath) && statSync(fpath).size > 0) {
      pass(`${f} 존재`);
    } else {
      fail(`${f} 없음`);
    }
  }

  // Markdown report
  const mdFiles = existsSync(runDir)
    ? readdirSync(runDir).filter(f => f.startsWith('chaos-lab-report-') && f.endsWith('.md'))
    : [];
  if (mdFiles.length > 0) {
    pass('chaos-lab-report-*.md 존재');
  } else {
    fail('chaos-lab-report-*.md 없음');
  }

  // 3. seed.json: service count
  const seed = readJSON(resolve(runDir, 'seed.json'));
  if (seed) {
    const services = seed.external_services || [];
    const svcCount = services.length;
    const { min, max } = scenario.expectedServices;
    if (svcCount >= min && svcCount <= max) {
      pass(`서비스 ${svcCount}개 (기대: ${min}~${max})`);
    } else {
      fail(`서비스 ${svcCount}개 (기대: ${min}~${max})`);
    }

    // ambiguity check (optional)
    if (scenario.expectedAmbiguity) {
      const amb = seed.ambiguity_score ?? 0;
      const { min: aMin, max: aMax } = scenario.expectedAmbiguity;
      if (amb >= aMin && amb <= aMax) {
        pass(`ambiguity_score ${amb} (기대: ${aMin}~${aMax})`);
      } else {
        fail(`ambiguity_score ${amb} (기대: ${aMin}~${aMax})`);
      }
    }
  } else {
    fail('seed.json 파싱 실패');
  }

  // 4. checklist.json: bounds, forbidden/required categories
  const checklist = readJSON(resolve(runDir, 'checklist.json'));
  if (checklist) {
    const items = checklist.items || checklist || [];
    const itemCount = items.length;
    const { min: cMin, max: cMax } = scenario.checklistBounds;

    if (itemCount >= cMin && itemCount <= cMax) {
      pass(`체크리스트 ${itemCount}개 (기대: ${cMin}~${cMax})`);
    } else {
      fail(`체크리스트 ${itemCount}개 (기대: ${cMin}~${cMax})`);
    }

    // Forbidden categories
    for (const prefix of (scenario.forbiddenCategories || [])) {
      const found = items.filter(i => {
        const id = (i.item_id || '').toUpperCase();
        return id.startsWith(prefix.toUpperCase()) || id.includes(prefix.toUpperCase());
      });
      if (found.length === 0) {
        pass(`${prefix} 항목 없음 (오탐 방지)`);
      } else {
        fail(`${prefix} 항목 ${found.length}개 포함됨: ${found.map(f => f.item_id).join(', ')}`);
      }
    }

    // Required categories
    for (const prefix of (scenario.requiredCategories || [])) {
      const found = items.filter(i => {
        const id = (i.item_id || '').toUpperCase();
        return id.startsWith(prefix.toUpperCase());
      });
      if (found.length > 0) {
        pass(`${prefix} 카테고리 ${found.length}개 포함`);
      } else {
        // Also check CUSTOM items that might relate
        const customRelated = items.filter(i =>
          (i.item_id || '').startsWith('CUSTOM') &&
          (i.category || '').toUpperCase().includes(prefix.toUpperCase())
        );
        if (customRelated.length > 0) {
          pass(`${prefix} 카테고리 (CUSTOM 포함) ${customRelated.length}개`);
        } else {
          fail(`${prefix} 카테고리 항목 없음 (필수)`);
        }
      }
    }

    // Risk Score descending
    const riskScores = items
      .map(i => (i.impact || 1) * (i.likelihood || 1))
      .filter(s => !isNaN(s));
    if (riskScores.length >= 2) {
      let sorted = true;
      for (let i = 1; i < riskScores.length; i++) {
        if (riskScores[i] > riskScores[i - 1]) { sorted = false; break; }
      }
      if (sorted) {
        pass('Risk Score 내림차순 정렬');
      } else {
        fail('Risk Score 내림차순 아님');
      }
    }
  } else {
    fail('checklist.json 파싱 실패');
  }

  // 5. report.json: no "수동 확인이 필요합니다"
  const report = readJSON(resolve(runDir, 'report.json'));
  if (report) {
    const actions = report.action_plan || report.actions || [];
    const badActions = actions.filter(a => {
      const desc = JSON.stringify(a);
      return desc.includes('수동 확인이 필요합니다') || desc.includes('수동으로 확인');
    });
    if (badActions.length === 0) {
      pass("Action Plan에 '수동 확인' 문구 없음");
    } else {
      fail(`Action Plan에 '수동 확인' 문구 ${badActions.length}건`);
    }
  } else {
    fail('report.json 파싱 실패');
  }

  // 6. report.html size
  const htmlPath = resolve(runDir, 'report.html');
  if (existsSync(htmlPath)) {
    const size = statSync(htmlPath).size;
    if (size > 1000) {
      pass(`report.html ${size} bytes`);
    } else {
      fail(`report.html ${size} bytes (>1KB 필요)`);
    }
  }

  // Scenario summary
  if (scenarioFails.length === 0) {
    log(`  ${GREEN}→ 시나리오 ${scenario.id} 통과 (${scenarioPass} checks)${RESET}`);
    totalPass++;
  } else {
    log(`  ${RED}→ 시나리오 ${scenario.id} 실패 (${scenarioFails.length} fails)${RESET}`);
    totalFail++;
    failedScenarios.push(scenario);
  }
}

// ── Final summary ──
log('');
log(`${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
log(`${BOLD}║  최종 결과: PASS=${totalPass} / FAIL=${totalFail} (총 ${toRun.length}개 시나리오)${RESET}`);
log(`${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);

if (totalFail > 0) {
  log('');
  log(`${RED}실패 시나리오:${RESET}`);
  for (const s of failedScenarios) {
    log(`  ${RED}- 시나리오 ${s.id}: ${s.name}${RESET}`);
  }
  log('');
  log(`${RED}${BOLD}❌ LOOP 종료 불가 — ${totalFail}개 시나리오 실패${RESET}`);
  process.exit(1);
} else {
  log('');
  log(`${GREEN}${BOLD}✅ 모든 시나리오 통과 — LOOP 종료 가능${RESET}`);
  process.exit(0);
}
