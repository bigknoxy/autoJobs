#!/usr/bin/env bun
/**
 * PR Monitor - Track open PRs and pipeline status
 */

import { execSync } from 'child_process';

interface PRInfo {
  number: number;
  title: string;
  state: string;
  headBranch: string;
  author: string;
  createdAt: string;
  pipelineStatus?: string;
}

export function getOpenPRs(owner: string, repo: string): PRInfo[] {
  try {
    const json = execSync(
      `gh pr list --repo ${owner}/${repo} --state open --json number,title,state,headRefName,author,createdAt`,
      { encoding: 'utf8' }
    );
    return JSON.parse(json);
  } catch (e) {
    console.error(`Failed to fetch PRs: ${(e as Error).message}`);
    return [];
  }
}

export function getPipelineStatus(owner: string, repo: string, prNumber: number): string {
  try {
    const json = execSync(
      `gh pr view --repo ${owner}/${repo} --json statusCheckRollup`,
      { encoding: 'utf8' }
    );
    const data = JSON.parse(json);
    const checks = data.statusCheckRollup || [];
    
    if (checks.length === 0) return 'pending';
    
    const failed = checks.find((c: any) => c.state === 'FAILURE');
    if (failed) return 'failed';
    
    const pending = checks.find((c: any) => c.state === 'PENDING');
    if (pending) return 'pending';
    
    return 'success';
  } catch {
    return 'unknown';
  }
}

// Main execution
const args = process.argv.slice(2);
const repoArg = args.find(a => a.includes('/'));

if (repoArg) {
  const [owner, repo] = repoArg.split('/');
  const prs = getOpenPRs(owner, repo);
  
  console.log(`\n=== Open PRs for ${owner}/${repo} ===\n`);
  prs.forEach(pr => {
    const status = getPipelineStatus(owner, repo, pr.number);
    console.log(`#${pr.number} - ${pr.title} (by ${pr.author.login})`);
    console.log(`  Status: ${status}`);
    console.log(`  Branch: ${pr.headRefName}\n`);
  });
}