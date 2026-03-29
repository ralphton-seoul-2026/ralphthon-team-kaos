// ── Step 1: Quick Mode — Local Keyword Matching Seed Generator ──

import type { Seed, ExternalService } from '../core/types.js';

interface ServicePattern {
  patterns: RegExp[];
  service: Omit<ExternalService, 'estimated_calls'>;
}

const SERVICE_PATTERNS: ServicePattern[] = [
  {
    patterns: [/google\s*sheets?/i, /구글\s*시트/i, /스프레드시트/i],
    service: { name: 'Google Sheets API', auth_type: 'OAuth2 / API Key', operations: ['read', 'write'] },
  },
  {
    patterns: [/notion/i, /노션/i],
    service: { name: 'Notion API', auth_type: 'Bearer Token / MCP', operations: ['create_page', 'query_database'] },
  },
  {
    patterns: [/github/i, /깃허브/i, /깃헙/i],
    service: { name: 'GitHub API', auth_type: 'Personal Access Token', operations: ['api_call'] },
  },
  {
    patterns: [/slack/i, /슬랙/i],
    service: { name: 'Slack API', auth_type: 'Bot Token', operations: ['send_message'] },
  },
  {
    patterns: [/discord/i, /디스코드/i],
    service: { name: 'Discord API', auth_type: 'Bot Token', operations: ['send_message'] },
  },
  {
    patterns: [/aws/i, /s3/i, /lambda/i, /아마존/i],
    service: { name: 'AWS', auth_type: 'IAM / Access Key', operations: ['api_call'] },
  },
  {
    patterns: [/postgres(ql)?/i],
    service: { name: 'PostgreSQL', auth_type: 'Connection String', operations: ['query', 'write'] },
  },
  {
    patterns: [/mysql/i],
    service: { name: 'MySQL', auth_type: 'Connection String', operations: ['query', 'write'] },
  },
  {
    patterns: [/mongodb/i, /몽고/i],
    service: { name: 'MongoDB', auth_type: 'Connection String', operations: ['query', 'write'] },
  },
  {
    patterns: [/redis/i, /레디스/i],
    service: { name: 'Redis', auth_type: 'Connection String', operations: ['get', 'set'] },
  },
  {
    patterns: [/크롤링/i, /scraping/i, /crawl/i, /스크래핑/i, /스크레이핑/i],
    service: { name: 'Target Websites', auth_type: 'none', operations: ['HTTP GET'], rate_limit_concern: true },
  },
  {
    patterns: [/docker/i, /도커/i, /컨테이너/i],
    service: { name: 'Docker', auth_type: 'none (local)', operations: ['build', 'run'] },
  },
  {
    patterns: [/google\s*drive/i, /구글\s*드라이브/i],
    service: { name: 'Google Drive API', auth_type: 'OAuth2 / API Key', operations: ['read', 'download'] },
  },
  {
    patterns: [/google\s*docs?/i, /구글\s*문서/i],
    service: { name: 'Google Docs API', auth_type: 'OAuth2 / API Key', operations: ['read', 'write'] },
  },
  {
    patterns: [/openai/i, /gpt/i],
    service: { name: 'OpenAI API', auth_type: 'API Key', operations: ['completion'], rate_limit_concern: true },
  },
  {
    patterns: [/anthropic/i, /claude\s*api/i],
    service: { name: 'Anthropic API', auth_type: 'API Key', operations: ['completion'], rate_limit_concern: true },
  },
  {
    patterns: [/firebase/i, /파이어베이스/i],
    service: { name: 'Firebase', auth_type: 'Google OAuth', operations: ['auth', 'firestore', 'storage'] },
  },
  {
    patterns: [/supabase/i, /수파베이스/i],
    service: { name: 'Supabase', auth_type: 'API Key / Connection String', operations: ['auth', 'database', 'storage'] },
  },
  {
    patterns: [/stripe/i, /스트라이프/i],
    service: { name: 'Stripe', auth_type: 'API Key', operations: ['payment', 'webhook'] },
  },
  {
    patterns: [/twilio/i, /트윌리오/i],
    service: { name: 'Twilio', auth_type: 'API Key', operations: ['sms', 'call'], rate_limit_concern: true },
  },
  {
    patterns: [/sendgrid/i, /이메일\s*발송/i, /이메일.*송신/i, /메일.*발송/i, /smtp/i],
    service: { name: 'SendGrid / Email', auth_type: 'API Key / SMTP', operations: ['send_email'] },
  },
  {
    patterns: [/vercel/i, /버셀/i],
    service: { name: 'Vercel', auth_type: 'API Token', operations: ['deploy'] },
  },
  {
    patterns: [/airtable/i, /에어테이블/i],
    service: { name: 'Airtable', auth_type: 'API Key', operations: ['read', 'write'] },
  },
  {
    patterns: [/jira/i, /지라/i],
    service: { name: 'Jira', auth_type: 'API Token', operations: ['create_issue', 'query'] },
  },
  {
    patterns: [/linear/i, /리니어/i],
    service: { name: 'Linear', auth_type: 'API Key', operations: ['create_issue', 'query'] },
  },
  {
    patterns: [/selenium/i, /셀레니움/i],
    service: { name: 'Target Websites', auth_type: 'none', operations: ['browser_automation'] },
  },
  {
    patterns: [/playwright/i, /플레이라이트/i],
    service: { name: 'Target Websites', auth_type: 'none', operations: ['browser_automation'] },
  },
];

