// ── Step 3: Shell Command Executor with timeout ──

import { execaCommand } from 'execa';
import type { ChecklistItem, CheckResult, CheckStatus } from '../core/types.js';
import { TIMEOUT_INDIVIDUAL, FAILURE_KEYWORDS, SKIP_PREFIX, WARNING_KEYWORDS } from '../core/constants.js';

function interpretResult(stdout: string, stderr: string, exitCode: number): CheckStatus {
  const output = (stdout + ' ' + stderr).toLowerCase();

  // Check for SKIPPED prefix first
  if (stdout.startsWith(SKIP_PREFIX) || stdout.includes('SKIPPED:')) {
    return 'SKIPPED';
  }

  // Check failure keywords
  for (const keyword of FAILURE_KEYWORDS) {
    if (output.includes(keyword.toLowerCase())) {
      return 'FAILED';
    }
  }

  // Check warning keywords
  for (const keyword of WARNING_KEYWORDS) {
    if (output.includes(keyword.toLowerCase())) {
      return 'WARNING';
    }
  }

  // Check WARNING prefix in output
  if (stdout.startsWith('WARNING:') || stdout.includes('WARNING:')) {
    return 'WARNING';
  }

  // Exit code 0 with no failure indicators = PASSED
  if (exitCode === 0) {
    return 'PASSED';
  }

  return 'FAILED';
}

export async function executeCheck(item: ChecklistItem): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    const result = await execaCommand(item.verification_command, {
      shell: true,
      timeout: TIMEOUT_INDIVIDUAL,
      reject: false,
    });

    const stdout = result.stdout.trim();
    const stderr = result.stderr.trim();
    const exitCode = result.exitCode ?? 1;
    const status = interpretResult(stdout, stderr, exitCode);

    return {
      item_id: item.item_id,
      category: item.category,
      description: item.description,
      status,
      details: stdout || stderr || `exit code: ${exitCode}`,
      execution_time_ms: Date.now() - startTime,
      verification_command: item.verification_command,
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; timedOut?: boolean };
    let status: CheckStatus = 'FAILED';
    let details = err.message || 'Unknown error';

    if (err.code === 'ENOENT' || details.includes('not found')) {
      status = 'SKIPPED';
      details = '검증 도구가 설치되지 않음';
    } else if (err.code === 'EACCES' || details.includes('permission')) {
      status = 'SKIPPED';
      details = '권한 부족으로 검증 불가';
    } else if (err.timedOut) {
      status = 'WARNING';
      details = '검증 시간 초과 (30초)';
    }

    return {
      item_id: item.item_id,
      category: item.category,
      description: item.description,
      status,
      details,
      execution_time_ms: Date.now() - startTime,
      verification_command: item.verification_command,
    };
  }
}
