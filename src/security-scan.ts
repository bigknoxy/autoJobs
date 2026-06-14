#!/usr/bin/env bun
/**
 * Security Scanner - Automated vulnerability scanning
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const WORK_DIR = '/root/code/autoJobs/worktrees';

export function checkNpmAudit(repoPath: string): { vulnerabilities: any[]; fixAvailable: boolean } {
  try {
    const audit = execSync('npm audit --json', { 
      encoding: 'utf8',
      cwd: repoPath 
    });
    const data = JSON.parse(audit);
    return {
      vulnerabilities: data.vulnerabilities || [],
      fixAvailable: data.metadata?.fixAvailable || false
    };
  } catch (e) {
    return { vulnerabilities: [], fixAvailable: false };
  }
}

export function checkTrivy(repoPath: string): string {
  if (!existsSync(join(repoPath, 'Dockerfile')) && !existsSync(join(repoPath, 'package.json'))) {
    return 'No scan targets found';
  }
  
  try {
    const result = execSync(`trivy fs --format json ${repoPath}`, { 
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024 
    });
    return result;
  } catch (e) {
    return `Trivy scan failed: ${(e as Error).message}`;
  }
}

export function cloneIfNeeded(repo: string): string {
  const repoPath = join(WORK_DIR, repo.replace('/', '-'));
  
  if (!existsSync(repoPath)) {
    mkdirSync(WORK_DIR, { recursive: true });
    execSync(`git clone --depth 1 https://github.com/${repo}.git ${repoPath}`, { 
      encoding: 'utf8' 
    });
  }
  
  return repoPath;
}

// Main execution
const args = process.argv.slice(2);
const repoArg = args.find(a => a.startsWith('bigknoxy/') || a.includes('/'));

if (repoArg) {
  const repo = repoArg.replace('bigknoxy/', '');
  console.log(`Scanning ${repo}...`);
  
  const repoPath = cloneIfNeeded(`bigknoxy/${repo}`);
  const npmResult = checkNpmAudit(repoPath);
  const trivyResult = checkTrivy(repoPath);
  
  const report = {
    repo,
    timestamp: new Date().toISOString(),
    npm: npmResult,
    trivy: trivyResult
  };
  
  // Save report
  const reportPath = join('/root/code/autoJobs/logs', `security-${repo}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${reportPath}`);
}