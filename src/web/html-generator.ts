// ── Web Report HTML Generator ──

import { writeFileSync } from 'node:fs';
import type { Report, ChecklistItem, Seed } from '../core/types.js';
import { generateHtmlTemplate } from './template.js';

export function generateHtmlReport(
  report: Report,
  checklist: ChecklistItem[],
  seed: Seed,
  outputPath: string
): void {
  const html = generateHtmlTemplate(report, checklist, seed);
  writeFileSync(outputPath, html, 'utf-8');
}
