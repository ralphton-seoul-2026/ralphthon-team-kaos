// ── Constants for Chaos Lab ──

import type { CategoryCode, CheckStatus } from './types.js';

// Timeouts (milliseconds)
export const TIMEOUT_INDIVIDUAL = 30_000;    // 30초 per item
export const TIMEOUT_GROUP = 180_000;        // 3분 per group
export const TIMEOUT_STEP3 = 300_000;        // 5분 Step 3 total
export const TIMEOUT_PIPELINE = 600_000;     // 10분 entire pipeline

// Checklist bounds
export const CHECKLIST_MIN = 10;
export const CHECKLIST_MAX = 50;

// Status icons
export const STATUS_ICONS: Record<CheckStatus, string> = {
  PASSED: '🟢',
  FAILED: '🔴',
  WARNING: '🟡',
  SKIPPED: '⚪',
  HEALED: '🔧',
};

// Category names (Korean)
export const CATEGORY_NAMES: Record<CategoryCode, string> = {
  HW: '하드웨어 & 전력',
  NET: '네트워크',
  AUTH: 'API 인증',
  CC: 'Claude Code',
  RT: '런타임 & 의존성',
  BT: '빌드 & 테스트',
  DB: '데이터베이스',
  GIT: 'Git & 버전 관리',
  OS: 'OS & 프로세스',
  COST: '비용 & 안전장치',
  MON: '모니터링',
};

// Category item counts (expected)
export const CATEGORY_COUNTS: Record<CategoryCode, number> = {
  HW: 10,
  NET: 10,
  AUTH: 10,
  CC: 12,
  RT: 13,
  BT: 10,
  DB: 8,
  GIT: 9,
  OS: 8,
  COST: 6,
  MON: 4,
};

// Dangerous command patterns (blocked in auto-fix)
export const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /sudo\s+/,
  /chmod\s+777/,
  /mkfs\./,
  /dd\s+if=/,
  /:\(\)\s*\{/,
  /kill\s+-9/,
  /\|\s*(ba)?sh/,
  /\beval\b/,
  /curl\s.*\|\s*(ba)?sh/,
];

// Failure keyword patterns for result interpretation
export const FAILURE_KEYWORDS = ['not found', 'not installed', 'not running', 'not available', 'expired', '만료'];
export const SKIP_PREFIX = 'SKIPPED:';
export const WARNING_KEYWORDS = ['denied', 'permission'];
