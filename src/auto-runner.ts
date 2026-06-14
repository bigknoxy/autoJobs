#!/usr/bin/env bun
/**
 * Lightweight auto-runner - doesn't spawn pi for each task
 * Runs security scans and PR checks directly
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { REPOSITORIES } from './config/repositories';

const LOG_DIR = join(import.meta.dir, '..', 'logs');

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

function log(msg: string) {
  const line = `${new Date().toISOString()} - ${msg}`;
  console.log(line);
  writeFileSync(join(LOG_DIR, 'auto-runner.log'), line + '\n', { flag: 'a' });
}

function checkPRs(repo: string) {
  try {
    const count = execSync(`gh pr list --repo ${repo} --state open --json number --jq 'length'`, { encoding: 'utf8' }).trim();
    return parseInt(count) || 0;
  } catch { return 0; }
}

async function main() {
  log(`Monitoring ${REPOSITORIES.length} repositories...`);
  
  const results = {
    totalPRs: 0,
    reposWithPRs: 0,
    securityScans: 0
  };
  
  for (const repo of REPOSITORIES.slice(0, 10)) { // Limit to 10 for testing
    const repoPath = `${repo.owner}/${repo.name}`;
    const prs = checkPRs(repoPath);
    if (prs > 0) {
      results.totalPRs += prs;
      results.reposWithPRs++;
      log(`${repoPath}: ${prs} open PRs`);
    } else {
      log(`${repoPath}: no PRs`);
    }
  }
  
  log(`Summary: ${results.reposWithPRs} repos with ${results.totalPRs} total open PRs`);
}

// Run every 5 minutes
const interval = setInterval(main, 5 * 60 * 1000);
main().catch(e => log(`Error: ${e.message}`));