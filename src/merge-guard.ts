#!/usr/bin/env bun
/**
 * Merge Guard - Prevents merging PRs with failing CI
 * Runs as GitHub Action or in monitoring loop
 */

import { execSync } from 'child_process';

function getBranchStatus(repo: string, branch: string): 'SUCCESS' | 'FAILURE' | 'PENDING' {
  try {
    const checks = JSON.parse(
      execSync(`curl -s "https://api.github.com/repos/${repo}/commits/${branch}/check-runs" -H "Authorization: token ${process.env.GH_TOKEN}" -H "Accept: application/vnd.github.v3+json"`, { encoding: 'utf8' })
    );
    
    const runs = checks.check_runs || [];
    if (runs.some((r: any) => r.conclusion === 'FAILURE')) return 'FAILURE';
    if (runs.some((r: any) => r.status === 'IN_PROGRESS')) return 'PENDING';
    return 'SUCCESS';
  } catch { return 'PENDING'; }
}

function addMergeBlocker(repo: string, pr: number, status: string, issues: string[]) {
  const comment = `## ⛔ Merge Blocked

**Reason:** CI checks failing
${issues.map(i => `- ❌ ${i}`).join('\n')}

This PR cannot be merged until all checks pass.`;
  
  execSync(`gh pr comment ${pr} --repo ${repo} --body "${comment}"`, { encoding: 'utf8' });
}

function main() {
  const repos = ['bigknoxy/joshbot', 'bigknoxy/flight-deal-monitor'];
  
  for (const repo of repos) {
    try {
      const prs = JSON.parse(
        execSync(`curl -s "https://api.github.com/repos/${repo}/pulls?state=open" -H "Authorization: token ${process.env.GH_TOKEN}" -H "Accept: application/vnd.github.v3+json"`, { encoding: 'utf8' })
      );
      
      for (const pr of prs) {
        const status = getBranchStatus(repo, pr.head.ref);
        
        if (status === 'FAILURE') {
          // Get failure details
          const checks = JSON.parse(
            execSync(`curl -s "https://api.github.com/repos/${repo}/commits/${pr.head.ref}/check-runs" -H "Authorization: token ${process.env.GH_TOKEN}" -H "Accept: application/vnd.github.v3+json"`, { encoding: 'utf8' })
          );
          
          const failures = checks.check_runs
            .filter((r: any) => r.conclusion === 'FAILURE')
            .map((r: any) => `${r.name}: ${r.conclusion}`);
          
          addMergeBlocker(repo, pr.number, 'FAILURE', failures);
        }
      }
    } catch {}
  }
}

main();