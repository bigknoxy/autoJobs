#!/usr/bin/env bun
/**
 * Auto-discover repositories from the bigknoxy organization
 * Populates the REPOSITORIES config
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { REPOSITORIES } from './config/repositories';

function discoverOrgRepos(org: string): string[] {
  try {
    const json = execSync(
      `gh api --paginate orgs/${org}/repos --jq '[.[] | "\\(.owner.login)/\\(.name)"] | join("\\n")'`,
      { encoding: 'utf8' }
    );
    return json.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function generateConfig(repos: string[]) {
  const config = `export const REPOSITORIES: RepoConfig[] = [
${repos.map(repo => `  {
    owner: "${repo.split('/')[0]}",
    name: "${repo.split('/')[1]}",
    pipelineNotify: true,
    securityScan: true,
    e2eTest: true
  }`).join(',\n')}
];
`;
  return config;
}

// Main
const discovered = discoverOrgRepos('bigknoxy');

if (discovered.length === 0) {
  console.log('No repositories found under bigknoxy org (may not exist yet)');
  console.log('Creating template config for manual setup...');
} else {
  console.log(`Found ${discovered.length} repositories:`);
  discovered.forEach(r => console.log(`  - ${r}`));
  
  const configFile = join(import.meta.dir, 'config', 'repositories.ts');
  const current = readFileSync(configFile, 'utf8');
  const newContent = current.replace(
    /export const REPOSITORIES: RepoConfig\[\] = \[[\s\S]*?\];/,
    generateConfig(discovered)
  );
  writeFileSync(configFile, newContent);
  console.log(`\nUpdated ${configFile}`);
}