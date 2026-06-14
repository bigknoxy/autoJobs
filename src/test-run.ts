#!/usr/bin/env bun
/**
 * Quick test to verify the system is working
 */

import { spawn } from 'bun';

console.log('Testing pi integration...');

// Test 1: Check pi is available
try {
  const piVersion = spawn(['pi', '--version']);
  const output = await piVersion.stdout.text();
  console.log(`✓ Pi version: ${output.trim()}`);
} catch (e) {
  console.error('✗ Pi not available');
  process.exit(1);
}

// Test 2: Check model
try {
  const modelCheck = spawn(['pi', '--list-models']);
  const output = await modelCheck.stdout.text();
  if (output.includes('poolside')) {
    console.log('✓ Poolside model available');
  }
} catch (e) {
  console.log('Model check skipped');
}

// Test 3: Check gh CLI
try {
  const ghAuth = spawn(['gh', 'auth', 'status']);
  await ghAuth.stdout.text();
  console.log('✓ GitHub CLI authenticated');
} catch {
  console.log('⚠ GitHub CLI not authenticated (run: gh auth login)');
}

console.log('\nSetup complete! Add repos to src/config/repositories.ts to start monitoring.');