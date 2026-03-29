// ── Step 5: Report Generator (JSON, Markdown, Terminal) ──

import chalk from 'chalk';
import type { Report, CheckResult, Seed, ActionPlanItem, AutoFixResult } from '../core/types.js';
import { STATUS_ICONS, CATEGORY_NAMES } from '../core/constants.js';
import { classifyFix } from './auto-fix.js';

export function generateActionPlan(results: CheckResult[], seed: Seed): ActionPlanItem[] {
  const failedAndWarning = results.filter(r => r.status === 'FAILED' || r.status === 'WARNING');

  return failedAndWarning.map(result => {
    const classification = classifyFix(result);

    // Generate contextual reason
    const reason = generateReason(result, seed);

    return {
      item_id: result.item_id,
      description: result.description,
      reason,
      fix_command: classification.fix_command,
      fix_type: classification.fix_type,
    };
  });
}

function generateReason(result: CheckResult, seed: Seed): string {
  const serviceNames = seed.external_services.map(s => s.name);

  // Match result to seed context
  if (result.category === 'AUTH') {
    for (const svc of serviceNames) {
      if (result.description.toLowerCase().includes(svc.toLowerCase().split(' ')[0])) {
        return `이 작업은 ${svc}을(를) 사용하므로 인증이 필요합니다`;
      }
    }
    return '이 작업에 필요한 API 인증이 설정되지 않았습니다';
  }

  if (result.category === 'HW' && /시간|hour|밤새/i.test(seed.estimated_duration)) {
    return `${seed.estimated_duration} 장시간 실행이므로 하드웨어 안정성이 필수입니다`;
  }

  if (result.category === 'NET') {
    return '외부 서비스와의 네트워크 연결이 필요합니다';
  }

  if (result.category === 'RT') {
    return '이 작업에 필요한 런타임/의존성이 누락되었습니다';
  }

  if (result.category === 'DB') {
    return '데이터베이스 연결이 필요한 작업입니다';
  }

  if (result.category === 'OS') {
    return '안정적인 장시간 실행을 위해 OS 설정 최적화가 필요합니다';
  }

  if (result.category === 'BT') {
    return '빌드 및 테스트 환경이 정상적으로 구성되어야 합니다';
  }

  if (result.category === 'GIT') {
    return 'Git 저장소 및 원격 연결이 필요합니다';
  }

  if (result.category === 'COST') {
    return 'API 비용 관리 및 안전장치 확인이 필요합니다';
  }

  if (result.category === 'MON') {
    return '작업 모니터링 및 장애 대응 체계가 필요합니다';
  }

  if (result.category === 'CC') {
    return 'Claude Code 환경이 정상적으로 구성되어야 합니다';
  }

  return `${result.description} — 작업 안정성을 위해 조치가 필요합니다`;
}

