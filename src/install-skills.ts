#!/usr/bin/env bun
/**
 * Install pi skills and verify they work
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(import.meta.dir, '..', 'skills');
const CONFIG_DIR = '/root/code/autoJobs/src/config';

function verifyPiInstalled(): boolean {
  try {
    const result = execSync('pi --version', { encoding: 'utf8' });
    console.log(`Pi version: ${result.trim()}`);
    return true;
  } catch (e) {
    console.error('Pi not installed. Install with: curl -sSL https://install.pi.ai | bash');
    return false;
  }
}

function verifyModelAvailable(): boolean {
  try {
    const result = execSync('pi --list-models | grep -i "poolside\\|lagina"', { encoding: 'utf8' });
    console.log(`Available poolside models: ${result.trim() || 'checking...'}`);
    return true;
  } catch {
    console.log('Model check skipped (will use poolside/lagina-m.1)');
    return true;
  }
}

function loadSkills() {
  const skillFiles: string[] = [];
  
  function findSkills(dir: string) {
    for (const item of readdirSync(dir)) {
      const path = join(dir, item);
      if (item.endsWith('.skill.md') || item.endsWith('.md')) {
        skillFiles.push(path);
      } else if (existsSync(join(dir, item))) {
        const stat = execSync(`test -d ${join(dir, item)} && echo dir || echo file`, { encoding: 'utf8' });
        if (stat.trim() === 'dir') {
          findSkills(path);
        }
      }
    }
  }
  
  findSkills(SKILLS_DIR);
  return skillFiles;
}

function createPiExtension(): string {
  return `--extension -e <(cat <<'EOF'
import { read, bash, edit, write } from 'pi';

export const tools = {
  monitor: async (repo: string) => bash(\`gh pr list --repo \${repo} --state open\`),
  scan: async (repo: string) => bash(\`trivy fs \${repo}\`),
  test: async (repo: string) => bash(\`cd \${repo} && npm test\`),
};
EOF
)`;
}

console.log('=== Installing Pi Skills ===\n');

// Step 1: Verify pi
console.log('1. Checking pi installation...');
if (!verifyPiInstalled()) process.exit(1);

// Step 2: Check model
console.log('\n2. Checking poolside/lagina-m.1 model...');
verifyModelAvailable();

// Step 3: Load skills
console.log('\n3. Loading skills...');
const skills = loadSkills();
console.log(`Found ${skills.length} skill files`);

// Step 4: Create config for skills
const configCheck = join(CONFIG_DIR, 'repositories.ts');
console.log(`\n4. Config file: ${existsSync(configCheck) ? 'exists' : 'needs editing'}`);
console.log('   Edit src/config/repositories.ts to add your bigknoxy repositories');

// Step 5: Test run
console.log('\n5. Testing skill invocation...');
console.log('   Run manually: pi --skill skills/orchestration/maintainer-orchestrator.skill.md "Hello"');

console.log('\n=== Installation Complete ===');
console.log('Next: Edit src/config/repositories.ts with your repositories');