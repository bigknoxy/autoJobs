#!/usr/bin/env bun
/**
 * Main orchestrator for bigknoxy repo monitoring
 * Wakes up every 5 minutes and delegates work to pi threads
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { REPOSITORIES, MONITOR_CONFIG } from './config/repositories';

const LOG_DIR = join(import.meta.dir, '..', 'logs');

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

interface Task {
  id: string;
  type: 'pr-check' | 'pipeline' | 'security' | 'e2e' | 'sync';
  repo: string;
  priority: 'high' | 'medium' | 'low';
}

function createTasks(): Task[] {
  const tasks: Task[] = [];
  
  for (const repo of REPOSITORIES) {
    tasks.push({
      id: `${repo.owner}/${repo.name}-pr`,
      type: 'pr-check',
      repo: `${repo.owner}/${repo.name}`,
      priority: 'medium'
    });
    tasks.push({
      id: `${repo.owner}/${repo.name}-pipeline`,
      type: 'pipeline',
      repo: `${repo.owner}/${repo.name}`,
      priority: 'high'
    });
    if (repo.securityScan) {
      tasks.push({
        id: `${repo.owner}/${repo.name}-security`,
        type: 'security',
        repo: `${repo.owner}/${repo.name}`,
        priority: 'high'
      });
    }
  }
  
  return tasks;
}

function runWithPi(task: Task): string {
  const { model, provider, thinking } = MONITOR_CONFIG.pi;
  const skill = `skills/${task.type === 'pr-check' ? 'monitoring' : 'security'}/pr-monitor.skill.md`;
  
  try {
    // Run pi in non-interactive mode with the skill
    const cmd = `pi --model ${model} --skill skills/${task.type === 'pr-check' ? 'monitoring' : 'security'}/pr-monitor.skill.md -p "Execute ${task.type} for ${task.repo}"`;
    return execSync(cmd, { encoding: 'utf8' });
  } catch (e) {
    return `Task ${task.id} failed: ${(e as Error).message}`;
  }
}

function logResult(task: Task, result: string) {
  const timestamp = new Date().toISOString();
  const logFile = join(LOG_DIR, `${task.type}.log`);
  writeFileSync(logFile, `${timestamp} - ${task.id}: ${result}\n`, { flag: 'a' });
}

console.log('Starting orchestrator loop...');
console.log(`Monitoring ${REPOSITORIES.length} repositories`);

// Create tasks
const tasks = createTasks();
console.log(`Created ${tasks.length} tasks`);

// For now, run sequentially - pi threads would be spawned for parallel execution
for (const task of tasks) {
  console.log(`Executing task: ${task.id}`);
  const result = runWithPi(task);
  logResult(task, result);
}

console.log('Orchestrator cycle complete');