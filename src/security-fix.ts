#!/usr/bin/env bun
/**
 * Security Auto-Fix - With proper lock file regeneration for Python
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';

const WORK_DIR = '/root/code/autoJobs/worktrees';
const LOG_DIR = '/root/code/autoJobs/logs';

interface Vulnerability {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion: string;
  Severity: string;
}

function cloneRepo(repo: string): string {
  const [owner, name] = repo.includes('/') ? repo.split('/') : ['bigknoxy', repo];
  const repoPath = join(WORK_DIR, name);
  
  if (!existsSync(repoPath)) {
    mkdirSync(WORK_DIR, { recursive: true });
    execSync(`git clone --depth 1 https://github.com/${owner}/${name}.git ${repoPath}`, { encoding: 'utf8' });
  }
  
  return repoPath;
}

function createFixAndPR(repoPath: string, vuln: Vulnerability) {
  const branchName = `security/${vuln.VulnerabilityID.toLowerCase()}-fix`;
  const repoName = repoPath.split('/').pop();
  
  try {
    execSync(`cd ${repoPath} && git fetch origin && git checkout -b ${branchName} 2>/dev/null || git checkout ${branchName}`, { encoding: 'utf8' });
    
    // Update based on language
    if (vuln.PkgName.includes('golang.org') || vuln.PkgName.includes('go')) {
      execSync(`cd ${repoPath} && go get ${vuln.PkgName}@v${vuln.FixedVersion}`, { encoding: 'utf8' });
    }
    
    // Python - update requirements and regenerate lock
    const reqPath = join(repoPath, 'requirements.txt');
    const lockPath = join(repoPath, 'requirements.lock');
    
    if (existsSync(reqPath)) {
      const req = readFileSync(reqPath, 'utf8');
      const updated = req.replace(
        new RegExp(`${vuln.PkgName}==[^\\n]+`, 'g'),
        `${vuln.PkgName}==${vuln.FixedVersion}`
      );
      writeFileSync(reqPath, updated);
      
      // Try to regenerate lock file
      try {
        execSync(`cd ${repoPath} && pip-compile requirements.txt --output-file requirements.lock 2>/dev/null || python3 -m pip freeze > requirements.lock`, { encoding: 'utf8' });
      } catch {}
    }
    
    const changes = execSync(`cd ${repoPath} && git status --porcelain`, { encoding: 'utf8' });
    if (!changes.trim()) return false;
    
    execSync(`cd ${repoPath} && git add . && git commit -m "${vuln.VulnerabilityID}: ${vuln.Severity} fix for ${vuln.PkgName}"`, { encoding: 'utf8' });
    execSync(`cd ${repoPath} && git push -u origin ${branchName}`, { encoding: 'utf8' });
    
    const prUrl = execSync(
      `gh pr create --repo bigknoxy/${repoName} --head ${branchName} --base main --title "${vuln.VulnerabilityID}: ${vuln.Severity} fix" --body "Auto-security fix for ${vuln.PkgName}"`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log(`Created: ${prUrl}`);
    return true;
  } catch (e) {
    console.error(`Failed: ${(e as Error).message}`);
    return false;
  }
}

// Run for repo
const repo = process.argv[2] || 'bigknoxy/joshbot';
cloneRepo(repo);
console.log(`Ready for: ${repo}`);