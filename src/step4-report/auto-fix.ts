// ── Step 4: Auto-fix Classification & Execution ──

import { execaCommand } from 'execa';
import type { CheckResult, AutoFixResult } from '../core/types.js';
import { DANGEROUS_PATTERNS, TIMEOUT_INDIVIDUAL } from '../core/constants.js';

interface FixClassification {
  item_id: string;
  fix_type: 'auto-fixable' | 'manual-only';
  fix_command: string;
  reason: string;
}

// Known auto-fix patterns based on error output
const AUTO_FIX_PATTERNS: Array<{
  pattern: RegExp;
  fix: (details: string) => string;
  description: string;
}> = [
  {
    pattern: /not installed:\s*(\S+)/i,
    fix: (details) => {
      const match = details.match(/not installed:\s*(\S+)/i);
      const pkg = match?.[1] || '';
      if (/pip|pandas|numpy|beautifulsoup|scrapy|packaging/i.test(pkg)) return `pip3 install --user ${pkg}`;
      if (/node/i.test(pkg)) return 'echo "Node.js 설치: https://nodejs.org/"';
      if (/npm/i.test(pkg)) return 'echo "npm은 Node.js와 함께 설치됩니다"';
      return `echo "설치 필요: ${pkg}"`;
    },
    description: '패키지 설치',
  },
  {
    pattern: /not running:\s*caffeinate/i,
    fix: () => 'caffeinate -i &',
    description: '슬립 방지 프로세스 실행',
  },
  {
    pattern: /not running:\s*tmux/i,
    fix: () => 'echo "tmux 세션 시작: tmux new-session -d -s work"',
    description: 'tmux 세션 시작',
  },
  {
    pattern: /not found:\s*\.env/i,
    fix: () => 'touch .env && echo "# Add your environment variables here" > .env',
    description: '.env 파일 생성',
  },
  {
    pattern: /not found:\s*\.gitignore/i,
    fix: () => 'echo "node_modules/\\ndist/\\n.env\\n.chaos-lab/" > .gitignore',
    description: '.gitignore 파일 생성',
  },
  {
    pattern: /not found:\s*node_modules/i,
    fix: () => 'npm install',
    description: 'npm 패키지 설치',
  },
  {
    pattern: /not found:\s*lockfile/i,
    fix: () => 'npm install',
    description: 'lockfile 생성',
  },
  {
    pattern: /port\s*\d+\s*in use/i,
    fix: (details) => {
      const portMatch = details.match(/port\s*(\d+)/i);
      const port = portMatch?.[1] || '3000';
      return `lsof -ti:${port} | xargs kill -9`;
    },
    description: '포트 충돌 해소',
  },
];

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

export function classifyFix(result: CheckResult): FixClassification {
  const details = result.details.toLowerCase();

  // Try known auto-fix patterns
  for (const afp of AUTO_FIX_PATTERNS) {
    if (afp.pattern.test(result.details)) {
      const fixCommand = afp.fix(result.details);

      // Safety check
      if (isDangerousCommand(fixCommand)) {
        return {
          item_id: result.item_id,
          fix_type: 'manual-only',
          fix_command: fixCommand,
          reason: `위험 명령어 차단됨 — ${afp.description}`,
        };
      }

      return {
        item_id: result.item_id,
        fix_type: 'auto-fixable',
        fix_command: fixCommand,
        reason: afp.description,
      };
    }
  }

  // Manual-only: generate actionable guidance
  let manualCommand = generateManualGuidance(result);

  return {
    item_id: result.item_id,
    fix_type: 'manual-only',
    fix_command: manualCommand,
    reason: '자동 수정 불가 — 수동 조치 필요',
  };
}

