# UI Integration Patterns Analysis - autoJobs Codebase

## Executive Summary

This automated monitoring system manages 50+ GitHub repositories with periodic execution cycles. Agent actions are primarily reflected through **file-based logging** and **GitHub PR comments**. The system lacks real-time UI (no WebSocket/SSE) and formal audit trails.

---

## 1. Logging Mechanisms

### File-Based Logging (Primary Pattern)
- **Location**: `/root/code/autoJobs/logs/`
- **Format**: Plain text with ISO timestamps (structured-but-flat)
- **Pattern**: `{timestamp} - {message}`

**Log Files Found:**
| File | Purpose |
|------|---------|
| `auto-runner.log` | Main monitoring cycle logs - PR counts, task execution |
| `code-review.log` | PR reviews - APPROVED/NEEDS_WORK status |
| `dogfood.log` | CI/testing validation results |
| `cron.log` | Cron job execution (duplicates main.log content) |
| `security-*.json` | Structured JSON security scan reports (Trivy/npm audit) |

### Console Output Integration
- All scripts use `console.log()` for stdout visibility
- Logs written via `writeFileSync(..., { flag: 'a' })` append mode
- No log rotation or structured logging framework (pino, winston)

### Security Reports (Structured Logging)
- JSON format with vulnerability details
- Includes CVE data, severity, package info
- Example schema:
  ```json
  {
    "repo": "ghAuto",
    "timestamp": "2026-06-14T21:33:22.873Z",
    "npm": { "vulnerabilities": [], "fixAvailable": false },
    "trivy": "..."
  }
  ```

### Observable Actions in Logs
```
2026-06-14T22:20:02.807Z - Commented on PR #27
2026-06-14T22:19:41.818Z - Reviewed PR #27 on bigknoxy/arrowhead-junkie: APPROVED
2026-06-14T22:40:18.757Z - Running code review...
2026-06-14T22:40:40.623Z - Code review error: Command failed: bun run...
```

---

## 2. PR Comment Generation & GitHub Integration

### Primary Integration Method
- Uses `gh` CLI for GitHub API interactions
- Comments posted via `gh pr comment {pr} --repo {repo} --body "{review}"`

### Comment Format Templates

**Code Review Comments:**
```markdown
## 🤖 Auto-Review PR #{number}

**Approvals:**
- 🔒 Security: No vulnerabilities found
- 🧪 Tests: Passed

**Recommendation:** APPROVED
```

**Merge Blocker Comments (merge-guard.ts):**
```markdown
## ⛔ Merge Blocked

**Reason:** CI checks failing
- ❌ {check_name}: {conclusion}
```

**Dogfood Test Comments:**
```markdown
## 🐶 Dogfood Results

**Status:** ✅ READY TO MERGE

**CI Checks:**
- SUCCESS: {check_name}

**Local Tests:**
- 🏗️ Build: PASSED
```

### GitHub API Constraints Observed
- Rate limiting ("GraphQL: API rate limit already exceeded")
- Duplicate comment rejection ("was submitted too quickly")
- API connectivity issues ("error connecting to api.github.com")

---

## 3. Systemd Service Status & Monitoring

### Service Configuration
- **Service File**: `/etc/systemd/system/bigknoxy-monitor.service`
- **Template** (in `setup-cron.ts`):
  ```ini
  [Unit]
  Description=Bigknoxy Repository Monitor
  After=network.target

  [Service]
  Type=simple
  WorkingDirectory=/root/code/autoJobs
  ExecStart=/usr/bin/pi --model poolside/lagina-m.1 --skill skills/orchestration/maintainer-orchestrator.skill.md
  Restart=always
  RestartSec=300

  [Install]
  WantedBy=multi-user.target
  ```

### Execution Models
1. **Cron** (every 5 minutes): `*/5 * * * *`
2. **Systemd** (continuous with restart): 5-minute intervals via multiple invocations
3. **Manual** (single run): `bun run src/main.ts --once`

### Monitoring Gaps
- No health endpoint for service status
- No systemd journal integration
- No explicit status file or PID tracking

---

## 4. Real-time Updates vs Polling

### Polling-Based Architecture (Current)
**No real-time UI detected. All updates are polling-based:**

| Component | Interval | Mechanism |
|-----------|----------|-----------|
| Main Loop | 5 min | `setInterval(main, 15 * 60 * 1000)` (15 min) |
| Orchestrator | 5 min | Hardcoded in MONITOR_CONFIG |
| Code Review | On-demand | Triggered every 6th cycle (cycle-count based) |
| Dogfood Tests | On-demand | Triggered every 3rd cycle |

### No WebSocket/SSE Implementation
- Searches for `WebSocket`, `EventSource`, `socket.io` returned no relevant results
- All updates are periodic snapshots, not live streams

---

## 5. Action Tracing & Audit Trails

### Audit Trail Status: **Basic/Implicit**

**Evidence of Actions:**
- Logs record: "Commented on PR #27", "Reviewed PR #27: APPROVED"
- Security scans produce JSON reports with timestamps
- PR merge attempts logged

**Missing Audit Trail Features:**
- No explicit action correlation IDs
- No structured audit log schema
- No "who triggered" (human vs agent) distinction
- No undo/revert tracking
- No centralized audit repository

### Cycle Count Tracking
- Uses `cycle-count` file for rotating tasks
- Format: simple integer counter (0-5)
- **Note**: File was missing during some execution cycles (ENOENT errors)

---

## Actionable Findings

### How Agent Actions Reflect in Observable Interfaces

| Action Type | Observable Interface | Evidence in UI |
|-------------|---------------------|----------------|
| **PR Review** | GitHub PR comment | `## 🤖 Auto-Review PR #` prefix in PR comments |
| **Security Scan** | Logs + JSON report | `security-{repo}.json` + "Reviewed PR" log entry |
| **CI Monitoring** | GitHub PR comment | Merge blocker comments on failing CI |
| **Dogfood Testing** | GitHub PR comment | `## 🐶 Dogfood Results` in PR comments |
| **Auto-Merge** | GitHub merge event | "Auto-merged PR #${pr}" log entry (rare - needs CI pass) |
| **Status Change** | Log file | Timestamped entries in auto-runner.log |

### Recommendations

1. **Add real-time UI**: Implement SSE endpoint for live log streaming
2. **Structured audit log**: Create `audit-trail.json` with action metadata
3. **Action correlation**: Add UUID to each cycle for traceability
4. **Status endpoint**: Add health check for systemd monitoring
5. **Rate limit handling**: Implement backoff strategy for GitHub API
6. **Log rotation**: Add file size limits to prevent disk exhaustion