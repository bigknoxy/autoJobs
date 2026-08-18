#!/usr/bin/env bun
/**
 * Setup cron jobs for automated monitoring.
 *
 * Installs an hourly cron job that runs src/optimized-runner.ts (cached,
 * low-overhead PR monitoring). Prefers /etc/cron.d when writable, otherwise
 * merges a user crontab entry without clobbering existing entries.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const CRON_FILE = '/etc/cron.d/bigknoxy-monitor';
const WORK_DIR = '/root/code/autoJobs';

function findBun(): string | null {
  for (const candidate of ['bun', '/root/.bun/bin/bun', '/usr/local/bin/bun']) {
    try {
      const out = execSync(`command -v ${candidate} || ls ${candidate}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (out) return out;
    } catch { /* try next */ }
  }
  return null;
}

function installCron(): boolean {
  const bun = findBun();
  if (!bun) {
    console.error('bun not found - cannot install cron job');
    return false;
  }

  const command = `cd ${WORK_DIR} && ${bun} run src/optimized-runner.ts >> ${WORK_DIR}/logs/cron.log 2>&1`;

  // Preferred: system cron.d file (needs root; entry includes the user field).
  try {
    const systemEntry = `# Bigknoxy repo monitoring - runs once per hour (optimized-runner with caching)\n0 * * * * root ${command}\n`;
    writeFileSync(CRON_FILE, systemEntry);
    console.log('System cron installed to /etc/cron.d/bigknoxy-monitor');
    return true;
  } catch {
    // Fall back to the user crontab, merging with any existing entries.
    let existing = '';
    try {
      existing = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf8' });
    } catch { existing = ''; }

    const filtered = existing
      .split('\n')
      .filter(line => line.trim() !== '' && !line.includes(WORK_DIR))
      .join('\n')
      .trimEnd();

    const next = [filtered, `0 * * * * ${command}`].filter(Boolean).join('\n') + '\n';
    const tmpFile = join(tmpdir(), 'bigknoxy-crontab');
    writeFileSync(tmpFile, next, { mode: 0o600 });
    try {
      execSync(`crontab ${tmpFile}`, { encoding: 'utf8' });
    } finally {
      try { unlinkSync(tmpFile); } catch { /* best effort */ }
    }
    console.log('User crontab entry installed (existing entries preserved)');
    return true;
  }
}

function checkSystemdService(): boolean {
  const servicePath = '/etc/systemd/system/bigknoxy-monitor.service';

  if (existsSync(servicePath)) {
    console.log('Systemd service already installed');
    return true;
  }

  const bun = findBun();
  if (!bun) return false;

  const serviceContent = `[Unit]
Description=Bigknoxy Repository Monitor
After=network.target

[Service]
Type=simple
WorkingDirectory=${WORK_DIR}
ExecStart=${bun} run src/auto-runner.ts --loop
Restart=always
RestartSec=300

[Install]
WantedBy=multi-user.target
`;

  try {
    writeFileSync(servicePath, serviceContent);
    execSync('systemctl daemon-reload', { encoding: 'utf8' });
    execSync('systemctl enable bigknoxy-monitor', { encoding: 'utf8' });
    console.log('Systemd service installed and enabled');
    return true;
  } catch {
    console.log('Systemd service setup skipped (requires root/systemd)');
    return false;
  }
}

console.log('Setting up automated monitoring...\n');

console.log('1. Installing cron job...');
installCron();

console.log('\n2. Checking systemd service...');
checkSystemdService();

console.log('\nDone! Next steps:');
console.log('- Add repositories to src/config/repositories.ts');
console.log('- Run: bun run src/install-skills.ts');
console.log('- Run one monitoring cycle now: bun run src/optimized-runner.ts');