interface DependencyPattern {
  patterns: RegExp[];
  dependency: string;
}

const DEPENDENCY_PATTERNS: DependencyPattern[] = [
  { patterns: [/python/i, /파이썬/i, /pandas/i, /matplotlib/i, /beautifulsoup/i, /scrapy/i], dependency: 'Python >= 3.10' },
  { patterns: [/node/i, /typescript/i, /npm/i, /next\.?js/i, /react/i], dependency: 'Node.js >= 18' },
  { patterns: [/docker/i, /도커/i, /compose/i, /컨테이너/i], dependency: 'Docker Desktop' },
  { patterns: [/mcp/i], dependency: 'Node.js >= 18 (MCP 서버용)' },
  { patterns: [/pip/i, /pandas/i, /numpy/i, /scipy/i], dependency: 'pip: pandas, numpy' },
  { patterns: [/playwright/i], dependency: 'Python >= 3.10, Playwright' },
  { patterns: [/selenium/i, /chromedriver/i], dependency: 'Python >= 3.10, Selenium, ChromeDriver' },
];

interface DurationPattern {
  patterns: RegExp[];
  duration: string;
}

const DURATION_PATTERNS: DurationPattern[] = [
  { patterns: [/밤새/i, /overnight/i, /하루\s*종일/i], duration: '8~24시간' },
  { patterns: [/(\d+)\s*시간/i, /(\d+)\s*hour/i], duration: '2~4시간' },
  { patterns: [/500|1000|대량|10000/i, /대규모/i], duration: '1~3시간' },
  { patterns: [/3시간/i], duration: '3~6시간' },
];

function detectServices(prompt: string): ExternalService[] {
  const detected: ExternalService[] = [];
  const seen = new Set<string>();

  for (const sp of SERVICE_PATTERNS) {
    if (sp.patterns.some(p => p.test(prompt))) {
      if (!seen.has(sp.service.name)) {
        seen.add(sp.service.name);
        const estimatedCalls = estimateApiCalls(prompt, sp.service.name);
        detected.push({ ...sp.service, estimated_calls: estimatedCalls });
      }
    }
  }

  return detected;
}

function estimateApiCalls(prompt: string, serviceName: string): number {
  const numberMatch = prompt.match(/(\d+)\s*[개건장편]/);
  const count = numberMatch ? parseInt(numberMatch[1], 10) : 10;

  if (serviceName.includes('Website') || serviceName.includes('crawl')) return count;
  if (serviceName.includes('OpenAI') || serviceName.includes('Anthropic')) return count;
  return Math.min(count, 100);
}

