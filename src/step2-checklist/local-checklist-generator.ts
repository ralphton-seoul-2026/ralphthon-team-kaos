// ── Step 2: Checklist Generation (Layer 1 + Layer 2) ──

import type { Seed, ChecklistItem, CategoryCode, MasterChecklistItem } from '../core/types.js';
import { MASTER_CHECKLIST } from '../core/master-checklist.js';
import { calculateRiskScore } from '../core/risk-score.js';
import { CHECKLIST_MIN, CHECKLIST_MAX } from '../core/constants.js';

// Categories that are always included
const ALWAYS_INCLUDED: CategoryCode[] = ['AUTH', 'NET', 'RT'];

// Rule-based category activation
function getActiveCategories(seed: Seed): Set<CategoryCode> {
  const active = new Set<CategoryCode>(ALWAYS_INCLUDED);

  const hasExternalServices = seed.external_services.length > 0;
  const isLongRunning = /시간|hour|밤새|overnight/i.test(seed.estimated_duration);
  const serviceNames = seed.external_services.map(s => s.name.toLowerCase()).join(' ');
  const taskLower = seed.task_summary.toLowerCase();

  // External services → AUTH, NET
  if (hasExternalServices) {
    active.add('AUTH');
    active.add('NET');
  }

  // Long running → HW, OS, COST, MON
  if (isLongRunning) {
    active.add('HW');
    active.add('OS');
    active.add('COST');
    active.add('MON');
  }

  // Claude/MCP keywords → CC
  if (/claude|mcp/i.test(taskLower) || /claude|mcp/i.test(serviceNames)) {
    active.add('CC');
  }

  // DB keywords
  if (/postgres|mysql|mongo|redis|sqlite|supabase|database|db|데이터베이스/i.test(taskLower) ||
      /postgres|mysql|mongo|redis|sqlite|supabase/i.test(serviceNames)) {
    active.add('DB');
  }

  // Git keywords
  if (/github|git|push|deploy|배포/i.test(taskLower) || /github/i.test(serviceNames)) {
    active.add('GIT');
  }

  // Build/test keywords
  if (/build|test|lint|deploy|next\.?js|react|빌드|테스트|배포/i.test(taskLower) ||
      /vercel|firebase/i.test(serviceNames)) {
    active.add('BT');
  }

  // Docker keywords
  if (/docker|compose|container|컨테이너|도커/i.test(taskLower) ||
      /docker/i.test(serviceNames)) {
    active.add('RT'); // already included
  }

  return active;
}

// Check if a master item is relevant to the seed's services
function isRelevantToSeed(item: MasterChecklistItem, seed: Seed): boolean {
  // Items without relevant_to are general-purpose → always relevant if category is active
  if (!item.relevant_to || item.relevant_to.length === 0) return true;

  const serviceNames = seed.external_services.map(s => s.name.toLowerCase());
  const taskLower = seed.task_summary.toLowerCase();

  return item.relevant_to.some(tag => {
    const tagLower = tag.toLowerCase();
    return serviceNames.some(sn => sn.includes(tagLower)) ||
           taskLower.includes(tagLower);
  });
}

// Layer 1: Select from master checklist based on rules
function generateLayer1(seed: Seed): ChecklistItem[] {
  const activeCategories = getActiveCategories(seed);
  const platform = process.platform === 'darwin' ? 'darwin' : 'linux';

  return MASTER_CHECKLIST
    .filter(item => activeCategories.has(item.category))
    .filter(item => isRelevantToSeed(item, seed))
    .map(item => ({
      item_id: item.item_id,
      category: item.category,
      description: item.description,
      verification_command: item.verification_command[platform],
      impact: item.impact,
      likelihood: item.likelihood,
      risk_score: calculateRiskScore(item.impact, item.likelihood),
      relevant_to: item.relevant_to,
      source: 'layer1' as const,
    }));
}

