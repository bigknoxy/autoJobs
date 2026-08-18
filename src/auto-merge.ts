#!/usr/bin/env bun
/**
 * Auto-Merge - Merges PRs that pass CI + dogfood tests
 * Runs after code review detects ready PRs
 */

import { execSync } from 'child_process';

function getMergedPRs(repo: string) {
  // PRs merged in last hour
  try {
    return JSON.parse(execSync(
      `gh pr list --repo ${repo} --state merged --search "merged:>$(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" --json number,title --jq '.'`, 
      { encoding: 'utf8' }
    ));
  } catch { return []; }
}

function canMerge(repo: string, pr: number): boolean {
  try {
    // Check CI status
    const checks = JSON.parse(execSync(
      `gh pr view ${pr} --repo ${repo} --json statusCheckRollup --jq '.'`,
      { encoding: 'utf8' }
    ));
    
    const hasFailures = (checks.statusCheckRollup || []).some((c: any) => 
      c.conclusion === 'FAILURE'
    );
    
    // Check mergeability
    const mergeable = JSON.parse(execSync(
      `gh pr view ${pr} --repo ${repo} --json mergeable --jq '.'`,
      { encoding: 'utf8' }
    )).mergeable;
    
    return !hasFailures && mergeable;
  } catch { return false; }
}

function autoMerge(repo: string, pr: number) {
  try {
    // Check if we can auto-merge (no merge conflicts, CI passing)
    const can = canMerge(repo, pr);
    if (!can) return;
    
    // Merge with squash
    execSync(`gh pr merge ${pr} --repo ${repo} --squash --auto`, { encoding: 'utf8' });
    console.log(`Auto-merged PR #${pr} on ${repo}`);
  } catch (e) {
    console.error(`Merge failed: ${(e as Error).message}`);
  }
}

function main() {
  const repos = ['bigknoxy/joshbot', 'bigknoby/flight-deal-monitor'];
  
  for (const repo of repos) {
    try {
      const prs = JSON.parse(execSync(
        `gh pr list --repo ${repo} --state open --json number --jq '.'`,
        { encoding: 'utf8' }
      ));
      
      for (const pr of prs) {
        autoMerge(repo, pr.number);
      }
    } catch {}
  }
}

main();