#!/usr/bin/env bun
/**
 * Auto-runner: Monitoring + Code Review + Dogfood Testing
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
    return JSON.parse(execSync(`gh pr list --repo ${repo} --state open --json number --jq '.'`, { encoding: 'utf8' })).length || 0;
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

function runDogfoodTest() {
  try {
    execSync(`bun run /root/code/autoJobs/src/dogfood-test.ts`, { encoding: 'utf8' });
    log('Dogfood test cycle completed');
  } catch (e) {
    log(`Dogfood test error: ${(e as Error).message}`);
  }
}

async function main() {
  log(`\n=== Monitoring ${REPOSITORIES.length} repos ===`);
  
  let totalPRs = 0;
  for (const repo of REPOSITORIES) {
    const repoPath = `${repo.owner}/${repo.name}`;
    totalPRs += checkPRs(repoPath);
  }
  
  log(`Total open PRs: ${totalPRs}`);
  
  // Cycle-based actions
  const cycleCount = parseInt(readFileSync(join(LOG_DIR, 'cycle-count'), 'utf8') || '0');
  const newCount = (cycleCount + 1) % 4;
  writeFileSync(join(LOG_DIR, 'cycle-count'), String(newCount));
  
  if (cycleCount === 0) {
    log('Running code review...');
    runCodeReview();
  } else if (cycleCount === 2) {
    log('Running dogfood tests...');
    runDogfoodTest();
  }
}

main().catch(e => log(`Error: ${e.message}`));
setInterval(main, 5 * 60 * 1000);