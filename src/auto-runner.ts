#!/usr/bin/env bun
/**
 * Auto-Runner - single cycle of repository monitoring.
 *
 * Usage:
 *   bun run src/auto-runner.ts            # run one cycle and exit (cron/systemd entry)
 *   bun run src/auto-runner.ts --loop     # keep running, one cycle per hour
 *   bun run src/auto-runner.ts --status   # show current state
 *   bun run src/auto-runner.ts --help     # show help
 *
 * Cycle schedule (hourly interval, 24-cycle rotation):
 *   every cycle   - count open PRs across all configured repositories
 *   cycle 0       - code review + auto-merge PRs with passing checks
 *   cycle 6       - dogfood tests
 *   cycle 12      - security scans
 */
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { REPOSITORIES } from './config/repositories';

const LOG_DIR = join(import.meta.dir, '..', 'logs');
// When executed with bun, process.execPath is the bun binary itself.
const BUN = process.execPath || 'bun';

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

function log(msg: string) {
  const line = `${new Date().toISOString()} - ${msg}`;
  console.log(line);
  writeFileSync(join(LOG_DIR, 'auto-runner.log'), line + '\n', { flag: 'a' });
}

function isRateLimited(): boolean {
  try {
    const logContent = readFileSync(join(LOG_DIR, 'auto-runner.log'), 'utf8');
    const lines = logContent.split('\n').slice(-100);
    const recent = lines.some(l => l.includes('rate limit') && Date.now() - new Date(l).getTime() < 60000);
    return recent;
  } catch { return false; }
}

function checkPRs(repo: string): number {
  try {
    return JSON.parse(execSync(`gh pr list --repo ${repo} --state open --json number --jq '.'`, { encoding: 'utf8' })).length || 0;
  } catch { return 0; }
}

function canMerge(repo: string, pr: number): boolean {
  try {
    const checks = JSON.parse(execSync(`gh pr view ${pr} --repo ${repo} --json statusCheckRollup,mergeable --jq '.'`, { encoding: 'utf8' }));
    const rollup: any[] = checks.statusCheckRollup || [];
    const hasFailures = rollup.some(c => c.conclusion === 'FAILURE' || c.status === 'IN_PROGRESS');
    // mergeable is the string "MERGEABLE" | "CONFLICTING" | "UNKNOWN" - only
    // treat an explicit MERGEABLE as merge-safe.
    return !hasFailures && checks.mergeable === 'MERGEABLE';
  } catch { return false; }
}

function autoMerge(repo: string, pr: number) {
  try {
    execSync(`gh pr merge ${pr} --repo ${repo} --squash --auto`, { encoding: 'utf8' });
    log(`Auto-merged PR #${pr}`);
  } catch (e) {
    log(`Merge failed PR #${pr}: ${(e as Error).message}`);
  }
}

function runCodeReviewCycle() {
  log('Running code review + auto-merge cycle...');
  try {
    execSync(`${BUN} run ${join(import.meta.dir, 'code-review.ts')}`, { encoding: 'utf8' });
    for (const repo of REPOSITORIES) {
      const repoPath = `${repo.owner}/${repo.name}`;
      const prs: { number: number }[] = JSON.parse(execSync(`gh pr list --repo ${repoPath} --state open --json number --jq '.'`, { encoding: 'utf8' }));
      for (const pr of prs) {
        if (canMerge(repoPath, pr.number)) { autoMerge(repoPath, pr.number); }
      }
    }
    log('Code review cycle completed');
  } catch (e) { log(`Code review error: ${(e as Error).message}`); }
}

function runDogfoodCycle() {
  log('Running dogfood tests...');
  try {
    execSync(`${BUN} run ${join(import.meta.dir, 'dogfood-test.ts')}`, { encoding: 'utf8' });
    log('Dogfood test cycle completed');
  } catch (e) { log(`Dogfood test error: ${(e as Error).message}`); }
}

function runSecurityCycle() {
  log('Running security scans...');
  try {
    for (const repo of REPOSITORIES) {
      execSync(`${BUN} run ${join(import.meta.dir, 'security-scan.ts')} ${repo.owner}/${repo.name}`, { encoding: 'utf8' });
    }
    log('Security scan cycle completed');
  } catch (e) { log(`Security scan error: ${(e as Error).message}`); }
}

function showHelp() {
  console.log(`
🤖 autoJobs Commands:
  main.ts --loop     Start continuous monitoring
  auto-runner.ts     Run one cycle (cron/systemd entry)
  auto-runner.ts --loop   Keep cycling hourly
  --help / /help     Show this help
  --status / /status Show current state

Skills available:
  - monitoring/pr-monitor.skill.md
  - orchestration/code-review.skill.md
  - security/auto-fix.skill.md
  - testing/dogfood-tester.skill.md
`);
}

function showStatus() {
  const cycleCount = readFileSync(join(LOG_DIR, 'cycle-count'), 'utf8') || '0';
  const lastRuns = readFileSync(join(LOG_DIR, 'auto-runner.log'), 'utf8').split('\n').slice(-5);
  console.log(`
📊 autoJobs Status:
  Cycle: ${cycleCount}
  Repos monitored: ${REPOSITORIES.length}
  Last runs:
${lastRuns.map(l => '    ' + l).join('\n')}
`);
}

async function runCycle() {
  if (isRateLimited()) { log('Skipping - rate limit active'); return; }

  log(`\n=== Monitoring ${REPOSITORIES.length} repos ===`);
  let totalPRs = 0;
  for (const repo of REPOSITORIES) {
    totalPRs += checkPRs(`${repo.owner}/${repo.name}`);
  }
  log(`Total open PRs: ${totalPRs}`);

  const cycleCount = parseInt(readFileSync(join(LOG_DIR, 'cycle-count'), 'utf8') || '0');
  // The rotation is 24 hourly cycles, i.e. the schedule repeats every day.
  const newCount = (cycleCount + 1) % 24;
  writeFileSync(join(LOG_DIR, 'cycle-count'), String(newCount));

  if (cycleCount === 0) {
    runCodeReviewCycle();
  } else if (cycleCount === 6) {
    runDogfoodCycle();
  } else if (cycleCount === 12) {
    runSecurityCycle();
  }
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('/help')) {
  showHelp();
} else if (args.includes('--status') || args.includes('/status')) {
  showStatus();
} else {
  runCycle().catch(e => log(`Error: ${e.message}`)).finally(() => {
    if (args.includes('--loop')) {
      // Keep the process alive for continuous operation (cron should not use this).
      setInterval(() => {
        runCycle().catch(e => log(`Cycle error: ${e.message}`));
      }, 60 * 60 * 1000);
    }
  });
}