function generateManualGuidance(result: CheckResult): string {
  const details = result.details;
  const id = result.item_id;

  // Auth-related patterns
  if (/oauth|token.*expired|만료/i.test(details)) {
    return 'gcloud auth application-default login 실행 후 재검증';
  }
  if (/NOTION_API_KEY|notion.*token/i.test(details)) {
    return 'export NOTION_API_KEY="your-token" — https://www.notion.so/my-integrations 에서 토큰 발급';
  }
  if (/OPENAI_API_KEY/i.test(details)) {
    return 'export OPENAI_API_KEY="your-key" — https://platform.openai.com/api-keys 에서 키 발급';
  }
  if (/ANTHROPIC_API_KEY/i.test(details)) {
    return 'export ANTHROPIC_API_KEY="your-key" — https://console.anthropic.com/settings/keys 에서 키 발급';
  }
  if (/GITHUB_TOKEN/i.test(details)) {
    return 'gh auth login 실행 또는 export GITHUB_TOKEN="your-token"';
  }
  if (/AWS/i.test(details)) {
    return 'aws configure 실행하여 Access Key, Secret Key, Region 설정';
  }
  if (/SLACK/i.test(details)) {
    return 'export SLACK_BOT_TOKEN="xoxb-..." — https://api.slack.com/apps 에서 Bot Token 발급';
  }
  if (/DISCORD/i.test(details)) {
    return 'export DISCORD_BOT_TOKEN="your-token" — https://discord.com/developers/applications 에서 발급';
  }
  if (/google.*cred/i.test(details)) {
    return 'gcloud auth application-default login --scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive';
  }

  // Service-specific patterns
  if (/not running.*docker/i.test(details)) {
    return 'open -a Docker 또는 Docker Desktop 실행';
  }
  if (/not running.*postgres/i.test(details)) {
    return 'brew services start postgresql 또는 pg_ctl start';
  }
  if (/not running.*mongo/i.test(details)) {
    return 'brew services start mongodb-community 또는 mongod --dbpath /data/db';
  }
  if (/not running.*redis/i.test(details)) {
    return 'brew services start redis 또는 redis-server &';
  }

  // Hardware patterns
  if (/low memory|memory|메모리/i.test(details) || id === 'HW-04') {
    return 'top -l 1 | head -10 으로 메모리 사용량 확인 후, 불필요한 앱(브라우저 탭, IDE 등) 종료';
  }
  if (/disk.*space/i.test(details) || id === 'HW-03') {
    return 'du -sh ~/Library/Caches/* | sort -rh | head -10 으로 대용량 캐시 확인 후 정리';
  }
  if (/battery/i.test(details) || id === 'HW-05') {
    return 'pmset -g batt 로 배터리 상태 확인, 전원 어댑터 연결 권장';
  }
  if (/swap/i.test(details) || id === 'HW-08') {
    return 'sysctl vm.swapusage 로 스왑 확인, 메모리 사용량이 높은 프로세스를 Activity Monitor에서 종료';
  }
  if (/sleep|슬립/i.test(details) || id === 'HW-01') {
    return 'caffeinate -i & 실행하여 슬립 모드 방지 (장시간 작업 필수)';
  }
  if (/cpu/i.test(details) || id === 'HW-07') {
    return 'top -l 1 -o cpu | head -15 로 CPU 점유 프로세스 확인 후 종료';
  }
  if (/tmux|screen/i.test(details) || id === 'HW-06') {
    return 'tmux new-session -d -s chaos-work 실행하여 세션 유지 (SSH 연결 끊김 방지)';
  }

  // Network patterns
  if (/unreachable|접근.*불가/i.test(details) || /api.*endpoint/i.test(result.description)) {
    return 'curl -sI --max-time 5 <endpoint-url> 로 엔드포인트 상태 확인, VPN/프록시 설정 점검';
  }
  if (/bandwidth|대역폭/i.test(details) || id === 'NET-10') {
    return 'networkQuality 실행하여 네트워크 속도 측정, WiFi → 유선 전환 또는 대역폭 사용 앱 종료';
  }
  if (/internet|연결/i.test(details)) {
    return 'networksetup -getairportnetwork en0 로 WiFi 상태 확인, ping 8.8.8.8 으로 연결 테스트';
  }
  if (/rate.*limit/i.test(details)) {
    return 'API Rate Limit 정책 확인: 요청 간격을 time.sleep(1) 등으로 조절하거나 배치 크기 축소';
  }

  // OS patterns
  if (/ulimit/i.test(details) || id === 'OS-01') {
    return 'ulimit -n 10240 실행하여 오픈 파일 수 증가 (현재 쉘에 적용)';
  }
  if (/auto.*update|자동.*업데이트/i.test(details) || id === 'OS-03') {
    return 'sudo softwareupdate --schedule off 로 자동 업데이트 비활성화 (작업 완료 후 재활성화)';
  }
  if (/zombie|좀비/i.test(details) || id === 'OS-06') {
    return 'ps aux | awk \'$8=="Z"\' 로 좀비 프로세스 확인 후 kill -9 <parent_pid> 로 부모 프로세스 종료';
  }
  if (/timezone|타임존/i.test(details) || id === 'OS-04') {
    return 'sudo systemsetup -settimezone Asia/Seoul 로 타임존 설정';
  }
  if (/locale/i.test(details) || id === 'OS-05') {
    return 'export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 를 ~/.zshrc에 추가';
  }

  // Build patterns
  if (/build.*fail/i.test(details)) {
    return 'npm run build 2>&1 | tail -20 으로 빌드 에러 확인 후 수정';
  }
  if (/port.*in use/i.test(details)) {
    return 'lsof -ti:<port> | xargs kill -9 로 포트 점유 프로세스 종료';
  }

  // Fallback: extract actionable info from details
  if (/not found:\s*(.+)/i.test(details)) {
    const match = details.match(/not found:\s*(.+)/i);
    const target = match?.[1] || '';
    return `${target} 설정 필요 — 환경변수 또는 설정 파일을 확인하고 export ${target.toUpperCase().replace(/[^A-Z_]/g, '_')}="value" 실행`;
  }
  if (/not available:\s*(.+)/i.test(details)) {
    const match = details.match(/not available:\s*(.+)/i);
    return `${match?.[1]} — 시스템 상태를 확인하고 필요한 서비스를 시작하세요`;
  }
  if (/not running:\s*(.+)/i.test(details)) {
    const match = details.match(/not running:\s*(.+)/i);
    return `${match?.[1]} 프로세스 시작 필요 — brew services start ${match?.[1]?.toLowerCase()} 또는 해당 서비스 실행`;
  }
  if (/not installed:\s*(.+)/i.test(details)) {
    const match = details.match(/not installed:\s*(.+)/i);
    return `brew install ${match?.[1]?.toLowerCase()} 또는 해당 패키지 매니저로 설치`;
  }

  // Category-based fallback with specific commands
  switch (result.category) {
    case 'HW': return 'system_profiler SPHardwareDataType 로 하드웨어 상태 확인';
    case 'NET': return 'networkQuality && curl -sI https://httpbin.org/status/200 로 네트워크 상태 점검';
    case 'AUTH': return 'env | grep -i "key\\|token\\|secret" 로 설정된 인증 정보 확인';
    case 'RT': return 'which node python3 docker 로 런타임 설치 상태 확인';
    case 'BT': return 'npm run build 2>&1 | tail -20 으로 빌드 상태 확인';
    case 'DB': return 'brew services list | grep -E "postgres|mysql|mongo|redis" 로 DB 서비스 상태 확인';
    case 'GIT': return 'git status && git remote -v 로 Git 상태 확인';
    case 'OS': return 'sw_vers && uname -a 로 OS 상태 확인';
    case 'COST': return 'API 제공자 대시보드에서 사용량 및 비용 한도 확인';
    case 'MON': return '모니터링 도구(Grafana, Datadog 등) 설정 또는 로그 수집 경로 확인';
    default: return 'echo "상태 확인 필요" && env | head -20';
  }
}

