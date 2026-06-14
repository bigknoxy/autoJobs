#!/usr/bin/env bun
/**
 * Main entry point for bigknoxy repository automation
 * 
 * Usage:
 *   bun run src/main.ts            # Single run
 *   bun run src/main.ts --loop     # Continuous loop (every 5 min)
 *   bun run src/main.ts --once     # Single run, exit
 */

import { ThreadManager } from './thread-manager';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(import.meta.dir, '..', 'logs');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} - ${message}`;
  console.log(line);
  writeFileSync(join(LOG_DIR, 'main.log'), line + '\n', { flag: 'a' });
}

async function runCycle() {
  log('Starting monitoring cycle...');
  
  const manager = new ThreadManager();
  const tasks = manager.createTasks();
  
  if (tasks.length === 0) {
    log('No repositories configured');
    return;
  }
  
  log(`Executing ${tasks.length} tasks`);
  
  // For parallel execution, we could use Promise.all with concurrency limit
  // but pi has built-in concurrency via sessions so sequential is fine
  for (const task of tasks) {
    try {
      const cmd = `pi --model poolside/laguna-m.1 --skill ${task.skill} -p "${task.prompt}"`;
      Bun.spawnSync({ cmd: ['bash', '-c', cmd], stdout: 'pipe', stderr: 'pipe' });
      log(`Completed: ${task.id}`);
    } catch (e) {
      log(`Failed ${task.id}: ${(e as Error).message}`);
    }
  }
  
  log('Cycle complete');
}

// Check for --loop flag
const args = process.argv.slice(2);
const shouldLoop = args.includes('--loop') || args.includes('-l');

if (shouldLoop) {
  log('Starting continuous loop (Ctrl+C to stop)');
  
  const interval = setInterval(() => {
    runCycle().catch(e => log(`Cycle error: ${e.message}`));
  }, 5 * 60 * 1000); // 5 minutes
  
  // Initial run
  runCycle().catch(e => log(`Initial run error: ${e.message}`));
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down...');
    clearInterval(interval);
    process.exit(0);
  });
} else {
  // Single run
  runCycle().catch(e => {
    console.error(e);
    process.exit(1);
  });
}