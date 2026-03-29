#!/usr/bin/env node
// ── Chaos Lab CLI — Main Orchestrator ──

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import ora from 'ora';
import { generateSeed } from '../step1-refine/local-seed-generator.js';
import { generateChecklist } from '../step2-checklist/local-checklist-generator.js';
import { runVerification } from '../step3-verify/orchestrator.js';
import { classifyFix, executeAutoFix } from '../step4-report/auto-fix.js';
import { calculateVerdict } from '../step4-report/verdict.js';
import {
  generateActionPlan,
  formatTerminalReport,
  generateMarkdownReport,
  generateJsonReport,
} from '../step4-report/report-generator.js';
import { generateHtmlReport } from '../web/html-generator.js';
import type { Report, AutoFixResult } from '../core/types.js';

async function main() {
  process.on('SIGINT', () => {
    console.error('\n중단되었습니다 (SIGINT).');
    process.exit(130);
  });

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`chaos-lab — AI 에이전트 Pre-flight Check

사용법: chaos-lab [옵션] "<작업 설명>"

옵션:
  --quick    Quick Mode (Auto-fix 실행 건너뜀)
  --deep     Deep Mode (AI 분석으로 고품질 Seed 생성, Claude CLI 필요)
  --help     이 도움말 표시
  --version  버전 표시

예시:
  chaos-lab "밤새 크롤링 돌려도 되나?"
  chaos-lab --quick "AWS Lambda 배포 파이프라인"
  chaos-lab --deep "Google Sheets 데이터를 Notion에 동기화"`);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgPath = join(__dirname, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    console.log(pkg.version);
    process.exit(0);
  }

  const isQuickMode = args.includes('--quick');
  const isDeepMode = args.includes('--deep');
  const prompt = args.filter(a => a !== '--quick' && a !== '--deep').join(' ').trim();

  if (!prompt) {
    console.error(chalk.red('사용법: chaos-lab [--quick] [--deep] "<작업 설명>"'));
    console.error(chalk.gray('예시: chaos-lab --quick "Google Sheets에 정리된 500개 스타트업 웹사이트를 밤새 크롤링"'));
    process.exit(1);
  }

  const startTime = Date.now();

  // Create run directory
  const now = new Date();
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const timestamp = now.toISOString().replace(/[-:T]/g, '').replace(/\..+/, '').replace(/(\d{8})(\d{6})/, '$1-$2') + '-' + ms;
  const runDir = join(process.cwd(), '.chaos-lab', `run-${timestamp}`);
  mkdirSync(runDir, { recursive: true });

  console.log(chalk.bold('\n🧪 Chaos Lab — Pre-flight Check\n'));
  console.log(chalk.gray(`작업: ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}`));
  if (isDeepMode) {
    console.log(chalk.cyan(`모드: Deep Mode (AI 분석)`));
  } else {
    console.log(chalk.gray(`모드: Quick Mode (키워드 매칭)`));
  }
  console.log(chalk.gray(`출력: ${runDir}\n`));

  // ── Step 1: Seed Generation ──
  const seedSpinner = ora('Step 1: Seed 생성 중...').start();
  let seed;
  if (isDeepMode) {
    const { generateDeepSeed } = await import('../step1-refine/deep-seed-generator.js');
    seed = await generateDeepSeed(prompt);
  } else {
    seed = generateSeed(prompt);
  }
  const serviceCount = seed.external_services.length;
  const serviceNames = seed.external_services.map(s => s.name).join(', ');
  seedSpinner.succeed(
    `[Step1] 서비스 ${serviceCount}개 감지${serviceCount > 0 ? `: ${serviceNames}` : ''}`
  );

  // Save seed.json
  writeFileSync(join(runDir, 'seed.json'), JSON.stringify(seed, null, 2), 'utf-8');

  // ── Step 2: Checklist Generation ──
  const checklistSpinner = ora('Step 2: 체크리스트 생성 중...').start();
  const checklist = generateChecklist(seed);

  const layer1Count = checklist.filter(c => c.source === 'layer1').length;
  const layer2Count = checklist.filter(c => c.source === 'layer2').length;

  // Determine excluded categories
  const excludedInfo: string[] = [];
  const hasDocker = seed.external_services.some(s => s.name.toLowerCase().includes('docker'));
  const hasDB = seed.external_services.some(s =>
    /postgres|mysql|mongo|redis|sqlite|supabase/i.test(s.name)
  );
  if (!hasDocker) {
    const dockerItems = checklist.filter(c => c.item_id === 'RT-11');
    if (dockerItems.length === 0) excludedInfo.push('Docker');
  }
  if (!hasDB) {
    const dbItems = checklist.filter(c => c.category === 'DB');
    if (dbItems.length === 0) excludedInfo.push('DB');
  }

  const excludedStr = excludedInfo.length > 0 ? `, ${excludedInfo.join('/')} 항목 제외됨` : '';
  checklistSpinner.succeed(
    `[Step2] 체크리스트 ${checklist.length}개 생성 (Layer1: ${layer1Count}, Layer2: ${layer2Count})${excludedStr}`
  );

  // Save checklist.json
  writeFileSync(join(runDir, 'checklist.json'), JSON.stringify(checklist, null, 2), 'utf-8');

  // ── Step 3: Shell Verification ──
  console.log(chalk.bold('\n📋 Step 3: 검증 실행\n'));
  const results = await runVerification(checklist);

  // Save results.json
  writeFileSync(join(runDir, 'results.json'), JSON.stringify(results, null, 2), 'utf-8');

  // ── Step 4: Auto-fix (Quick mode: skip user approval, classify only) ──
  const failedResults = results.filter(r => r.status === 'FAILED');
  const autoFixResults: AutoFixResult[] = [];

  if (failedResults.length > 0) {
    const fixSpinner = ora('Step 4: Auto-fix 분석 중...').start();

    let autoFixable = 0;
    let manualOnly = 0;

    for (const result of failedResults) {
      const classification = classifyFix(result);
      if (classification.fix_type === 'auto-fixable') {
        autoFixable++;
        // In quick mode, skip execution (no user approval)
        autoFixResults.push({
          item_id: result.item_id,
          fix_command: classification.fix_command,
          fix_type: 'auto-fixable',
          success: false,
          message: 'Quick Mode — 자동 수정 건너뜀 (사용자 승인 대기)',
        });
      } else {
        manualOnly++;
        autoFixResults.push({
          item_id: result.item_id,
          fix_command: classification.fix_command,
          fix_type: 'manual-only',
          success: false,
          message: classification.reason,
        });
      }
    }

    fixSpinner.succeed(
      `[Step4] Auto-fix 분석 완료 — 자동 수정 가능 ${autoFixable}건, 수동 조치 ${manualOnly}건`
    );
  }

  // ── Step 5: Verdict + Report ──
  const verdict = calculateVerdict(results);
  const actionPlan = generateActionPlan(results, seed);

  const report: Report = {
    timestamp: now.toISOString(),
    run_dir: runDir,
    seed,
    checklist_count: checklist.length,
    results,
    verdict,
    action_plan: actionPlan,
    auto_fix_results: autoFixResults,
    execution_time_ms: Date.now() - startTime,
  };

  // Save reports
  writeFileSync(join(runDir, 'report.json'), generateJsonReport(report), 'utf-8');

  const mdContent = generateMarkdownReport(report);
  const mdFilename = `chaos-lab-report-${timestamp}.md`;
  writeFileSync(join(runDir, mdFilename), mdContent, 'utf-8');

  // Generate HTML report
  generateHtmlReport(report, checklist, seed, join(runDir, 'report.html'));

  // Terminal output
  formatTerminalReport(report);

  const criticalCount = verdict.failed_count;
  const actionCount = actionPlan.length;
  console.log(
    `[Step5] Verdict: ${verdict.status.replace(/_/g, ' ')} (CRITICAL ${criticalCount}건), 액션 플랜 ${actionCount}건 생성`
  );

  // List output files
  console.log(chalk.bold('\n📁 출력 파일:'));
  console.log(`  ${chalk.green('✓')} seed.json`);
  console.log(`  ${chalk.green('✓')} checklist.json`);
  console.log(`  ${chalk.green('✓')} results.json`);
  console.log(`  ${chalk.green('✓')} report.json`);
  console.log(`  ${chalk.green('✓')} report.html`);
  console.log(`  ${chalk.green('✓')} ${mdFilename}`);

  // Auto-open browser (non-quick mode)
  if (!isQuickMode) {
    try {
      const htmlPath = join(runDir, 'report.html');
      const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
      execSync(`${openCmd} "${htmlPath}"`, { stdio: 'ignore' });
      console.log(chalk.cyan('\n🌐 브라우저에서 리포트를 열었습니다.'));
    } catch {
      // Ignore browser open errors
    }
  }

  console.log('');

  if (verdict.status === 'NOT_READY') {
    process.exit(2);
  }
}

main().catch(err => {
  console.error(chalk.red('에러 발생:'), err instanceof Error ? err.message : String(err));
  process.exit(1);
});
