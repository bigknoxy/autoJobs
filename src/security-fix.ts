#!/usr/bin/env bun
/**
 * Security Auto-Fix - Automatically remediate vulnerabilities
 * Supports Go modules and Python packages
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
    execSync(`git clone --depth 1 https://github.com/${owner}/${name}.git ${repoPath}`, { 
      encoding: 'utf8' 
    });
  }
  
  return repoPath;
}

function getVulnerabilities(repoPath: string): Vulnerability[] {
  const reports = execSync(`ls -t ${LOG_DIR}/security-*.json 2>/dev/null | head -1`, { 
    encoding: 'utf8' 
  }).trim();
  
  if (!reports) return [];
  
  const report = JSON.parse(readFileSync(reports, 'utf8'));
  const vulns: Vulnerability[] = [];
  
  try {
    const trivy = JSON.parse(report.trivy);
    for (const result of trivy.Results || []) {
      for (const v of result.Vulnerabilities || []) {
        if (v.FixedVersion) {
          vulns.push({
            VulnerabilityID: v.VulnerabilityID,
            PkgName: v.PkgName,
            InstalledVersion: v.InstalledVersion,
            FixedVersion: v.FixedVersion,
            Severity: v.Severity
          });
        }
      }
    }
  } catch {}
  
  return vulns;
}

function runSecurityScan(repo: string) {
  execSync(`bun run /root/code/autoJobs/src/security-scan.ts ${repo}`, { 
    encoding: 'utf8' 
  });
}

function createFixAndPR(repoPath: string, vuln: Vulnerability) {
  const branchName = `security/${vuln.VulnerabilityID.toLowerCase()}-fix`;
  const repoName = repoPath.split('/').pop();
  const requirementsPath = join(repoPath, 'requirements.txt');
  
  try {
    // Ensure remote is set
    try {
      execSync(`cd ${repoPath} && git remote set-url origin https://github.com/bigknoxy/${repoName}.git 2>/dev/null`, { encoding: 'utf8' });
    } catch {}
    
    // Create branch
    execSync(`cd ${repoPath} && git checkout -b ${branchName} 2>/dev/null || git checkout ${branchName}`, { encoding: 'utf8' });
    
    // For Go modules - update the package
    if (vuln.PkgName.includes('golang.org') || vuln.PkgName.includes('go')) {
      execSync(`cd ${repoPath} && go get ${vuln.PkgName}@v${vuln.FixedVersion}`, { encoding: 'utf8' });
    }
    
    // For Python packages - update requirements.txt
    if (requirementsPath && existsSync(requirementsPath)) {
      const req = readFileSync(requirementsPath, 'utf8');
      const updated = req.replace(
        new RegExp(`${vuln.PkgName}==[^\\n]+`, 'g'),
        `${vuln.PkgName}==${vuln.FixedVersion}`
      );
      writeFileSync(requirementsPath, updated);
    }
    
    // Check if there are changes
    const changes = execSync(`cd ${repoPath} && git status --porcelain`, { encoding: 'utf8' });
    if (!changes.trim()) {
      console.log(`No changes needed for ${vuln.VulnerabilityID}`);
      return false;
    }
    
    // Commit and push
    execSync(`cd ${repoPath} && git add . && git commit -m "${vuln.VulnerabilityID}: ${vuln.Severity} fix for ${vuln.PkgName}"`, { encoding: 'utf8' });
    execSync(`cd ${repoPath} && git push -u origin ${branchName}`, { encoding: 'utf8' });
    
    // Create PR
    const prUrl = execSync(
      `gh pr create --repo bigknoxy/${repoName} --head ${branchName} --base main --title "${vuln.VulnerabilityID}: ${vuln.Severity} fix for ${vuln.PkgName}" --body "Automated security remediation\n\n- Vulnerability: ${vuln.VulnerabilityID}\n- Package: ${vuln.PkgName}@${vuln.InstalledVersion} → ${vuln.FixedVersion}\n- Severity: ${vuln.Severity}\n\nAuto-fixed by poolside/laguna-m.1"`,
      { encoding: 'utf8' }
    );
    
    console.log(`Created PR: ${prUrl}`);
    return true;
  } catch (e) {
    console.error(`Fix failed for ${vuln.VulnerabilityID}: ${(e as Error).message}`);
    return false;
  }
}

// Main
const repo = process.argv[2] || 'bigknoxy/joshbot';
console.log(`Security auto-fix for ${repo}...`);

const repoPath = cloneRepo(repo);
console.log(`Working in: ${repoPath}`);

runSecurityScan(repo);
const vulns = getVulnerabilities(repoPath);
console.log(`Found ${vulns.length} fixable vulnerabilities`);

for (const vuln of vulns) {
  console.log(`Fixing ${vuln.VulnerabilityID} in ${vuln.PkgName}`);
  createFixAndPR(repoPath, vuln);
}