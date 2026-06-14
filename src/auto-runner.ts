#!/usr/bin/env bun
/**
 * Auto-runner: Monitoring + Code Review + Security Scans
 * Runs every 5 minutes, survives reboots via systemd
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { REPOSITORIES } from './config/repositories';

const LOG_DIR = '/root/code/autoJobs/logs';

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

function log(msg: string) {
  const line = `${new Date().toISOString()} - ${msg}`;
  console.log(line);
  writeFileSync(join(LOG_DIR, 'auto-runner.log'), line + '\n', { flag: 'a' });
}

function checkPRs(repo: string) {
  try {
    const json = execSync(`gh pr list --repo ${repo} --state open --json number --jq '.'`, { encoding: 'utf8' });
    return JSON.parse(json).length || 0;
  } catch { return 0; }
}

function runCodeReview() {
  try {
    execSync(`bun run /root/code/autoJobs/src/code-review.ts`, { encoding: 'utf8' });
    log('Code review cycle completed');
  } catch (e) {
    log(`Code review error: ${(e as Error).message}`);
  }
}

async function main() {
  log(`\n=== Monitoring ${REPOSITORIES.length} repos ===`);
  
  let totalPRs = 0;
  for (const repo of REPOSITORIES) {
    const repoPath = `${repo.owner}/${repo.name}`;
    const prs = checkPRs(repoPath);
    if (prs > 0) totalPRs += prs;
  }
  
  log(`Total open PRs: ${totalPRs}`);
  
  // Every 3rd cycle: run code review
  const cycleCount = parseInt(readFileSync(join(LOG_DIR, 'cycle-count'), 'utf8') || '0');
  const newCount = (cycleCount + 1) % 3;
  writeFileSync(join(LOG_DIR, 'cycle-count'), String(newCount));
  
  if (cycleCount === 0) {
    log('Running code review cycle...');
    runCodeReview();
  }
}

// Run immediately then every 5 min
main().catch(e => log(`Error: ${e.message}`));
setInterval(main, 5 * 60 * 1000);