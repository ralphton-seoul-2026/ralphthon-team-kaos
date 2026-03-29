// ── Step 4+5: Verdict Logic ──

import type { CheckResult, Verdict, VerdictType } from '../core/types.js';

export function calculateVerdict(results: CheckResult[]): Verdict {
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const warning = results.filter(r => r.status === 'WARNING').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const healed = results.filter(r => r.status === 'HEALED').length;
  const critical = failed; // FAILED = CRITICAL

  let status: VerdictType;
  let summary: string;

  if (critical === 0 && warning <= 3) {
    status = 'READY';
    summary = '✅ 모든 필수 검증을 통과했습니다. 에이전트를 실행할 준비가 되었습니다.';
  } else if (critical === 0 && warning > 3) {
    status = 'READY_WITH_CAUTION';
    summary = `🟡 필수 검증은 통과했지만 주의 사항이 ${warning}건 있습니다. 확인 후 진행하세요.`;
  } else {
    status = 'NOT_READY';
    summary = `❌ CRITICAL 항목 ${critical}건이 해결되지 않았습니다. 조치 후 재검증하세요.`;
  }

  return {
    status,
    summary,
    critical_count: critical,
    warning_count: warning,
    passed_count: passed,
    skipped_count: skipped,
    healed_count: healed,
    failed_count: failed,
  };
}
