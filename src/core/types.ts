// ── Core Types for Chaos Lab ──

export interface CommandVariants {
  darwin: string;
  linux: string;
}

export interface ExternalService {
  name: string;
  auth_type: string;
  operations: string[];
  estimated_calls?: number;
  rate_limit_concern?: boolean;
}

export interface Seed {
  task_summary: string;
  ambiguity_score: number;
  external_services: ExternalService[];
  local_dependencies: string[];
  estimated_duration: string;
  failure_impact: string[];
  environment_assumptions: string[];
}

export type CategoryCode =
  | 'HW' | 'NET' | 'AUTH' | 'CC' | 'RT'
  | 'BT' | 'DB' | 'GIT' | 'OS' | 'COST' | 'MON';

export interface MasterChecklistItem {
  item_id: string;
  category: CategoryCode;
  description: string;
  verification_command: CommandVariants;
  impact: number;       // 1-5
  likelihood: number;   // 1-5
  relevant_to?: string[];
}

export interface ChecklistItem {
  item_id: string;
  category: CategoryCode;
  description: string;
  verification_command: string; // resolved for current OS
  impact: number;
  likelihood: number;
  risk_score: number;
  relevant_to?: string[];
  source: 'layer1' | 'layer2';
}

export type CheckStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED' | 'HEALED';

export interface CheckResult {
  item_id: string;
  category: CategoryCode;
  description: string;
  status: CheckStatus;
  details: string;
  execution_time_ms: number;
  verification_command: string;
}

export interface AutoFixResult {
  item_id: string;
  fix_command: string;
  fix_type: 'auto-fixable' | 'manual-only';
  success: boolean;
  message: string;
}

export type VerdictType = 'READY' | 'READY_WITH_CAUTION' | 'NOT_READY';

export interface Verdict {
  status: VerdictType;
  summary: string;
  critical_count: number;
  warning_count: number;
  passed_count: number;
  skipped_count: number;
  healed_count: number;
  failed_count: number;
}

export interface ActionPlanItem {
  item_id: string;
  description: string;
  reason: string;
  fix_command: string;
  fix_type: 'auto-fixable' | 'manual-only';
}

export interface Report {
  timestamp: string;
  run_dir: string;
  seed: Seed;
  checklist_count: number;
  results: CheckResult[];
  verdict: Verdict;
  action_plan: ActionPlanItem[];
  auto_fix_results: AutoFixResult[];
  execution_time_ms: number;
}