function detectDependencies(prompt: string): string[] {
  const deps: string[] = [];
  const seen = new Set<string>();

  for (const dp of DEPENDENCY_PATTERNS) {
    if (dp.patterns.some(p => p.test(prompt))) {
      if (!seen.has(dp.dependency)) {
        seen.add(dp.dependency);
        deps.push(dp.dependency);
      }
    }
  }

  return deps;
}

function estimateDuration(prompt: string): string {
  for (const dp of DURATION_PATTERNS) {
    if (dp.patterns.some(p => p.test(prompt))) {
      return dp.duration;
    }
  }
  return '30분~1시간';
}

function estimateAmbiguityScore(prompt: string, services: ExternalService[]): number {
  let score = 0.6; // base ambiguity

  // More specific prompt → lower ambiguity
  if (prompt.length > 50) score -= 0.1;
  if (prompt.length > 100) score -= 0.1;
  if (services.length > 0) score -= 0.1;
  if (services.length > 2) score -= 0.05;
  if (/\d+/.test(prompt)) score -= 0.05; // has specific numbers
  if (/저장|save|write|push|deploy/i.test(prompt)) score -= 0.05;

  return Math.max(0.1, Math.min(0.8, parseFloat(score.toFixed(2))));
}

function generateFailureImpact(services: ExternalService[], prompt: string): string[] {
  const impacts: string[] = [];

  for (const svc of services) {
    if (svc.name.includes('Website') || svc.name.includes('crawl')) {
      impacts.push('크롤링 중단 시: 부분 데이터 유실');
    } else if (svc.name.includes('Notion')) {
      impacts.push('Notion 실패 시: 분석 결과 전체 유실');
    } else if (svc.name.includes('Google')) {
      impacts.push(`${svc.name} 실패 시: 데이터 접근 불가`);
    } else if (svc.name.includes('AWS')) {
      impacts.push('AWS 실패 시: 배포/저장 불가');
    } else if (svc.name.includes('SQL') || svc.name.includes('DB') || svc.name.includes('Mongo') || svc.name.includes('Redis')) {
      impacts.push(`${svc.name} 실패 시: 데이터 저장 불가`);
    } else {
      impacts.push(`${svc.name} 실패 시: 해당 기능 사용 불가`);
    }
  }

  if (impacts.length === 0) {
    impacts.push('스크립트 실행 실패 시: 재시도 필요');
  }

  return impacts;
}

function generateAssumptions(services: ExternalService[], duration: string): string[] {
  const assumptions: string[] = [];

  if (services.some(s => s.auth_type !== 'none' && s.auth_type !== 'none (local)')) {
    assumptions.push('안정적인 인터넷 연결');
  }

  if (duration.includes('시간') || duration.includes('hour')) {
    assumptions.push('슬립 모드 비활성화');
    assumptions.push('충분한 배터리 또는 전원 연결');
  }

  assumptions.push('충분한 디스크 공간');

  if (services.some(s => s.rate_limit_concern)) {
    assumptions.push('API Rate Limit 여유');
  }

  return assumptions;
}

export function generateSeed(prompt: string): Seed {
  const services = detectServices(prompt);
  const dependencies = detectDependencies(prompt);
  const duration = estimateDuration(prompt);
  const ambiguityScore = estimateAmbiguityScore(prompt, services);
  const failureImpact = generateFailureImpact(services, prompt);
  const assumptions = generateAssumptions(services, duration);

  // Build summary
  const serviceNames = services.map(s => s.name).join(', ');
  const taskSummary = serviceNames
    ? `${serviceNames}을(를) 활용하는 작업: ${prompt.slice(0, 80)}`
    : prompt.slice(0, 120);

  return {
    task_summary: taskSummary,
    ambiguity_score: ambiguityScore,
    external_services: services,
    local_dependencies: dependencies,
    estimated_duration: duration,
    failure_impact: failureImpact,
    environment_assumptions: assumptions,
  };
}