// Layer 2: Generate custom items based on seed context
function generateLayer2(seed: Seed): ChecklistItem[] {
  const customItems: ChecklistItem[] = [];
  let customIndex = 1;
  const platform = process.platform === 'darwin' ? 'darwin' : 'linux';

  for (const svc of seed.external_services) {
    const svcLower = svc.name.toLowerCase();

    // Google OAuth check
    if (svcLower.includes('google')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: `${svc.name} OAuth 토큰 파일 존재 확인`,
        verification_command: 'test -f ~/.config/gcloud/application_default_credentials.json && echo "google creds ok" || echo "not found: Google OAuth credentials - gcloud auth application-default login 실행 필요"',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: [svc.name],
        source: 'layer2',
      });
    }

    // Notion token check
    if (svcLower.includes('notion')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Notion API 토큰 유효성 확인',
        verification_command: 'test -n "${NOTION_API_KEY}" && curl -so /dev/null -w "%{http_code}" -H "Authorization: Bearer ${NOTION_API_KEY}" -H "Notion-Version: 2022-06-28" https://api.notion.com/v1/users/me | grep -q "200" && echo "notion token valid" || echo "not found: NOTION_API_KEY - https://www.notion.so/my-integrations 에서 토큰 발급 필요"',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: ['Notion'],
        source: 'layer2',
      });
    }

    // Slack bot token
    if (svcLower.includes('slack')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Slack Bot Token 유효성 확인',
        verification_command: 'test -n "${SLACK_BOT_TOKEN}" && curl -so /dev/null -w "%{http_code}" -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" https://slack.com/api/auth.test | grep -q "200" && echo "slack token valid" || echo "not found: SLACK_BOT_TOKEN - https://api.slack.com/apps 에서 Bot Token 발급 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Slack'],
        source: 'layer2',
      });
    }

    // OpenAI key + rate limit
    if (svcLower.includes('openai')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'OpenAI API 키 유효성 확인',
        verification_command: 'test -n "${OPENAI_API_KEY}" && curl -so /dev/null -w "%{http_code}" -H "Authorization: Bearer ${OPENAI_API_KEY}" https://api.openai.com/v1/models | grep -q "200" && echo "openai key valid" || echo "not found: OPENAI_API_KEY - https://platform.openai.com/api-keys 에서 키 발급 필요"',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: ['OpenAI'],
        source: 'layer2',
      });
    }

    // Anthropic key
    if (svcLower.includes('anthropic')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Anthropic API 키 유효성 확인',
        verification_command: 'test -n "${ANTHROPIC_API_KEY}" && echo "anthropic key set" || echo "not found: ANTHROPIC_API_KEY - https://console.anthropic.com/settings/keys 에서 키 발급 필요"',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: ['Anthropic'],
        source: 'layer2',
      });
    }

    // AWS credentials
    if (svcLower.includes('aws')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'AWS IAM 자격 증명 및 리전 설정 확인',
        verification_command: 'test -n "${AWS_ACCESS_KEY_ID}" && test -n "${AWS_DEFAULT_REGION}" && echo "aws config ok" || (test -f ~/.aws/credentials && test -f ~/.aws/config && echo "aws files ok" || echo "not found: AWS credentials - aws configure 실행 필요")',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: ['AWS'],
        source: 'layer2',
      });
    }

    // Stripe key
    if (svcLower.includes('stripe')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Stripe API 키 확인',
        verification_command: 'test -n "${STRIPE_SECRET_KEY}" && echo "stripe key set" || echo "not found: STRIPE_SECRET_KEY - https://dashboard.stripe.com/apikeys 에서 키 발급 필요"',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: ['Stripe'],
        source: 'layer2',
      });
    }

    // Discord bot
    if (svcLower.includes('discord')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Discord Bot Token 확인',
        verification_command: 'test -n "${DISCORD_BOT_TOKEN}" && echo "discord token set" || echo "not found: DISCORD_BOT_TOKEN - https://discord.com/developers/applications 에서 Bot Token 발급 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Discord'],
        source: 'layer2',
      });
    }

    // Firebase
    if (svcLower.includes('firebase')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Firebase 프로젝트 설정 확인',
        verification_command: 'test -n "${GOOGLE_APPLICATION_CREDENTIALS}" && echo "firebase creds set" || (test -f firebase.json && echo "firebase config ok" || echo "not found: Firebase config - firebase init 실행 필요")',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Firebase'],
        source: 'layer2',
      });
    }

    // Supabase
    if (svcLower.includes('supabase')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Supabase 프로젝트 URL 및 키 확인',
        verification_command: 'test -n "${SUPABASE_URL}" && test -n "${SUPABASE_ANON_KEY}" && echo "supabase config ok" || echo "not found: SUPABASE_URL/SUPABASE_ANON_KEY - https://app.supabase.com/project/_/settings/api 에서 확인 필요"',
        impact: 5, likelihood: 4,
        risk_score: 20,
        relevant_to: ['Supabase'],
        source: 'layer2',
      });
    }

    // Twilio
    if (svcLower.includes('twilio')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Twilio API 자격 증명 확인',
        verification_command: 'test -n "${TWILIO_ACCOUNT_SID}" && test -n "${TWILIO_AUTH_TOKEN}" && echo "twilio creds set" || echo "not found: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN - https://console.twilio.com 에서 확인 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Twilio'],
        source: 'layer2',
      });
    }

    // Airtable
    if (svcLower.includes('airtable')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Airtable API 키 확인',
        verification_command: 'test -n "${AIRTABLE_API_KEY}" && echo "airtable key set" || (test -n "${AIRTABLE_PAT}" && echo "airtable pat set" || echo "not found: AIRTABLE_API_KEY - https://airtable.com/account 에서 API 키 발급 필요")',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Airtable'],
        source: 'layer2',
      });
    }

    // Vercel token
    if (svcLower.includes('vercel')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Vercel API Token 확인',
        verification_command: 'test -n "${VERCEL_TOKEN}" && echo "vercel token set" || (npx vercel whoami > /dev/null 2>&1 && echo "vercel auth ok" || echo "not found: VERCEL_TOKEN - npx vercel login 실행 필요")',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Vercel'],
        source: 'layer2',
      });
    }

    // SendGrid / Email
    if (svcLower.includes('sendgrid') || svcLower.includes('email')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'SendGrid API 키 또는 SMTP 설정 확인',
        verification_command: 'test -n "${SENDGRID_API_KEY}" && echo "sendgrid key set" || (test -n "${SMTP_HOST}" && echo "smtp configured" || echo "not found: SENDGRID_API_KEY - https://app.sendgrid.com/settings/api_keys 에서 키 발급 필요")',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['SendGrid', 'Email'],
        source: 'layer2',
      });
    }

    // Jira token
    if (svcLower.includes('jira')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Jira API Token 확인',
        verification_command: 'test -n "${JIRA_API_TOKEN}" && echo "jira token set" || echo "not found: JIRA_API_TOKEN - https://id.atlassian.com/manage-profile/security/api-tokens 에서 토큰 발급 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Jira'],
        source: 'layer2',
      });
    }

    // Linear token
    if (svcLower.includes('linear')) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'AUTH',
        description: 'Linear API Key 확인',
        verification_command: 'test -n "${LINEAR_API_KEY}" && echo "linear key set" || echo "not found: LINEAR_API_KEY - https://linear.app/settings/api 에서 키 발급 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Linear'],
        source: 'layer2',
      });
    }

    // Rate limit concern
    if (svc.rate_limit_concern) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'NET',
        description: `${svc.name} Rate Limit 주의 — ${svc.estimated_calls || '다수'}건 요청 예정`,
        verification_command: `echo "WARNING: ${svc.name}에 ${svc.estimated_calls || '다수'}건 요청 예정. Rate Limit 정책을 확인하세요."`,
        impact: 4, likelihood: 4,
        risk_score: 16,
        relevant_to: [svc.name],
        source: 'layer2',
      });
    }
  }

  // Dependency-specific custom items
  for (const dep of seed.local_dependencies) {
    if (/pandas/i.test(dep)) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'RT',
        description: 'pandas 라이브러리 import 가능 확인',
        verification_command: 'python3 -c "import pandas; print(f\'pandas {pandas.__version__}\')" 2>/dev/null && echo "pandas ok" || echo "not installed: pandas - pip3 install pandas 실행 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Python'],
        source: 'layer2',
      });
    }

    if (/playwright/i.test(dep)) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'RT',
        description: 'Playwright 브라우저 설치 확인',
        verification_command: 'npx playwright --version > /dev/null 2>&1 && echo "playwright ok" || echo "not installed: Playwright - npx playwright install 실행 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Playwright'],
        source: 'layer2',
      });
    }

    if (/selenium/i.test(dep)) {
      customItems.push({
        item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
        category: 'RT',
        description: 'ChromeDriver 설치 및 버전 호환성 확인',
        verification_command: 'chromedriver --version > /dev/null 2>&1 && echo "chromedriver ok" || echo "not installed: ChromeDriver - brew install chromedriver 실행 필요"',
        impact: 4, likelihood: 3,
        risk_score: 12,
        relevant_to: ['Selenium'],
        source: 'layer2',
      });
    }
  }

  // Long-running specific checks
  if (/시간|hour|밤새|overnight/i.test(seed.estimated_duration)) {
    customItems.push({
      item_id: `CUSTOM-${String(customIndex++).padStart(2, '0')}`,
      category: 'HW',
      description: '장시간 작업을 위한 슬립 방지 설정 확인',
      verification_command: platform === 'darwin'
        ? 'pgrep -x caffeinate > /dev/null && echo "caffeinate active" || echo "not running: caffeinate - caffeinate -i & 실행 필요"'
        : 'systemd-inhibit --list 2>/dev/null | grep -q "block" && echo "inhibit active" || echo "not running: sleep inhibitor"',
      impact: 5, likelihood: 4,
      risk_score: 20,
      relevant_to: [],
      source: 'layer2',
    });
  }

  return customItems;
}