export async function executeAutoFix(
  result: CheckResult,
  classification: FixClassification
): Promise<AutoFixResult> {
  if (classification.fix_type === 'manual-only') {
    return {
      item_id: result.item_id,
      fix_command: classification.fix_command,
      fix_type: 'manual-only',
      success: false,
      message: classification.reason,
    };
  }

  try {
    // Execute the fix
    await execaCommand(classification.fix_command, {
      shell: true,
      timeout: TIMEOUT_INDIVIDUAL,
      reject: false,
    });

    // Re-verify
    const recheck = await execaCommand(result.verification_command, {
      shell: true,
      timeout: TIMEOUT_INDIVIDUAL,
      reject: false,
    });

    const output = recheck.stdout.trim().toLowerCase();
    const isFixed = recheck.exitCode === 0 &&
      !output.includes('not found') &&
      !output.includes('not installed') &&
      !output.includes('not running') &&
      !output.includes('not available');

    return {
      item_id: result.item_id,
      fix_command: classification.fix_command,
      fix_type: 'auto-fixable',
      success: isFixed,
      message: isFixed ? '자동 수정 성공' : '자동 수정 실패 — 수동 조치 필요',
    };
  } catch {
    return {
      item_id: result.item_id,
      fix_command: classification.fix_command,
      fix_type: 'auto-fixable',
      success: false,
      message: '자동 수정 실행 중 에러 발생',
    };
  }
}
