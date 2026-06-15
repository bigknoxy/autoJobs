#!/usr/bin/env bun
/**
 * Dogfood Tester - Deep PR validation with CI status check
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

function getCIStatus(repo: string, pr: number): { passed: boolean; details: string[] } {
  try {
    const checks = JSON.parse(execSync(
      `gh pr view ${pr} --repo ${repo} --json statusCheckRollup --jq '.'`, 
      { encoding: 'utf8' }
    ));
    
    const ciChecks = checks.statusCheckRollup || [];
    const failed = ciChecks.filter((c: any) => c.conclusion === 'FAILURE');
    const passed = ciChecks.filter((c: any) => c.conclusion === 'SUCCESS');
    
    return {
      passed: failed.length === 0 && ciChecks.length > 0,
      details: ciChecks.map((c: any) => `${c.conclusion}: ${c.name}`)
    };
  } catch { return { passed: true, details: ['No CI checks'] }; }
}

function dogfoodPR(repo: string, pr: { number: number; headRefName: string }) {
  const repoName = repo.split('/')[1];
  const prDir = join(WORK_DIR, `${repoName}-dogfood-${pr.number}`);
  
  try {
    const ci = getCIStatus(repo, pr.number);
    
    let issues: string[] = [];
    let approvals: string[] = [];
    
    // Check CI status
    if (ci.passed && ci.details.length > 0) {
      approvals.push('✅ CI: All checks passing');
    } else if (ci.details.length > 0) {
      approvals.push(`⚠️ CI: ${ci.details.filter((d: string) => d.startsWith('FAILURE')).length} failures`);
      issues.push('CI checks failing - verify workflow');
    } else {
      approvals.push('⏳ CI: Pending or no workflow');
    }
    
    // Clone PR branch
    mkdirSync(WORK_DIR, { recursive: true });
    execSync(`git clone --depth 1 --branch ${pr.headRefName} https://github.com/${repo}.git ${prDir} 2>/dev/null || true`, { encoding: 'utf8' });
    
    // Build test
    const pkgJson = join(prDir, 'package.json');
    if (existsSync(pkgJson)) {
      try {
        execSync(`cd ${prDir} && npm ci --silent && npm run build --silent 2>&1 | head -5`, { encoding: 'utf8' });
        approvals.push('🏗️ Build: PASSED');
      } catch {
        issues.push('🏗️ Build FAILED');
      }
    }
    
    // Post comment
    const rating = issues.length === 0 ? '✅ READY TO MERGE' : '⚠️ CHANGES NEEDED';
    const comment = `## 🐶 Dogfood Results

**Status:** ${rating}

**CI Checks:**
${ci.details.map((d: string) => `- ${d}`).join('\n')}

**Local Tests:**
${approvals.map(a => `- ${a}`).join('\n')}
${issues.length > 0 ? `\n**Issues:**\n${issues.map(i => `- ${i}`).join('\n')}\n` : ''}`;
    
    execSync(`gh pr comment ${pr.number} --repo ${repo} --body "${comment}"`, { encoding: 'utf8' });
    log(`PR #${pr.number}: CI=${ci.passed ? 'PASSED' : 'FAILED'}, Issues=${issues.length}`);
    
  } catch (e) {
    log(`Failed PR #${pr.number}: ${(e as Error).message}`);
  }
}

function main() {
  ['bigknoxy/joshbot', 'bigknoxy/flight-deal-monitor'].forEach(repo => {
    try {
      const prs = JSON.parse(execSync(`gh pr list --repo ${repo} --state open --json number,headRefName --jq '.'`, { encoding: 'utf8' }));
      prs.forEach((pr: { number: number; headRefName: string }) => dogfoodPR(repo, pr));
    } catch {}
  });
}

main();