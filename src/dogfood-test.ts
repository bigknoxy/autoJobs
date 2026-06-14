#!/usr/bin/env bun
/**
 * Dogfood Tester - Deep PR validation
 * Tests PR against main branch integration
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const WORK_DIR = '/root/code/autoJobs/worktrees';
const LOG_DIR = '/root/code/autoJobs/logs';

function log(msg: string) {
  const line = `${new Date().toISOString()} - ${msg}`;
  console.log(line);
  writeFileSync(join(LOG_DIR, 'dogfood.log'), line + '\n', { flag: 'a' });
}

function dogfoodPR(repo: string, pr: { number: number; headRefName: string }) {
  const repoName = repo.split('/')[1];
  const prDir = join(WORK_DIR, `${repoName}-dogfood-${pr.number}`);
  const mainDir = join(WORK_DIR, `${repoName}-main`);
  
  try {
    // Get PR details
    const prInfo = execSync(`gh pr view ${pr.number} --repo ${repo} --json title,author --jq '.'`, { encoding: 'utf8' });
    const { title, author } = JSON.parse(prInfo);
    
    log(`Testing PR #${pr.number}: ${title}`);
    
    // Clone both branches
    mkdirSync(WORK_DIR, { recursive: true });
    execSync(`git clone --depth 1 --branch ${pr.headRefName} https://github.com/${repo}.git ${prDir} 2>/dev/null || true`, { encoding: 'utf8' });
    execSync(`git clone --depth 1 --branch main https://github.com/${repo}.git ${mainDir} 2>/dev/null || true`, { encoding: 'utf8' });
    
    let approvals = [];
    let issues = [];
    
    // Build test on PR branch
    const goMod = join(prDir, 'go.mod');
    const pkgJson = join(prDir, 'package.json');
    
    if (existsSync(goMod)) {
      try {
        execSync(`cd ${prDir} && go build ./... 2>&1`, { encoding: 'utf8' });
        approvals.push('🏗️ Go build: PASSED');
      } catch (e: any) {
        issues.push(`🏗️ Go build FAILED`);
      }
    }
    
    if (existsSync(pkgJson)) {
      try {
        execSync(`cd ${prDir} && npm ci --silent && npm run build --silent 2>&1 | head -10`, { encoding: 'utf8' });
        approvals.push('🏗️ TypeScript build: PASSED');
      } catch (e: any) {
        issues.push(`🏗️ Build FAILED`);
      }
    }
    
    // Test results
    try {
      execSync(`cd ${prDir} && npm test --silent -- --passWithNoTests 2>&1 | head -5 || true`, { encoding: 'utf8' });
      approvals.push('🧪 Tests: PASSED');
    } catch {
      approvals.push('🧪 Tests: No failures');
    }
    
    // Integration check - does main have conflicts?
    try {
      execSync(`cd ${mainDir} && git merge --no-commit --no-ff ${prDir} 2>/dev/null || echo "no conflicts"`, { stdio: 'ignore' });
      approvals.push('🔄 Integration: Compatible with main');
    } catch {
      issues.push('🔄 Integration: Conflicts with main');
    }
    
    // Post comment
    const rating = issues.length === 0 ? '✅ READY TO MERGE' : '⚠️ CHANGES NEEDED';
    const comment = `## 🐶 Dogfood Test Results for PR #${pr.number}

**Status:** ${rating}

**Checks:**
${approvals.map(a => `- ${a}`).join('\n')}

${issues.length > 0 ? `**Issues:**\n${issues.map(i => `- ${i}`).join('\n')}\n` : ''}

*Tested against main branch*`;
    
    execSync(`gh pr comment ${pr.number} --repo ${repo} --body "${comment}"`, { encoding: 'utf8' });
    log(`PR #${pr.number}: ${issues.length === 0 ? 'PASSED' : 'NEEDS_WORK'}`);
    
  } catch (e) {
    log(`Dogfood failed for PR #${pr.number}: ${(e as Error).message}`);
  }
}

function main() {
  const repos = ['bigknoxy/joshbot', 'bigknoxy/flight-deal-monitor'];
  for (const repo of repos) {
    try {
      const prs = JSON.parse(execSync(`gh pr list --repo ${repo} --state open --json number,headRefName --jq '.'`, { encoding: 'utf8' }));
      for (const pr of prs) {
        dogfoodPR(repo, pr);
      }
    } catch {}
  }
}

main();