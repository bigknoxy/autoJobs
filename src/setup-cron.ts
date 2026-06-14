#!/usr/bin/env bun
/**
 * Setup cron jobs for automated monitoring
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CRON_FILE = '/etc/cron.d/bigknoxy-monitor';

function installCron(): boolean {
  // First, ensure we can write to cron
  try {
    const cronEntry = `# Bigknoxy repo monitoring - runs every 5 minutes
*/5 * * * * root cd /root/code/autoJobs && /usr/bin/pi --model poolside/lagina-m.1 --skill skills/orchestration/maintainer-orchestrator.skill.md -p "Run monitoring cycle" >> /root/code/autoJobs/logs/cron.log 2>&1
`;
    
    // Check if we have permission or use user crontab
    try {
      writeFileSync(CRON_FILE, cronEntry);
      console.log('System cron installed to /etc/cron.d/bigknoxy-monitor');
      return true;
    } catch {
      // Fall back to user crontab
      const userCron = `*/5 * * * * cd /root/code/autoJobs && /usr/bin/pi --model poolside/lagina-m.1 --skill skills/orchestration/maintainer-orchestrator.skill.md -p "Run monitoring cycle" >> /root/code/autoJobs/logs/cron.log 2>&1\n`;
      execSync(`crontab -l 2>/dev/null | grep -v "bigknoxy-monitor"`, { encoding: 'utf8' });
      execSync(`echo "${userCron}" | crontab -`, { encoding: 'utf8' });
      console.log('User crontab installed');
      return true;
    }
  } catch (e) {
    console.error('Failed to install cron:', (e as Error).message);
    return false;
  }
}

function checkSystemdService(): boolean {
  const servicePath = '/etc/systemd/system/bigknoxy-monitor.service';
  
  if (existsSync(servicePath)) {
    console.log('Systemd service already installed');
    return true;
  }
  
  const serviceContent = `[Unit]
Description=Bigknoxy Repository Monitor
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/code/autoJobs
ExecStart=/usr/bin/pi --model poolside/lagina-m.1 --skill skills/orchestration/maintainer-orchestrator.skill.md
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
  } catch (e) {
    console.log('Systemd service setup skipped (requires sudo)');
    return false;
  }
}

console.log('Setting up automated monitoring...\n');

// Install cron
console.log('1. Installing cron job...');
installCron();

// Optionally setup systemd
console.log('2. Checking systemd service...');
checkSystemdService();

console.log('\nDone! Next steps:');
console.log('- Add repositories to src/config/repositories.ts');
console.log('- Run: bun run src/install-skills.ts');
console.log('- Start monitoring: systemctl start bigknoxy-monitor');