// Merge Layer 1 + Layer 2, deduplicate, sort, bound
export function generateChecklist(seed: Seed): ChecklistItem[] {
  const layer1 = generateLayer1(seed);
  const layer2 = generateLayer2(seed);

  // Layer 2 priority: merge with dedup
  const merged = new Map<string, ChecklistItem>();

  // Add Layer 2 first (priority)
  for (const item of layer2) {
    merged.set(item.item_id, item);
  }

  // Add Layer 1, skip if same verification target covered by Layer 2
  for (const item of layer1) {
    // Check if Layer 2 already covers this area
    const l2Covers = layer2.some(l2 =>
      l2.category === item.category &&
      l2.description.toLowerCase().includes(item.description.toLowerCase().split(' ')[0])
    );

    if (!l2Covers) {
      merged.set(item.item_id, item);
    }
  }

  // Apply risk score adjustments based on seed context
  const serviceCount = seed.external_services.length;
  const isLongRunning = /시간|hour|밤새|overnight/i.test(seed.estimated_duration);

  let items = Array.from(merged.values()).map(item => {
    let { likelihood } = item;

    if (serviceCount >= 2 && item.category === 'AUTH') {
      likelihood = Math.min(5, likelihood + 1);
    }
    if (isLongRunning && item.category === 'HW') {
      likelihood = Math.min(5, likelihood + 1);
    }

    const risk_score = calculateRiskScore(item.impact, likelihood);
    return { ...item, likelihood, risk_score };
  });

  // Sort by risk score descending
  items.sort((a, b) => b.risk_score - a.risk_score);

  // Apply bounds
  if (items.length < CHECKLIST_MIN) {
    // Pad with remaining master items if needed
    const existingIds = new Set(items.map(i => i.item_id));
    const platform = process.platform === 'darwin' ? 'darwin' : 'linux';
    const remaining = MASTER_CHECKLIST
      .filter(m => !existingIds.has(m.item_id))
      .slice(0, CHECKLIST_MIN - items.length)
      .map(m => ({
        item_id: m.item_id,
        category: m.category,
        description: m.description,
        verification_command: m.verification_command[platform],
        impact: m.impact,
        likelihood: m.likelihood,
        risk_score: calculateRiskScore(m.impact, m.likelihood),
        relevant_to: m.relevant_to,
        source: 'layer1' as const,
      }));
    items = [...items, ...remaining];
  }

  if (items.length > CHECKLIST_MAX) {
    items = items.slice(0, CHECKLIST_MAX);
  }

  return items;
}
