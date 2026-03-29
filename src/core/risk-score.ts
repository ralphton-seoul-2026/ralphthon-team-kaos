// ── Risk Score Calculator ──

import type { Seed } from './types.js';

export function calculateRiskScore(impact: number, likelihood: number): number {
  const clamped_impact = Math.max(1, Math.min(5, impact));
  const clamped_likelihood = Math.max(1, Math.min(5, likelihood));
  return clamped_impact * clamped_likelihood;
}

export function adjustRiskScores(
  items: Array<{ category: string; impact: number; likelihood: number }>,
  seed: Seed
): Array<{ category: string; impact: number; likelihood: number }> {
  const serviceCount = seed.external_services.length;
  const hasRateLimitConcern = seed.external_services.some(s => s.rate_limit_concern);
  const isLongRunning = seed.estimated_duration.includes('시간') ||
    seed.estimated_duration.includes('hour') ||
    seed.estimated_duration.includes('밤새') ||
    seed.estimated_duration.includes('overnight');

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

    // Rate limit concern → NET-09 likelihood = 5
    if (hasRateLimitConcern && item.category === 'NET') {
      likelihood = Math.min(5, likelihood + 1);
    }

    return { ...item, likelihood };
  });
}
