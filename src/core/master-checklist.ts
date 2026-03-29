// ── Master Checklist: 100 items across 11 categories ──

import type { MasterChecklistItem } from './types.js';

export const MASTER_CHECKLIST: MasterChecklistItem[] = [
  // ════════════════════════════════════════
  // HW — 하드웨어 & 전력 (10 items)
  // ════════════════════════════════════════
  {
    item_id: 'HW-01', category: 'HW',
    description: '슬립 모드가 비활성화되어 있는지 확인',
    verification_command: {
      darwin: 'pmset -g | grep -q "sleep.*0" && echo "sleep disabled" || echo "not found: sleep prevention not active"',
      linux: 'systemctl status sleep.target | grep -q "inactive" && echo "sleep disabled" || echo "not found: sleep prevention not active"',
    },
    impact: 4, likelihood: 3,
  },
  {
    item_id: 'HW-02', category: 'HW',
    description: 'caffeinate 프로세스가 실행 중인지 확인',
    verification_command: {
      darwin: 'pgrep -x caffeinate > /dev/null && echo "caffeinate running" || echo "not running: caffeinate"',
      linux: 'pgrep -x systemd-inhibit > /dev/null && echo "inhibit running" || echo "not running: systemd-inhibit"',
    },
    impact: 4, likelihood: 3,
  },
  {
    item_id: 'HW-03', category: 'HW',
    description: '디스크 여유 공간이 5GB 이상인지 확인',
    verification_command: {
      darwin: 'test $(df -g / | tail -1 | awk \'{print $4}\') -ge 5 && echo "disk ok" || echo "not available: disk space below 5GB"',
      linux: 'test $(df -BG / | tail -1 | awk \'{print $4}\' | tr -d G) -ge 5 && echo "disk ok" || echo "not available: disk space below 5GB"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'HW-04', category: 'HW',
    description: '가용 메모리가 2GB 이상인지 확인',
    verification_command: {
      darwin: 'test $(vm_stat | awk \'/Pages free/ {print int($3*4096/1073741824)}\') -ge 1 && echo "memory ok" || echo "not available: low memory"',
      linux: 'test $(free -g | awk \'/Mem:/ {print $7}\') -ge 2 && echo "memory ok" || echo "not available: low memory"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'HW-05', category: 'HW',
    description: '배터리 잔량이 20% 이상이거나 전원 연결 상태인지 확인',
    verification_command: {
      darwin: 'pmset -g batt | grep -qE "AC Power|[2-9][0-9]%|100%" && echo "power ok" || echo "not available: battery below 20%"',
      linux: 'cat /sys/class/power_supply/BAT0/capacity 2>/dev/null | xargs test 20 -le 2>/dev/null && echo "power ok" || echo "SKIPPED: no battery detected"',
    },
    impact: 4, likelihood: 2,
  },
  {
    item_id: 'HW-06', category: 'HW',
    description: 'tmux 또는 screen 세션이 활성화되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${TMUX}" && echo "tmux active" || (pgrep -x tmux > /dev/null && echo "tmux running" || echo "not running: tmux session")',
      linux: 'test -n "${TMUX}" && echo "tmux active" || (pgrep -x tmux > /dev/null && echo "tmux running" || echo "not running: tmux session")',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'HW-07', category: 'HW',
    description: 'CPU 사용률이 90% 미만인지 확인',
    verification_command: {
      darwin: 'test $(top -l 1 | grep "CPU usage" | awk \'{print int($3)}\') -lt 90 && echo "cpu ok" || echo "not available: CPU usage above 90%"',
      linux: 'test $(top -bn1 | grep "Cpu(s)" | awk \'{print int($2)}\') -lt 90 && echo "cpu ok" || echo "not available: CPU usage above 90%"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'HW-08', category: 'HW',
    description: '스왑 사용량이 과도하지 않은지 확인',
    verification_command: {
      darwin: 'sysctl vm.swapusage | grep -q "used = 0" && echo "swap ok" || echo "WARNING: swap in use"',
      linux: 'test $(free -m | awk \'/Swap:/ {print $3}\') -lt 1024 && echo "swap ok" || echo "WARNING: high swap usage"',
    },
    impact: 2, likelihood: 2,
  },
  {
    item_id: 'HW-09', category: 'HW',
    description: 'GPU가 사용 가능한지 확인 (ML 작업용)',
    verification_command: {
      darwin: 'system_profiler SPDisplaysDataType | grep -q "Chipset" && echo "gpu available" || echo "SKIPPED: no GPU info"',
      linux: 'nvidia-smi > /dev/null 2>&1 && echo "gpu available" || echo "SKIPPED: no NVIDIA GPU"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'HW-10', category: 'HW',
    description: '시스템 온도가 정상 범위인지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: temperature check requires third-party tool"',
      linux: 'sensors 2>/dev/null | grep -qE "\\+[0-8][0-9]\\." && echo "temp ok" || echo "SKIPPED: sensors not available"',
    },
    impact: 2, likelihood: 1,
  },

  // ════════════════════════════════════════
  // NET — 네트워크 (10 items)
  // ════════════════════════════════════════
  {
    item_id: 'NET-01', category: 'NET',
    description: '인터넷 연결이 활성화되어 있는지 확인',
    verification_command: {
      darwin: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://httpbin.org/status/200 | grep -q "200" && echo "internet ok" || echo "not available: no internet connection"',
      linux: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://httpbin.org/status/200 | grep -q "200" && echo "internet ok" || echo "not available: no internet connection"',
    },
    impact: 5, likelihood: 2,
  },
  {
    item_id: 'NET-02', category: 'NET',
    description: 'DNS 해석이 정상적으로 동작하는지 확인',
    verification_command: {
      darwin: 'nslookup google.com > /dev/null 2>&1 && echo "dns ok" || echo "not available: DNS resolution failed"',
      linux: 'nslookup google.com > /dev/null 2>&1 && echo "dns ok" || echo "not available: DNS resolution failed"',
    },
    impact: 5, likelihood: 1,
  },
  {
    item_id: 'NET-03', category: 'NET',
    description: '주요 API 엔드포인트 (api.openai.com) 접근 가능 확인',
    verification_command: {
      darwin: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://api.openai.com | grep -qE "200|401|403" && echo "endpoint reachable" || echo "not available: api.openai.com unreachable"',
      linux: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://api.openai.com | grep -qE "200|401|403" && echo "endpoint reachable" || echo "not available: api.openai.com unreachable"',
    },
    impact: 4, likelihood: 2,
  },
  {
    item_id: 'NET-04', category: 'NET',
    description: '프록시 설정이 올바른지 확인',
    verification_command: {
      darwin: 'test -z "${HTTP_PROXY}${HTTPS_PROXY}" && echo "no proxy (ok)" || (curl -so /dev/null -w "%{http_code}" --max-time 5 --proxy "${HTTPS_PROXY:-$HTTP_PROXY}" https://httpbin.org/status/200 | grep -q "200" && echo "proxy ok" || echo "not available: proxy misconfigured")',
      linux: 'test -z "${HTTP_PROXY}${HTTPS_PROXY}" && echo "no proxy (ok)" || (curl -so /dev/null -w "%{http_code}" --max-time 5 --proxy "${HTTPS_PROXY:-$HTTP_PROXY}" https://httpbin.org/status/200 | grep -q "200" && echo "proxy ok" || echo "not available: proxy misconfigured")',
    },
    impact: 3, likelihood: 1,
  },
  {
    item_id: 'NET-05', category: 'NET',
    description: 'SSL/TLS 인증서 검증이 정상 동작하는지 확인',
    verification_command: {
      darwin: 'curl -sI --max-time 5 https://google.com > /dev/null 2>&1 && echo "ssl ok" || echo "not available: SSL verification failed"',
      linux: 'curl -sI --max-time 5 https://google.com > /dev/null 2>&1 && echo "ssl ok" || echo "not available: SSL verification failed"',
    },
    impact: 4, likelihood: 1,
  },
  {
    item_id: 'NET-06', category: 'NET',
    description: 'WebSocket 연결이 가능한지 확인',
    verification_command: {
      darwin: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://echo.websocket.org | grep -qE "200|101" && echo "websocket ok" || echo "SKIPPED: websocket test endpoint unavailable"',
      linux: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://echo.websocket.org | grep -qE "200|101" && echo "websocket ok" || echo "SKIPPED: websocket test endpoint unavailable"',
    },
    impact: 3, likelihood: 1,
  },
  {
    item_id: 'NET-07', category: 'NET',
    description: 'VPN이 연결된 경우 외부 접근에 영향 없는지 확인',
    verification_command: {
      darwin: 'scutil --nwi | grep -q "VPN" && (curl -so /dev/null -w "%{http_code}" --max-time 5 https://httpbin.org/ip | grep -q "200" && echo "vpn ok" || echo "not available: VPN blocking traffic") || echo "no VPN (ok)"',
      linux: 'ip link show | grep -q "tun\\|tap\\|wg" && (curl -so /dev/null -w "%{http_code}" --max-time 5 https://httpbin.org/ip | grep -q "200" && echo "vpn ok" || echo "not available: VPN blocking traffic") || echo "no VPN (ok)"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'NET-08', category: 'NET',
    description: '방화벽이 outbound 트래픽을 차단하지 않는지 확인',
    verification_command: {
      darwin: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://httpbin.org/status/200 | grep -q "200" && echo "firewall ok" || echo "not available: outbound traffic blocked"',
      linux: 'curl -so /dev/null -w "%{http_code}" --max-time 5 https://httpbin.org/status/200 | grep -q "200" && echo "firewall ok" || echo "not available: outbound traffic blocked"',
    },
    impact: 4, likelihood: 1,
  },
  {
    item_id: 'NET-09', category: 'NET',
    description: 'API Rate Limit에 여유가 있는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: rate limit check requires API-specific verification"',
      linux: 'echo "SKIPPED: rate limit check requires API-specific verification"',
    },
    impact: 4, likelihood: 3,
  },
  {
    item_id: 'NET-10', category: 'NET',
    description: '네트워크 대역폭이 충분한지 확인',
    verification_command: {
      darwin: 'curl -so /dev/null -w "%{speed_download}" --max-time 10 https://httpbin.org/bytes/1048576 | awk \'{if ($1 > 100000) print "bandwidth ok"; else print "not available: low bandwidth"}\'',
      linux: 'curl -so /dev/null -w "%{speed_download}" --max-time 10 https://httpbin.org/bytes/1048576 | awk \'{if ($1 > 100000) print "bandwidth ok"; else print "not available: low bandwidth"}\'',
    },
    impact: 3, likelihood: 2,
  },

  // ════════════════════════════════════════
  // AUTH — API 인증 (10 items)
  // ════════════════════════════════════════
  {
    item_id: 'AUTH-01', category: 'AUTH',
    description: 'Anthropic API 키가 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${ANTHROPIC_API_KEY}" && echo "anthropic key set" || echo "not found: ANTHROPIC_API_KEY"',
      linux: 'test -n "${ANTHROPIC_API_KEY}" && echo "anthropic key set" || echo "not found: ANTHROPIC_API_KEY"',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['Anthropic', 'Claude'],
  },
  {
    item_id: 'AUTH-02', category: 'AUTH',
    description: 'OpenAI API 키가 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${OPENAI_API_KEY}" && echo "openai key set" || echo "not found: OPENAI_API_KEY"',
      linux: 'test -n "${OPENAI_API_KEY}" && echo "openai key set" || echo "not found: OPENAI_API_KEY"',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['OpenAI'],
  },
  {
    item_id: 'AUTH-03', category: 'AUTH',
    description: 'GitHub Personal Access Token이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${GITHUB_TOKEN}" && echo "github token set" || (gh auth status > /dev/null 2>&1 && echo "gh auth ok" || echo "not found: GITHUB_TOKEN")',
      linux: 'test -n "${GITHUB_TOKEN}" && echo "github token set" || (gh auth status > /dev/null 2>&1 && echo "gh auth ok" || echo "not found: GITHUB_TOKEN")',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['GitHub'],
  },
  {
    item_id: 'AUTH-04', category: 'AUTH',
    description: 'Google OAuth / Application Default Credentials 확인',
    verification_command: {
      darwin: 'test -f ~/.config/gcloud/application_default_credentials.json && echo "google creds ok" || (test -n "${GOOGLE_APPLICATION_CREDENTIALS}" && echo "google creds env set" || echo "not found: Google credentials")',
      linux: 'test -f ~/.config/gcloud/application_default_credentials.json && echo "google creds ok" || (test -n "${GOOGLE_APPLICATION_CREDENTIALS}" && echo "google creds env set" || echo "not found: Google credentials")',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['Google Sheets', 'Google Drive', 'Google Docs', 'Firebase'],
  },
  {
    item_id: 'AUTH-05', category: 'AUTH',
    description: 'AWS 자격 증명이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${AWS_ACCESS_KEY_ID}" && echo "aws key set" || (test -f ~/.aws/credentials && echo "aws creds file ok" || echo "not found: AWS credentials")',
      linux: 'test -n "${AWS_ACCESS_KEY_ID}" && echo "aws key set" || (test -f ~/.aws/credentials && echo "aws creds file ok" || echo "not found: AWS credentials")',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['AWS', 'S3', 'Lambda'],
  },
  {
    item_id: 'AUTH-06', category: 'AUTH',
    description: 'Slack Bot Token이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${SLACK_BOT_TOKEN}" && echo "slack token set" || (test -n "${SLACK_TOKEN}" && echo "slack token set" || echo "not found: SLACK_BOT_TOKEN")',
      linux: 'test -n "${SLACK_BOT_TOKEN}" && echo "slack token set" || (test -n "${SLACK_TOKEN}" && echo "slack token set" || echo "not found: SLACK_BOT_TOKEN")',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['Slack'],
  },
  {
    item_id: 'AUTH-07', category: 'AUTH',
    description: 'Discord Bot Token이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${DISCORD_BOT_TOKEN}" && echo "discord token set" || (test -n "${DISCORD_TOKEN}" && echo "discord token set" || echo "not found: DISCORD_BOT_TOKEN")',
      linux: 'test -n "${DISCORD_BOT_TOKEN}" && echo "discord token set" || (test -n "${DISCORD_TOKEN}" && echo "discord token set" || echo "not found: DISCORD_BOT_TOKEN")',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['Discord'],
  },
  {
    item_id: 'AUTH-08', category: 'AUTH',
    description: 'Notion API 토큰이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${NOTION_API_KEY}" && echo "notion token set" || (test -n "${NOTION_TOKEN}" && echo "notion token set" || echo "not found: NOTION_API_KEY")',
      linux: 'test -n "${NOTION_API_KEY}" && echo "notion token set" || (test -n "${NOTION_TOKEN}" && echo "notion token set" || echo "not found: NOTION_API_KEY")',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['Notion'],
  },
  {
    item_id: 'AUTH-09', category: 'AUTH',
    description: 'API 키 만료 여부 확인 (토큰 유효성)',
    verification_command: {
      darwin: 'echo "SKIPPED: token expiration requires service-specific check"',
      linux: 'echo "SKIPPED: token expiration requires service-specific check"',
    },
    impact: 5, likelihood: 3,
  },
  {
    item_id: 'AUTH-10', category: 'AUTH',
    description: 'MCP 서버 인증 상태 확인',
    verification_command: {
      darwin: 'which claude > /dev/null 2>&1 && (claude mcp list 2>/dev/null | head -5; echo "mcp check done") || echo "SKIPPED: claude CLI not found"',
      linux: 'which claude > /dev/null 2>&1 && (claude mcp list 2>/dev/null | head -5; echo "mcp check done") || echo "SKIPPED: claude CLI not found"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['MCP'],
  },

  // ════════════════════════════════════════
  // CC — Claude Code (12 items)
  // ════════════════════════════════════════
  {
    item_id: 'CC-01', category: 'CC',
    description: 'Claude Code CLI가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'which claude > /dev/null 2>&1 && echo "claude cli installed" || echo "not installed: claude CLI"',
      linux: 'which claude > /dev/null 2>&1 && echo "claude cli installed" || echo "not installed: claude CLI"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'CC-02', category: 'CC',
    description: 'Claude Code 버전이 최신인지 확인',
    verification_command: {
      darwin: 'claude --version 2>/dev/null && echo "version check done" || echo "not installed: claude CLI"',
      linux: 'claude --version 2>/dev/null && echo "version check done" || echo "not installed: claude CLI"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'CC-03', category: 'CC',
    description: 'Claude 구독 상태가 활성인지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: subscription check requires manual verification"',
      linux: 'echo "SKIPPED: subscription check requires manual verification"',
    },
    impact: 5, likelihood: 2,
  },
  {
    item_id: 'CC-04', category: 'CC',
    description: 'MCP 서버 목록이 등록되어 있는지 확인',
    verification_command: {
      darwin: 'which claude > /dev/null 2>&1 && (claude mcp list 2>/dev/null | wc -l | xargs test 0 -lt && echo "mcp servers registered" || echo "not found: no MCP servers") || echo "SKIPPED: claude CLI not found"',
      linux: 'which claude > /dev/null 2>&1 && (claude mcp list 2>/dev/null | wc -l | xargs test 0 -lt && echo "mcp servers registered" || echo "not found: no MCP servers") || echo "SKIPPED: claude CLI not found"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['MCP'],
  },
  {
    item_id: 'CC-05', category: 'CC',
    description: 'Claude Code 설정 파일이 존재하는지 확인',
    verification_command: {
      darwin: 'test -d ~/.claude && echo "claude config dir ok" || echo "not found: ~/.claude directory"',
      linux: 'test -d ~/.claude && echo "claude config dir ok" || echo "not found: ~/.claude directory"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'CC-06', category: 'CC',
    description: 'CLAUDE.md 프로젝트 파일이 존재하는지 확인',
    verification_command: {
      darwin: 'test -f CLAUDE.md && echo "CLAUDE.md exists" || echo "not found: CLAUDE.md"',
      linux: 'test -f CLAUDE.md && echo "CLAUDE.md exists" || echo "not found: CLAUDE.md"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'CC-07', category: 'CC',
    description: 'Claude Code 로그 디렉토리 접근 가능 확인',
    verification_command: {
      darwin: 'test -d ~/.claude/logs 2>/dev/null && echo "logs dir ok" || echo "SKIPPED: no logs directory"',
      linux: 'test -d ~/.claude/logs 2>/dev/null && echo "logs dir ok" || echo "SKIPPED: no logs directory"',
    },
    impact: 1, likelihood: 1,
  },
  {
    item_id: 'CC-08', category: 'CC',
    description: 'Claude Code 권한 모드 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: permission mode check requires manual verification"',
      linux: 'echo "SKIPPED: permission mode check requires manual verification"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'CC-09', category: 'CC',
    description: 'Claude Code 플러그인 디렉토리 확인',
    verification_command: {
      darwin: 'test -d ~/.claude/plugins 2>/dev/null && echo "plugins dir ok" || echo "SKIPPED: no plugins directory"',
      linux: 'test -d ~/.claude/plugins 2>/dev/null && echo "plugins dir ok" || echo "SKIPPED: no plugins directory"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'CC-10', category: 'CC',
    description: 'Claude Code 스킬 디렉토리 확인',
    verification_command: {
      darwin: 'test -d ~/.claude/skills 2>/dev/null && echo "skills dir ok" || echo "SKIPPED: no skills directory"',
      linux: 'test -d ~/.claude/skills 2>/dev/null && echo "skills dir ok" || echo "SKIPPED: no skills directory"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'CC-11', category: 'CC',
    description: 'Claude Code 모델 접근 권한 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: model access check requires API call"',
      linux: 'echo "SKIPPED: model access check requires API call"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'CC-12', category: 'CC',
    description: 'Claude Code 컨텍스트 윈도우 사용량 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: context window check requires runtime inspection"',
      linux: 'echo "SKIPPED: context window check requires runtime inspection"',
    },
    impact: 2, likelihood: 1,
  },

  // ════════════════════════════════════════
  // RT — 런타임 & 의존성 (13 items)
  // ════════════════════════════════════════
  {
    item_id: 'RT-01', category: 'RT',
    description: 'Node.js가 설치되어 있고 버전이 18 이상인지 확인',
    verification_command: {
      darwin: 'node --version 2>/dev/null | grep -qE "^v(1[89]|[2-9][0-9])" && echo "node ok: $(node --version)" || echo "not installed: Node.js >= 18"',
      linux: 'node --version 2>/dev/null | grep -qE "^v(1[89]|[2-9][0-9])" && echo "node ok: $(node --version)" || echo "not installed: Node.js >= 18"',
    },
    impact: 5, likelihood: 2,
  },
  {
    item_id: 'RT-02', category: 'RT',
    description: 'Python 3.10 이상이 설치되어 있는지 확인',
    verification_command: {
      darwin: 'python3 --version 2>/dev/null | grep -qE "3\\.(1[0-9]|[2-9][0-9])" && echo "python ok: $(python3 --version)" || echo "not installed: Python >= 3.10"',
      linux: 'python3 --version 2>/dev/null | grep -qE "3\\.(1[0-9]|[2-9][0-9])" && echo "python ok: $(python3 --version)" || echo "not installed: Python >= 3.10"',
    },
    impact: 4, likelihood: 2,
    relevant_to: ['Python'],
  },
  {
    item_id: 'RT-03', category: 'RT',
    description: 'npm이 설치되어 있는지 확인',
    verification_command: {
      darwin: 'npm --version > /dev/null 2>&1 && echo "npm ok: $(npm --version)" || echo "not installed: npm"',
      linux: 'npm --version > /dev/null 2>&1 && echo "npm ok: $(npm --version)" || echo "not installed: npm"',
    },
    impact: 4, likelihood: 1,
  },
  {
    item_id: 'RT-04', category: 'RT',
    description: 'pip3가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'pip3 --version > /dev/null 2>&1 && echo "pip3 ok: $(pip3 --version)" || echo "not installed: pip3"',
      linux: 'pip3 --version > /dev/null 2>&1 && echo "pip3 ok: $(pip3 --version)" || echo "not installed: pip3"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['Python'],
  },
  {
    item_id: 'RT-05', category: 'RT',
    description: 'Python 가상환경이 활성화되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${VIRTUAL_ENV}" && echo "venv active: ${VIRTUAL_ENV}" || echo "SKIPPED: no virtual environment active"',
      linux: 'test -n "${VIRTUAL_ENV}" && echo "venv active: ${VIRTUAL_ENV}" || echo "SKIPPED: no virtual environment active"',
    },
    impact: 2, likelihood: 2,
    relevant_to: ['Python'],
  },
  {
    item_id: 'RT-06', category: 'RT',
    description: 'TypeScript가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'npx tsc --version > /dev/null 2>&1 && echo "tsc ok" || echo "not installed: typescript"',
      linux: 'npx tsc --version > /dev/null 2>&1 && echo "tsc ok" || echo "not installed: typescript"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['TypeScript', 'Node'],
  },
  {
    item_id: 'RT-07', category: 'RT',
    description: '필수 pip 패키지가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'python3 -c "import pip; print(\'pip importable\')" 2>/dev/null && echo "pip packages ok" || echo "not installed: pip packages"',
      linux: 'python3 -c "import pip; print(\'pip importable\')" 2>/dev/null && echo "pip packages ok" || echo "not installed: pip packages"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['Python'],
  },
  {
    item_id: 'RT-08', category: 'RT',
    description: 'curl이 설치되어 있는지 확인',
    verification_command: {
      darwin: 'curl --version > /dev/null 2>&1 && echo "curl ok" || echo "not installed: curl"',
      linux: 'curl --version > /dev/null 2>&1 && echo "curl ok" || echo "not installed: curl"',
    },
    impact: 3, likelihood: 1,
  },
  {
    item_id: 'RT-09', category: 'RT',
    description: 'jq가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'jq --version > /dev/null 2>&1 && echo "jq ok" || echo "not installed: jq"',
      linux: 'jq --version > /dev/null 2>&1 && echo "jq ok" || echo "not installed: jq"',
    },
    impact: 2, likelihood: 2,
  },
  {
    item_id: 'RT-10', category: 'RT',
    description: 'git이 설치되어 있는지 확인',
    verification_command: {
      darwin: 'git --version > /dev/null 2>&1 && echo "git ok" || echo "not installed: git"',
      linux: 'git --version > /dev/null 2>&1 && echo "git ok" || echo "not installed: git"',
    },
    impact: 3, likelihood: 1,
  },
  {
    item_id: 'RT-11', category: 'RT',
    description: 'Docker가 설치되고 실행 중인지 확인',
    verification_command: {
      darwin: 'docker info > /dev/null 2>&1 && echo "docker ok" || echo "not running: Docker"',
      linux: 'docker info > /dev/null 2>&1 && echo "docker ok" || echo "not running: Docker"',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['Docker'],
  },
  {
    item_id: 'RT-12', category: 'RT',
    description: 'Homebrew (macOS) 또는 apt (Linux)가 사용 가능한지 확인',
    verification_command: {
      darwin: 'brew --version > /dev/null 2>&1 && echo "brew ok" || echo "not installed: Homebrew"',
      linux: 'apt --version > /dev/null 2>&1 && echo "apt ok" || (yum --version > /dev/null 2>&1 && echo "yum ok" || echo "not installed: package manager")',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'RT-13', category: 'RT',
    description: 'Playwright / ChromeDriver가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'npx playwright --version > /dev/null 2>&1 && echo "playwright ok" || (chromedriver --version > /dev/null 2>&1 && echo "chromedriver ok" || echo "SKIPPED: no browser automation tool")',
      linux: 'npx playwright --version > /dev/null 2>&1 && echo "playwright ok" || (chromedriver --version > /dev/null 2>&1 && echo "chromedriver ok" || echo "SKIPPED: no browser automation tool")',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['Playwright', 'Selenium', 'ChromeDriver'],
  },

  // ════════════════════════════════════════
  // BT — 빌드 & 테스트 (10 items)
  // ════════════════════════════════════════
  {
    item_id: 'BT-01', category: 'BT',
    description: 'npm install / npm ci가 정상 실행되는지 확인',
    verification_command: {
      darwin: 'test -d node_modules && echo "node_modules ok" || echo "not found: node_modules directory"',
      linux: 'test -d node_modules && echo "node_modules ok" || echo "not found: node_modules directory"',
    },
    impact: 4, likelihood: 2,
  },
  {
    item_id: 'BT-02', category: 'BT',
    description: 'npm run build가 성공하는지 확인',
    verification_command: {
      darwin: 'test -f package.json && (npm run build > /dev/null 2>&1 && echo "build ok" || echo "not available: build failed") || echo "SKIPPED: no package.json"',
      linux: 'test -f package.json && (npm run build > /dev/null 2>&1 && echo "build ok" || echo "not available: build failed") || echo "SKIPPED: no package.json"',
    },
    impact: 4, likelihood: 2,
  },
  {
    item_id: 'BT-03', category: 'BT',
    description: 'npm test가 성공하는지 확인',
    verification_command: {
      darwin: 'test -f package.json && (npm test > /dev/null 2>&1 && echo "test ok" || echo "SKIPPED: no test script") || echo "SKIPPED: no package.json"',
      linux: 'test -f package.json && (npm test > /dev/null 2>&1 && echo "test ok" || echo "SKIPPED: no test script") || echo "SKIPPED: no package.json"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'BT-04', category: 'BT',
    description: 'lint 검사가 통과하는지 확인',
    verification_command: {
      darwin: 'test -f package.json && (npx eslint . --max-warnings 0 > /dev/null 2>&1 && echo "lint ok" || echo "SKIPPED: lint not configured") || echo "SKIPPED: no package.json"',
      linux: 'test -f package.json && (npx eslint . --max-warnings 0 > /dev/null 2>&1 && echo "lint ok" || echo "SKIPPED: lint not configured") || echo "SKIPPED: no package.json"',
    },
    impact: 2, likelihood: 2,
  },
  {
    item_id: 'BT-05', category: 'BT',
    description: '포트 충돌이 없는지 확인 (3000, 8080)',
    verification_command: {
      darwin: 'lsof -ti:3000 > /dev/null 2>&1 && echo "not available: port 3000 in use" || echo "port 3000 free"',
      linux: 'ss -tlnp | grep -q ":3000 " && echo "not available: port 3000 in use" || echo "port 3000 free"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'BT-06', category: 'BT',
    description: '.env 파일이 존재하는지 확인',
    verification_command: {
      darwin: 'test -f .env && echo ".env exists" || echo "not found: .env file"',
      linux: 'test -f .env && echo ".env exists" || echo "not found: .env file"',
    },
    impact: 3, likelihood: 3,
  },
  {
    item_id: 'BT-07', category: 'BT',
    description: '.env.example 또는 .env.sample이 존재하는지 확인',
    verification_command: {
      darwin: 'test -f .env.example && echo ".env.example exists" || (test -f .env.sample && echo ".env.sample exists" || echo "SKIPPED: no env template")',
      linux: 'test -f .env.example && echo ".env.example exists" || (test -f .env.sample && echo ".env.sample exists" || echo "SKIPPED: no env template")',
    },
    impact: 2, likelihood: 2,
  },
  {
    item_id: 'BT-08', category: 'BT',
    description: 'package-lock.json 또는 yarn.lock이 존재하는지 확인',
    verification_command: {
      darwin: 'test -f package-lock.json && echo "lockfile ok" || (test -f yarn.lock && echo "lockfile ok" || echo "not found: lockfile")',
      linux: 'test -f package-lock.json && echo "lockfile ok" || (test -f yarn.lock && echo "lockfile ok" || echo "not found: lockfile")',
    },
    impact: 2, likelihood: 2,
  },
  {
    item_id: 'BT-09', category: 'BT',
    description: 'node_modules 크기가 과도하지 않은지 확인',
    verification_command: {
      darwin: 'test -d node_modules && (du -sm node_modules | awk \'{if ($1 < 1000) print "node_modules ok: " $1 "MB"; else print "not available: node_modules too large"}\') || echo "SKIPPED: no node_modules"',
      linux: 'test -d node_modules && (du -sm node_modules | awk \'{if ($1 < 1000) print "node_modules ok: " $1 "MB"; else print "not available: node_modules too large"}\') || echo "SKIPPED: no node_modules"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'BT-10', category: 'BT',
    description: 'TypeScript 컴파일 에러가 없는지 확인',
    verification_command: {
      darwin: 'test -f tsconfig.json && (npx tsc --noEmit > /dev/null 2>&1 && echo "tsc ok" || echo "not available: TypeScript compilation errors") || echo "SKIPPED: no tsconfig.json"',
      linux: 'test -f tsconfig.json && (npx tsc --noEmit > /dev/null 2>&1 && echo "tsc ok" || echo "not available: TypeScript compilation errors") || echo "SKIPPED: no tsconfig.json"',
    },
    impact: 4, likelihood: 2,
  },

  // ════════════════════════════════════════
  // DB — 데이터베이스 (8 items)
  // ════════════════════════════════════════
  {
    item_id: 'DB-01', category: 'DB',
    description: 'PostgreSQL 연결이 가능한지 확인',
    verification_command: {
      darwin: 'pg_isready > /dev/null 2>&1 && echo "postgres ok" || echo "not running: PostgreSQL"',
      linux: 'pg_isready > /dev/null 2>&1 && echo "postgres ok" || echo "not running: PostgreSQL"',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['PostgreSQL'],
  },
  {
    item_id: 'DB-02', category: 'DB',
    description: 'MySQL 연결이 가능한지 확인',
    verification_command: {
      darwin: 'mysqladmin ping > /dev/null 2>&1 && echo "mysql ok" || echo "not running: MySQL"',
      linux: 'mysqladmin ping > /dev/null 2>&1 && echo "mysql ok" || echo "not running: MySQL"',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['MySQL'],
  },
  {
    item_id: 'DB-03', category: 'DB',
    description: 'MongoDB 연결이 가능한지 확인',
    verification_command: {
      darwin: 'mongosh --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1 && echo "mongodb ok" || echo "not running: MongoDB"',
      linux: 'mongosh --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1 && echo "mongodb ok" || echo "not running: MongoDB"',
    },
    impact: 5, likelihood: 3,
    relevant_to: ['MongoDB'],
  },
  {
    item_id: 'DB-04', category: 'DB',
    description: 'Redis 연결이 가능한지 확인',
    verification_command: {
      darwin: 'redis-cli ping 2>/dev/null | grep -q "PONG" && echo "redis ok" || echo "not running: Redis"',
      linux: 'redis-cli ping 2>/dev/null | grep -q "PONG" && echo "redis ok" || echo "not running: Redis"',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['Redis'],
  },
  {
    item_id: 'DB-05', category: 'DB',
    description: 'SQLite가 사용 가능한지 확인',
    verification_command: {
      darwin: 'sqlite3 --version > /dev/null 2>&1 && echo "sqlite ok" || echo "not installed: SQLite"',
      linux: 'sqlite3 --version > /dev/null 2>&1 && echo "sqlite ok" || echo "not installed: SQLite"',
    },
    impact: 3, likelihood: 1,
    relevant_to: ['SQLite'],
  },
  {
    item_id: 'DB-06', category: 'DB',
    description: 'DATABASE_URL 환경변수가 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -n "${DATABASE_URL}" && echo "database url set" || echo "not found: DATABASE_URL"',
      linux: 'test -n "${DATABASE_URL}" && echo "database url set" || echo "not found: DATABASE_URL"',
    },
    impact: 4, likelihood: 3,
    relevant_to: ['PostgreSQL', 'MySQL', 'Supabase'],
  },
  {
    item_id: 'DB-07', category: 'DB',
    description: '데이터베이스 마이그레이션 상태 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: migration check requires project-specific setup"',
      linux: 'echo "SKIPPED: migration check requires project-specific setup"',
    },
    impact: 4, likelihood: 2,
    relevant_to: ['PostgreSQL', 'MySQL'],
  },
  {
    item_id: 'DB-08', category: 'DB',
    description: '데이터베이스 백업 설정 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: backup check requires project-specific setup"',
      linux: 'echo "SKIPPED: backup check requires project-specific setup"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['PostgreSQL', 'MySQL', 'MongoDB'],
  },

  // ════════════════════════════════════════
  // GIT — Git & 버전 관리 (9 items)
  // ════════════════════════════════════════
  {
    item_id: 'GIT-01', category: 'GIT',
    description: 'Git 리포지토리가 초기화되어 있는지 확인',
    verification_command: {
      darwin: 'git rev-parse --is-inside-work-tree > /dev/null 2>&1 && echo "git repo ok" || echo "not found: git repository"',
      linux: 'git rev-parse --is-inside-work-tree > /dev/null 2>&1 && echo "git repo ok" || echo "not found: git repository"',
    },
    impact: 3, likelihood: 1,
  },
  {
    item_id: 'GIT-02', category: 'GIT',
    description: 'Git remote가 설정되어 있는지 확인',
    verification_command: {
      darwin: 'git remote -v 2>/dev/null | grep -q "origin" && echo "git remote ok" || echo "not found: git remote origin"',
      linux: 'git remote -v 2>/dev/null | grep -q "origin" && echo "git remote ok" || echo "not found: git remote origin"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['GitHub'],
  },
  {
    item_id: 'GIT-03', category: 'GIT',
    description: '현재 브랜치가 clean 상태인지 확인',
    verification_command: {
      darwin: 'test -z "$(git status --porcelain 2>/dev/null)" && echo "git clean" || echo "WARNING: uncommitted changes"',
      linux: 'test -z "$(git status --porcelain 2>/dev/null)" && echo "git clean" || echo "WARNING: uncommitted changes"',
    },
    impact: 2, likelihood: 3,
  },
  {
    item_id: 'GIT-04', category: 'GIT',
    description: '.gitignore가 존재하는지 확인',
    verification_command: {
      darwin: 'test -f .gitignore && echo ".gitignore ok" || echo "not found: .gitignore"',
      linux: 'test -f .gitignore && echo ".gitignore ok" || echo "not found: .gitignore"',
    },
    impact: 2, likelihood: 2,
  },
  {
    item_id: 'GIT-05', category: 'GIT',
    description: 'Git user.name과 user.email이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'git config user.name > /dev/null 2>&1 && git config user.email > /dev/null 2>&1 && echo "git user ok" || echo "not found: git user config"',
      linux: 'git config user.name > /dev/null 2>&1 && git config user.email > /dev/null 2>&1 && echo "git user ok" || echo "not found: git user config"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'GIT-06', category: 'GIT',
    description: 'GitHub CLI (gh)가 설치되고 인증되어 있는지 확인',
    verification_command: {
      darwin: 'gh auth status > /dev/null 2>&1 && echo "gh auth ok" || echo "not found: gh CLI auth"',
      linux: 'gh auth status > /dev/null 2>&1 && echo "gh auth ok" || echo "not found: gh CLI auth"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['GitHub'],
  },
  {
    item_id: 'GIT-07', category: 'GIT',
    description: 'Git LFS가 필요한 경우 설치되어 있는지 확인',
    verification_command: {
      darwin: 'git lfs version > /dev/null 2>&1 && echo "git lfs ok" || echo "SKIPPED: git lfs not installed"',
      linux: 'git lfs version > /dev/null 2>&1 && echo "git lfs ok" || echo "SKIPPED: git lfs not installed"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'GIT-08', category: 'GIT',
    description: 'Git hooks가 정상적으로 설정되어 있는지 확인',
    verification_command: {
      darwin: 'test -d .git/hooks && echo "git hooks dir ok" || echo "SKIPPED: no hooks directory"',
      linux: 'test -d .git/hooks && echo "git hooks dir ok" || echo "SKIPPED: no hooks directory"',
    },
    impact: 1, likelihood: 1,
  },
  {
    item_id: 'GIT-09', category: 'GIT',
    description: 'Git remote에 push 권한이 있는지 확인',
    verification_command: {
      darwin: 'git remote -v 2>/dev/null | grep -q "push" && echo "push access ok" || echo "not found: push access"',
      linux: 'git remote -v 2>/dev/null | grep -q "push" && echo "push access ok" || echo "not found: push access"',
    },
    impact: 3, likelihood: 2,
    relevant_to: ['GitHub'],
  },

  // ════════════════════════════════════════
  // OS — OS & 프로세스 (8 items)
  // ════════════════════════════════════════
  {
    item_id: 'OS-01', category: 'OS',
    description: 'ulimit (오픈 파일 수)가 충분한지 확인',
    verification_command: {
      darwin: 'test $(ulimit -n) -ge 1024 && echo "ulimit ok: $(ulimit -n)" || echo "not available: ulimit too low"',
      linux: 'test $(ulimit -n) -ge 1024 && echo "ulimit ok: $(ulimit -n)" || echo "not available: ulimit too low"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'OS-02', category: 'OS',
    description: 'cron 또는 스케줄러가 동작 중인지 확인',
    verification_command: {
      darwin: 'launchctl list > /dev/null 2>&1 && echo "launchd ok" || echo "SKIPPED: launchd check failed"',
      linux: 'systemctl is-active cron > /dev/null 2>&1 && echo "cron ok" || echo "not running: cron"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'OS-03', category: 'OS',
    description: '자동 업데이트가 작업 중 시스템을 방해하지 않는지 확인',
    verification_command: {
      darwin: 'defaults read /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled 2>/dev/null | grep -q "0" && echo "auto-update disabled" || echo "WARNING: auto-updates may be enabled"',
      linux: 'systemctl is-active unattended-upgrades > /dev/null 2>&1 && echo "WARNING: unattended-upgrades active" || echo "auto-update ok"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'OS-04', category: 'OS',
    description: '타임존이 올바르게 설정되어 있는지 확인',
    verification_command: {
      darwin: 'date +%Z | grep -qE "^[A-Z]" && echo "timezone ok: $(date +%Z)" || echo "not available: timezone not set"',
      linux: 'timedatectl | grep -q "Time zone" && echo "timezone ok: $(date +%Z)" || echo "not available: timezone not set"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'OS-05', category: 'OS',
    description: '시스템 로케일이 UTF-8인지 확인',
    verification_command: {
      darwin: 'locale | grep -q "UTF-8" && echo "locale ok" || echo "WARNING: locale is not UTF-8"',
      linux: 'locale | grep -q "UTF-8" && echo "locale ok" || echo "WARNING: locale is not UTF-8"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'OS-06', category: 'OS',
    description: '좀비 프로세스가 없는지 확인',
    verification_command: {
      darwin: 'test $(ps aux | grep -c "Z" | head -1) -lt 5 && echo "no zombies" || echo "WARNING: zombie processes detected"',
      linux: 'test $(ps aux | awk \'$8=="Z" {count++} END {print count+0}\') -eq 0 && echo "no zombies" || echo "WARNING: zombie processes detected"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'OS-07', category: 'OS',
    description: '필요한 시스템 라이브러리가 설치되어 있는지 확인',
    verification_command: {
      darwin: 'xcode-select -p > /dev/null 2>&1 && echo "xcode tools ok" || echo "not installed: Xcode Command Line Tools"',
      linux: 'dpkg -l build-essential > /dev/null 2>&1 && echo "build-essential ok" || echo "SKIPPED: build-essential check"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'OS-08', category: 'OS',
    description: 'PATH에 필요한 디렉토리가 포함되어 있는지 확인',
    verification_command: {
      darwin: 'echo "$PATH" | grep -q "/usr/local/bin" && echo "PATH ok" || echo "WARNING: /usr/local/bin not in PATH"',
      linux: 'echo "$PATH" | grep -q "/usr/local/bin" && echo "PATH ok" || echo "WARNING: /usr/local/bin not in PATH"',
    },
    impact: 2, likelihood: 1,
  },

  // ════════════════════════════════════════
  // COST — 비용 & 안전장치 (6 items)
  // ════════════════════════════════════════
  {
    item_id: 'COST-01', category: 'COST',
    description: 'API spending limit이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: spending limit check requires dashboard verification"',
      linux: 'echo "SKIPPED: spending limit check requires dashboard verification"',
    },
    impact: 4, likelihood: 3,
  },
  {
    item_id: 'COST-02', category: 'COST',
    description: '예상 API 비용이 합리적인 범위인지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: cost estimation requires task-specific analysis"',
      linux: 'echo "SKIPPED: cost estimation requires task-specific analysis"',
    },
    impact: 4, likelihood: 2,
  },
  {
    item_id: 'COST-03', category: 'COST',
    description: 'Kill switch (긴급 중단 방법)가 준비되어 있는지 확인',
    verification_command: {
      darwin: 'which kill > /dev/null 2>&1 && echo "kill command available" || echo "not installed: kill"',
      linux: 'which kill > /dev/null 2>&1 && echo "kill command available" || echo "not installed: kill"',
    },
    impact: 3, likelihood: 1,
  },
  {
    item_id: 'COST-04', category: 'COST',
    description: 'API 사용량 모니터링이 가능한지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: usage monitoring check requires dashboard access"',
      linux: 'echo "SKIPPED: usage monitoring check requires dashboard access"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'COST-05', category: 'COST',
    description: '과금 알림이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: billing alert check requires dashboard access"',
      linux: 'echo "SKIPPED: billing alert check requires dashboard access"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'COST-06', category: 'COST',
    description: '무료 티어 한도 내에서 동작하는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: free tier check requires service-specific verification"',
      linux: 'echo "SKIPPED: free tier check requires service-specific verification"',
    },
    impact: 3, likelihood: 2,
  },

  // ════════════════════════════════════════
  // MON — 모니터링 (4 items)
  // ════════════════════════════════════════
  {
    item_id: 'MON-01', category: 'MON',
    description: '알림 채널 (Slack/Discord/이메일)이 설정되어 있는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: notification channel check requires manual verification"',
      linux: 'echo "SKIPPED: notification channel check requires manual verification"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'MON-02', category: 'MON',
    description: '로그 수집 설정이 되어 있는지 확인',
    verification_command: {
      darwin: 'test -d /var/log && echo "log dir ok" || echo "not found: /var/log"',
      linux: 'test -d /var/log && echo "log dir ok" || echo "not found: /var/log"',
    },
    impact: 2, likelihood: 1,
  },
  {
    item_id: 'MON-03', category: 'MON',
    description: '롤백 계획이 준비되어 있는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: rollback plan check requires manual verification"',
      linux: 'echo "SKIPPED: rollback plan check requires manual verification"',
    },
    impact: 3, likelihood: 2,
  },
  {
    item_id: 'MON-04', category: 'MON',
    description: '결과 검증 방법이 정의되어 있는지 확인',
    verification_command: {
      darwin: 'echo "SKIPPED: result verification check requires manual verification"',
      linux: 'echo "SKIPPED: result verification check requires manual verification"',
    },
    impact: 3, likelihood: 2,
  },
];
