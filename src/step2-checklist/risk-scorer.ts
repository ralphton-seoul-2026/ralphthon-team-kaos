// ── Risk Scorer: Seed context-aware score adjustment ──

import type { Seed, ChecklistItem } from '../core/types.js';
import { calculateRiskScore } from '../core/risk-score.js';

export function adjustChecklistRiskScores(items: ChecklistItem[], seed: Seed): ChecklistItem[] {
  const serviceCount = seed.external_services.length;
  const hasRateLimitConcern = seed.external_services.some(s => s.rate_limit_concern);
  const isLongRunning = /시간|hour|밤새|overnight/i.test(seed.estimated_duration);

  return items.map(item => {
    let { likelihood } = item;

    // External services >= 2 → AUTH likelihood +1
    if (serviceCount >= 2 && item.category === 'AUTH') {
      likelihood = Math.min(5, likelihood + 1);
    }

    // Long running → HW likelihood +1
    if (isLongRunning && item.category === 'HW') {
      likelihood = Math.min(5, likelihood + 1);
    }

    // Rate limit concern → NET likelihood +1
    if (hasRateLimitConcern && item.category === 'NET') {
      likelihood = Math.min(5, likelihood + 1);
    }

    const risk_score = calculateRiskScore(item.impact, likelihood);
    return { ...item, likelihood, risk_score };
  });
}
