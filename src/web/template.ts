// ── Web Report HTML Template (Dark Theme, Single File) ──

import type { Report, Seed, ChecklistItem } from '../core/types.js';

export function generateHtmlTemplate(report: Report, checklist: ChecklistItem[], seed: Seed): string {
  const reportJson = JSON.stringify(report);
  const checklistJson = JSON.stringify(checklist);
  const seedJson = JSON.stringify(seed);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chaos Lab — Pre-flight Report</title>
<style>
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --border: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --accent-green: #3fb950;
  --accent-red: #f85149;
  --accent-yellow: #d29922;
  --accent-blue: #58a6ff;
  --accent-purple: #bc8cff;
  --accent-gray: #484f58;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

.container { max-width: 1200px; margin: 0 auto; padding: 24px; }

/* Navigation */
.nav {
  display: flex; gap: 8px; padding: 16px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px; position: sticky; top: 0;
  background: var(--bg-primary); z-index: 100;
}
.nav a {
  color: var(--text-secondary); text-decoration: none;
  padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;
  transition: all 0.2s;
}
.nav a:hover, .nav a.active { color: var(--text-primary); background: var(--bg-tertiary); }

/* Hero */
.hero {
  text-align: center; padding: 48px 0 32px;
}
.hero h1 { font-size: 32px; margin-bottom: 8px; }
.hero .subtitle { color: var(--text-secondary); font-size: 16px; }

/* Verdict Banner */
.verdict-banner {
  padding: 20px 24px; border-radius: 12px; margin: 24px 0;
  text-align: center; font-size: 18px; font-weight: 600;
}
.verdict-READY { background: linear-gradient(135deg, #0d2818, #1a4028); border: 1px solid var(--accent-green); color: var(--accent-green); }
.verdict-READY_WITH_CAUTION { background: linear-gradient(135deg, #2d1f00, #4a3500); border: 1px solid var(--accent-yellow); color: var(--accent-yellow); }
.verdict-NOT_READY { background: linear-gradient(135deg, #2d0f0f, #4a1a1a); border: 1px solid var(--accent-red); color: var(--accent-red); }

/* KPI Cards */
.kpi-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; margin: 24px 0;
}
.kpi-card {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px; text-align: center;
}
.kpi-card .number { font-size: 36px; font-weight: 700; }
.kpi-card .label { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }
.kpi-critical .number { color: var(--accent-red); }
.kpi-warning .number { color: var(--accent-yellow); }
.kpi-passed .number { color: var(--accent-green); }
.kpi-skipped .number { color: var(--accent-gray); }
.kpi-healed .number { color: var(--accent-blue); }

/* Section */
.section { margin: 40px 0; }
.section h2 { font-size: 22px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }

/* System Info Panel */
.info-panel {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px; margin: 16px 0;
}
.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--text-secondary); }
.info-value { font-weight: 500; }

/* Table */
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { background: var(--bg-tertiary); color: var(--text-secondary); font-weight: 600; text-align: left; padding: 12px; }
td { padding: 12px; border-bottom: 1px solid var(--border); }
tr:hover { background: var(--bg-secondary); }

/* Search */
.search-box {
  width: 100%; padding: 10px 16px; margin-bottom: 16px;
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text-primary); font-size: 14px;
}
.search-box:focus { outline: none; border-color: var(--accent-blue); }

/* Filter Buttons */
.filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-btn {
  padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
  background: var(--bg-secondary); color: var(--text-secondary);
  cursor: pointer; font-size: 13px; transition: all 0.2s;
}
.filter-btn:hover, .filter-btn.active { border-color: var(--accent-blue); color: var(--accent-blue); }

/* Status Badge */
.badge {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 12px; font-weight: 600;
}
.badge-PASSED { background: #0d2818; color: var(--accent-green); }
.badge-FAILED { background: #2d0f0f; color: var(--accent-red); }
.badge-WARNING { background: #2d1f00; color: var(--accent-yellow); }
.badge-SKIPPED { background: #1c1c1c; color: var(--accent-gray); }
.badge-HEALED { background: #0d1f2d; color: var(--accent-blue); }

/* Collapsible */
.collapsible { margin: 8px 0; }
.collapsible-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; user-select: none;
}
.collapsible-header:hover { background: var(--bg-tertiary); }
.collapsible-content {
  max-height: 0; overflow: hidden; transition: max-height 0.3s ease;
  border: 1px solid var(--border); border-top: none; border-radius: 0 0 8px 8px;
}
.collapsible-content.open { max-height: 2000px; }
.collapsible-item { padding: 12px 16px; border-bottom: 1px solid var(--border); }
.collapsible-item:last-child { border-bottom: none; }

/* Action Plan */
.action-item {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; padding: 16px; margin: 12px 0;
}
.action-item .action-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.action-item .action-reason { color: var(--text-secondary); font-size: 13px; margin-bottom: 8px; }
.action-item code {
  display: block; background: var(--bg-primary); padding: 10px;
  border-radius: 6px; font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px; color: var(--accent-blue); margin-top: 8px;
  overflow-x: auto;
}

/* CTA Buttons */
.cta-group { display: flex; gap: 12px; justify-content: center; margin: 24px 0; }
.cta-btn {
  padding: 10px 24px; border-radius: 8px; border: none;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.cta-primary { background: var(--accent-blue); color: #fff; }
.cta-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); }
.cta-btn:hover { opacity: 0.85; transform: translateY(-1px); }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .nav { flex-wrap: wrap; }
}
</style>
</head>
<body>
<div class="container">
  <nav class="nav">
    <a href="#overview" class="active" onclick="showSection('overview')">Overview</a>
    <a href="#checklist" onclick="showSection('checklist')">Checklist</a>
    <a href="#verify" onclick="showSection('verify')">Verify</a>
    <a href="#report" onclick="showSection('report')">Report</a>
  </nav>

  <div id="app"></div>
</div>

<script>
const REPORT = ${reportJson};
const CHECKLIST = ${checklistJson};
const SEED = ${seedJson};
</script>
<script>
(function() {
  const app = document.getElementById('app');
  let currentFilter = 'ALL';
  let searchTerm = '';

  function render() {
    app.innerHTML = renderOverview() + renderChecklist() + renderVerify() + renderReport();
    bindEvents();
    showSection('overview');
  }

  function renderOverview() {
    const v = REPORT.verdict;
    const verdictClass = 'verdict-' + v.status;
    return '<div id="section-overview" class="section-page">' +
      '<div class="hero"><h1>🧪 Chaos Lab</h1><p class="subtitle">Pre-flight Check Report</p></div>' +
      '<div class="verdict-banner ' + verdictClass + '">' + v.summary + '</div>' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card kpi-critical"><div class="number">' + v.failed_count + '</div><div class="label">Critical</div></div>' +
        '<div class="kpi-card kpi-warning"><div class="number">' + v.warning_count + '</div><div class="label">Warning</div></div>' +
        '<div class="kpi-card kpi-passed"><div class="number">' + v.passed_count + '</div><div class="label">Passed</div></div>' +
        '<div class="kpi-card kpi-skipped"><div class="number">' + v.skipped_count + '</div><div class="label">Skipped</div></div>' +
        '<div class="kpi-card kpi-healed"><div class="number">' + v.healed_count + '</div><div class="label">Healed</div></div>' +
      '</div>' +
      '<div class="cta-group">' +
        '<button class="cta-btn cta-primary" onclick="showSection(\\'verify\\')">검증 결과 보기</button>' +
        '<button class="cta-btn cta-secondary" onclick="showSection(\\'report\\')">Action Plan 보기</button>' +
      '</div>' +
      '<div class="info-panel">' +
        '<h3 style="margin-bottom:12px">System Info</h3>' +
        '<div class="info-row"><span class="info-label">작업 요약</span><span class="info-value">' + SEED.task_summary.substring(0,80) + '</span></div>' +
        '<div class="info-row"><span class="info-label">외부 서비스</span><span class="info-value">' + (SEED.external_services.map(function(s){return s.name}).join(', ') || '없음') + '</span></div>' +
        '<div class="info-row"><span class="info-label">예상 소요시간</span><span class="info-value">' + SEED.estimated_duration + '</span></div>' +
        '<div class="info-row"><span class="info-label">모호도</span><span class="info-value">' + SEED.ambiguity_score + '</span></div>' +
        '<div class="info-row"><span class="info-label">실행 시간</span><span class="info-value">' + (REPORT.execution_time_ms / 1000).toFixed(1) + '초</span></div>' +
      '</div>' +
    '</div>';
  }

  function renderChecklist() {
    var cats = {};
    CHECKLIST.forEach(function(c) { if (!cats[c.category]) cats[c.category] = 0; cats[c.category]++; });
    var catNames = {"HW":"하드웨어","NET":"네트워크","AUTH":"API 인증","CC":"Claude Code","RT":"런타임","BT":"빌드/테스트","DB":"데이터베이스","GIT":"Git","OS":"OS","COST":"비용","MON":"모니터링"};
    var highest = CHECKLIST.length > 0 ? CHECKLIST[0].risk_score : 0;

    var html = '<div id="section-checklist" class="section-page" style="display:none">' +
      '<div class="section"><h2>📋 Checklist</h2>' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card"><div class="number">' + CHECKLIST.length + '</div><div class="label">Total Checks</div></div>' +
        '<div class="kpi-card"><div class="number">' + Object.keys(cats).length + '</div><div class="label">Categories</div></div>' +
        '<div class="kpi-card"><div class="number">' + highest + '</div><div class="label">Highest Risk</div></div>' +
      '</div>' +
      '<input type="text" class="search-box" id="checklist-search" placeholder="검색..." />' +
      '<div class="table-container"><table><thead><tr><th>ID</th><th>카테고리</th><th>설명</th><th>Risk</th><th>소스</th></tr></thead><tbody id="checklist-body">';

    CHECKLIST.forEach(function(c) {
      html += '<tr class="checklist-row" data-cat="' + c.category + '"><td>' + c.item_id + '</td><td>' + (catNames[c.category]||c.category) + '</td><td>' + c.description + '</td><td>' + c.risk_score + '</td><td>' + c.source + '</td></tr>';
    });

    html += '</tbody></table></div></div></div>';
    return html;
  }

  function renderVerify() {
    var results = REPORT.results;
    var byCat = {};
    results.forEach(function(r) { if (!byCat[r.category]) byCat[r.category] = []; byCat[r.category].push(r); });
    var catNames = {"HW":"하드웨어 & 전력","NET":"네트워크","AUTH":"API 인증","CC":"Claude Code","RT":"런타임 & 의존성","BT":"빌드 & 테스트","DB":"데이터베이스","GIT":"Git & 버전 관리","OS":"OS & 프로세스","COST":"비용 & 안전장치","MON":"모니터링"};
    var icons = {"PASSED":"🟢","FAILED":"🔴","WARNING":"🟡","SKIPPED":"⚪","HEALED":"🔧"};

    var html = '<div id="section-verify" class="section-page" style="display:none">' +
      '<div class="section"><h2>🔍 Verification Results</h2>' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card kpi-critical"><div class="number">' + REPORT.verdict.failed_count + '</div><div class="label">Critical</div></div>' +
        '<div class="kpi-card kpi-warning"><div class="number">' + REPORT.verdict.warning_count + '</div><div class="label">Warning</div></div>' +
        '<div class="kpi-card kpi-passed"><div class="number">' + REPORT.verdict.passed_count + '</div><div class="label">Passed</div></div>' +
        '<div class="kpi-card kpi-skipped"><div class="number">' + REPORT.verdict.skipped_count + '</div><div class="label">Skipped</div></div>' +
        '<div class="kpi-card kpi-healed"><div class="number">' + REPORT.verdict.healed_count + '</div><div class="label">Healed</div></div>' +
      '</div>' +
      '<div class="filters">' +
        '<button class="filter-btn active" data-filter="ALL">All</button>' +
        '<button class="filter-btn" data-filter="FAILED">Failed</button>' +
        '<button class="filter-btn" data-filter="WARNING">Warning</button>' +
        '<button class="filter-btn" data-filter="PASSED">Passed</button>' +
        '<button class="filter-btn" data-filter="SKIPPED">Skipped</button>' +
        '<button class="filter-btn" data-filter="HEALED">Healed</button>' +
      '</div>';

    Object.keys(byCat).forEach(function(cat) {
      var items = byCat[cat];
      html += '<div class="collapsible" data-cat="' + cat + '">' +
        '<div class="collapsible-header" onclick="toggleCollapsible(this)">' +
          '<span>' + (catNames[cat]||cat) + ' (' + items.length + ')</span>' +
          '<span>▼</span>' +
        '</div>' +
        '<div class="collapsible-content">';
      items.forEach(function(r) {
        html += '<div class="collapsible-item verify-item" data-status="' + r.status + '">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span>' + icons[r.status] + '</span>' +
            '<strong>' + r.item_id + '</strong>' +
            '<span class="badge badge-' + r.status + '">' + r.status + '</span>' +
          '</div>' +
          '<div style="margin-top:4px">' + r.description + '</div>' +
          '<div style="margin-top:4px;color:var(--text-secondary);font-size:13px">' + r.details.substring(0,120) + '</div>' +
        '</div>';
      });
      html += '</div></div>';
    });

    html += '</div></div>';
    return html;
  }

  function renderReport() {
    var html = '<div id="section-report" class="section-page" style="display:none">' +
      '<div class="section"><h2>📄 Final Report</h2>';

    var v = REPORT.verdict;
    var verdictClass = 'verdict-' + v.status;
    html += '<div class="verdict-banner ' + verdictClass + '">' + v.summary + '</div>';

    if (REPORT.action_plan.length > 0) {
      html += '<h3 style="margin:24px 0 16px">📋 Action Plan (' + REPORT.action_plan.length + '건)</h3>';
      REPORT.action_plan.forEach(function(a) {
        var typeIcon = a.fix_type === 'auto-fixable' ? '🔧' : '👤';
        html += '<div class="action-item">' +
          '<div class="action-header"><span>' + typeIcon + '</span><strong>' + a.item_id + '</strong><span> — ' + a.description + '</span></div>' +
          '<div class="action-reason">' + a.reason + '</div>' +
          '<code>' + a.fix_command + '</code>' +
        '</div>';
      });
    } else {
      html += '<div class="info-panel" style="text-align:center"><p>✅ 모든 검증을 통과했습니다. 추가 조치가 필요하지 않습니다.</p></div>';
    }

    html += '</div></div>';
    return html;
  }

  function bindEvents() {
    var searchBox = document.getElementById('checklist-search');
    if (searchBox) {
      searchBox.addEventListener('input', function(e) {
        searchTerm = e.target.value.toLowerCase();
        filterChecklist();
      });
    }

    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        filterVerify();
      });
    });
  }

  function filterChecklist() {
    document.querySelectorAll('.checklist-row').forEach(function(row) {
      var text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }

  function filterVerify() {
    document.querySelectorAll('.verify-item').forEach(function(item) {
      if (currentFilter === 'ALL' || item.dataset.status === currentFilter) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  window.showSection = function(name) {
    document.querySelectorAll('.section-page').forEach(function(s) { s.style.display = 'none'; });
    var el = document.getElementById('section-' + name);
    if (el) el.style.display = '';
    document.querySelectorAll('.nav a').forEach(function(a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + name);
    });
  };

  window.toggleCollapsible = function(header) {
    var content = header.nextElementSibling;
    content.classList.toggle('open');
    var arrow = header.querySelector('span:last-child');
    arrow.textContent = content.classList.contains('open') ? '▲' : '▼';
  };

  render();
})();
</script>
</body>
</html>`;
}
