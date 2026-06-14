# Bigknoxy Repository Monitor

Automated scripts and cron jobs to monitor, update, maintain, and build features for bigknoxy repositories.

## Overview

This system uses `pi` coding assistant with the poolside/lagina-m.1 model to:
- Monitor open PRs and pipeline status
- Run security scans on code changes
- Execute E2E tests automatically
- Sync and maintain repositories
- Generate reports and notifications

## Architecture

```
bigknoxy-repo-monitor/
├── skills/                     # Pi skills for different tasks
│   ├── monitoring/            # PR and pipeline monitoring
│   ├── orchestration/         # Master orchestrator skill
│   ├── security/            # Security scanning skills
│   └── testing/             # E2E testing skills
├── src/
│   ├── orchestrator.ts        # Main loop - wakes every 5 min
│   ├── pr-monitor.ts         # PR status checker
│   ├── security-scan.ts      # Vulnerability scanner
│   ├── setup-cron.ts         # Cron/systemd setup
│   └── config/
│       └── repositories.ts   # Repository configuration
├── worktrees/                 # Cloned repos for analysis
├── logs/                      # Execution logs and reports
└── package.json
```

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Configure repositories
# Edit src/config/repositories.ts to add bigknoxy repos

# 3. Install skills (optional)
bun run src/install-skills.ts

# 4. Setup automation
bun run src/setup-cron.ts

# 5. Run manually
bun run src/orchestrator.ts
```

## Skills

### Maintainer Orchestrator
The main coordinator that spawns parallel workers for each repository.

```bash
pi --skill skills/orchestration/maintainer-orchestrator.skill.md --model poolside/lagina-m.1 "Start monitoring"
```

### PR Monitor
Checks open PRs and CI/CD pipeline status.

```bash
pi --skill skills/monitoring/pr-monitor.skill.md -p "Check PRs for bigknoxy/repo"
```

### Security Scanner
Runs vulnerability scans using trivy and npm audit.

```bash
pi --skill skills/security/security-scan.skill.md -p "Scan bigknoxy/repo for vulnerabilities"
```

### E2E Tester
Executes end-to-end test suites.

```bash
pi --skill skills/testing/e2e-tester.skill.md -p "Run E2E tests on bigknoxy/repo PR #123"
```

## Configuration

Edit `src/config/repositories.ts`:

```typescript
export const REPOSITORIES: RepoConfig[] = [
  {
    owner: "bigknoxy",
    name: "repo-name",
    branch: "main",           // default: main
    pipelineNotify: true,      // notify on CI status changes
    securityScan: true,        // run security scans
    e2eTest: true,            // run E2E tests
    webhookUrl: "..."          // optional webhook for notifications
  }
];
```

## Automation

The system can run via:
- **Cron**: Every 5 minutes (default)
- **Systemd**: As a service with auto-restart
- **Manual**: On-demand execution

## Development

To add new monitoring capabilities:
1. Create a new skill in `skills/`
2. Add task type to `orchestrator.ts`
3. Update `repositories.ts` config

## License

MIT