export function formatTerminalReport(report: Report): void {
  const { verdict } = report;

  console.log('\n' + '═'.repeat(60));
  console.log(chalk.bold('  🧪 Chaos Lab — Pre-flight Report'));
  console.log('═'.repeat(60));

  // Verdict banner
  const verdictColor = verdict.status === 'READY' ? chalk.bgGreen.black
    : verdict.status === 'READY_WITH_CAUTION' ? chalk.bgYellow.black
    : chalk.bgRed.white;

  console.log('\n' + verdictColor(` ${verdict.summary} `));

  // Status counts
  console.log('\n' + chalk.bold('  상태 요약:'));
  console.log(`  ${STATUS_ICONS.PASSED} PASSED:  ${chalk.green(String(verdict.passed_count))}`);
  console.log(`  ${STATUS_ICONS.FAILED} FAILED:  ${chalk.red(String(verdict.failed_count))}`);
  console.log(`  ${STATUS_ICONS.WARNING} WARNING: ${chalk.yellow(String(verdict.warning_count))}`);
  console.log(`  ${STATUS_ICONS.SKIPPED} SKIPPED: ${chalk.gray(String(verdict.skipped_count))}`);
  console.log(`  ${STATUS_ICONS.HEALED} HEALED:  ${chalk.blue(String(verdict.healed_count))}`);

  // Action plan
  if (report.action_plan.length > 0) {
    console.log('\n' + chalk.bold('  📋 Action Plan:'));
    for (const action of report.action_plan) {
      const typeIcon = action.fix_type === 'auto-fixable' ? '🔧' : '👤';
      console.log(`\n  ${typeIcon} ${chalk.bold(action.item_id)}: ${action.description}`);
      console.log(`     ${chalk.dim('이유:')} ${action.reason}`);
      console.log(`     ${chalk.cyan('조치:')} ${action.fix_command}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  실행 시간: ${(report.execution_time_ms / 1000).toFixed(1)}초`);
  console.log(`  리포트 경로: ${report.run_dir}`);
  console.log('═'.repeat(60) + '\n');
}

export function generateMarkdownReport(report: Report): string {
  const { verdict, seed, results, action_plan } = report;
  const timestamp = report.timestamp;

  let md = `# 🧪 Chaos Lab — Pre-flight Report\n\n`;
  md += `> 생성일: ${timestamp}\n\n`;

  // Verdict
  const verdictEmoji = verdict.status === 'READY' ? '✅' : verdict.status === 'READY_WITH_CAUTION' ? '🟡' : '❌';
  md += `## ${verdictEmoji} Verdict: ${verdict.status.replace(/_/g, ' ')}\n\n`;
  md += `${verdict.summary}\n\n`;

  // Summary table
  md += `## 📊 요약\n\n`;
  md += `| 상태 | 개수 |\n|------|------|\n`;
  md += `| 🟢 PASSED | ${verdict.passed_count} |\n`;
  md += `| 🔴 FAILED | ${verdict.failed_count} |\n`;
  md += `| 🟡 WARNING | ${verdict.warning_count} |\n`;
  md += `| ⚪ SKIPPED | ${verdict.skipped_count} |\n`;
  md += `| 🔧 HEALED | ${verdict.healed_count} |\n\n`;

  // Seed info
  md += `## 🌱 Seed 분석\n\n`;
  md += `- **작업 요약**: ${seed.task_summary}\n`;
  md += `- **모호도**: ${seed.ambiguity_score}\n`;
  md += `- **예상 소요시간**: ${seed.estimated_duration}\n`;
  md += `- **외부 서비스**: ${seed.external_services.map(s => s.name).join(', ') || '없음'}\n`;
  md += `- **로컬 의존성**: ${seed.local_dependencies.join(', ') || '없음'}\n\n`;

  // Results by category
  md += `## 🔍 검증 결과\n\n`;
  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catName = CATEGORY_NAMES[cat] || cat;
    md += `### ${catName} (${cat})\n\n`;
    md += `| ID | 설명 | 상태 | 세부 |\n|------|------|------|------|\n`;
    for (const r of catResults) {
      const icon = STATUS_ICONS[r.status];
      md += `| ${r.item_id} | ${r.description} | ${icon} ${r.status} | ${r.details.slice(0, 80)} |\n`;
    }
    md += '\n';
  }

  // Action plan
  if (action_plan.length > 0) {
    md += `## 📋 Action Plan\n\n`;
    for (const action of action_plan) {
      const typeIcon = action.fix_type === 'auto-fixable' ? '🔧 자동 수정 가능' : '👤 수동 조치 필요';
      md += `### ${action.item_id}: ${action.description}\n\n`;
      md += `- **유형**: ${typeIcon}\n`;
      md += `- **이유**: ${action.reason}\n`;
      md += `- **조치**: \`${action.fix_command}\`\n\n`;
    }
  }

  md += `---\n\n`;
  md += `*실행 시간: ${(report.execution_time_ms / 1000).toFixed(1)}초 | 리포트 경로: ${report.run_dir}*\n`;

  return md;
}

export function generateJsonReport(report: Report): string {
  return JSON.stringify(report, null, 2);
}
