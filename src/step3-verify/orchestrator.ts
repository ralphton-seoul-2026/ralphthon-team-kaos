// ── Step 3: Verification Orchestrator ──

import ora from 'ora';
import chalk from 'chalk';
import type { ChecklistItem, CheckResult } from '../core/types.js';
import { STATUS_ICONS } from '../core/constants.js';
import { executeCheck } from './executor.js';

export async function runVerification(checklist: ChecklistItem[]): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const spinner = ora({
    text: '검증 시작...',
    color: 'cyan',
  }).start();

  for (let i = 0; i < checklist.length; i++) {
    const item = checklist[i];
    spinner.text = `[${i + 1}/${checklist.length}] ${item.item_id}: ${item.description}`;

    const result = await executeCheck(item);
    results.push(result);

    const icon = STATUS_ICONS[result.status];
    const statusColor = result.status === 'PASSED' ? chalk.green
      : result.status === 'FAILED' ? chalk.red
      : result.status === 'WARNING' ? chalk.yellow
      : result.status === 'HEALED' ? chalk.blue
      : chalk.gray;

    spinner.stopAndPersist({
      symbol: icon,
      text: `${item.item_id}: ${item.description} — ${statusColor(result.status)}`,
    });

    spinner.start();
  }

  spinner.stop();

  // Summary
  const counts = {
    PASSED: results.filter(r => r.status === 'PASSED').length,
    FAILED: results.filter(r => r.status === 'FAILED').length,
    WARNING: results.filter(r => r.status === 'WARNING').length,
    SKIPPED: results.filter(r => r.status === 'SKIPPED').length,
    HEALED: results.filter(r => r.status === 'HEALED').length,
  };

  console.log(
    `\n[Step3] 검증 완료: ${chalk.green(`PASSED ${counts.PASSED}`)}, ${chalk.red(`FAILED ${counts.FAILED}`)}, ${chalk.yellow(`WARNING ${counts.WARNING}`)}, ${chalk.gray(`SKIPPED ${counts.SKIPPED}`)}`
  );

  return results;
}
