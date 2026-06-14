#!/usr/bin/env bun
/**
 * Thread Manager - Spawns parallel pi threads for repository work
 * Uses the poolside/laguna-m.1 model for each task
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { REPOSITORIES, MONITOR_CONFIG } from './config/repositories';

interface WorkerTask {
  id: string;
  skill: string;
  prompt: string;
  priority: 'high' | 'medium' | 'low';
}

export class ThreadManager {
  private model = MONITOR_CONFIG.pi.model;
  
  createTasks(): WorkerTask[] {
    const tasks: WorkerTask[] = [];
    
    for (const repo of REPOSITORIES) {
      const repoPath = `${repo.owner}/${repo.name}`;
      
      // PR check task
      tasks.push({
        id: `${repoPath}-pr`,
        skill: 'skills/monitoring/pr-monitor.skill.md',
        prompt: `Check open PRs for ${repoPath}`,
        priority: 'medium'
      });
      
      // Pipeline monitor task
      tasks.push({
        id: `${repoPath}-pipeline`,
        skill: 'skills/monitoring/pr-monitor.skill.md',
        prompt: `Monitor pipeline status for ${repoPath}`,
        priority: 'high'
      });
      
      // Security scan task
      if (repo.securityScan) {
        tasks.push({
          id: `${repoPath}-security`,
          skill: 'skills/security/security-scan.skill.md',
          prompt: `Scan ${repoPath} for vulnerabilities`,
          priority: 'high'
        });
      }
      
      // E2E test task
      if (repo.e2eTest) {
        tasks.push({
          id: `${repoPath}-e2e`,
          skill: 'skills/testing/e2e-tester.skill.md',
          prompt: `Run E2E tests for ${repoPath}`,
          priority: 'low'
        });
      }
    }
    
    return tasks;
  }
  
  async spawnWorker(task: WorkerTask): Promise<string> {
    try {
      const cmd = `pi --model ${this.model} --skill ${task.skill} -p "${task.prompt}"`;
      const output = execSync(cmd, { 
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      });
      return output;
    } catch (e) {
      return `Error in ${task.id}: ${(e as Error).message}`;
    }
  }
  
  async runParallel(tasks: WorkerTask[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Group by priority
    const high = tasks.filter(t => t.priority === 'high');
    const medium = tasks.filter(t => t.priority === 'medium');
    const low = tasks.filter(t => t.priority === 'low');
    
    // Run high priority first
    console.log(`Running ${high.length} high-priority tasks...`);
    for (const task of high) {
      results.set(task.id, await this.spawnWorker(task));
    }
    
    // Run medium priority
    console.log(`Running ${medium.length} medium-priority tasks...`);
    for (const task of medium) {
      results.set(task.id, await this.spawnWorker(task));
    }
    
    // Run low priority
    console.log(`Running ${low.length} low-priority tasks...`);
    for (const task of low) {
      results.set(task.id, await this.spawnWorker(task));
    }
    
    return results;
  }
}

// Run if executed directly
if (import.meta.main) {
  const manager = new ThreadManager();
  const tasks = manager.createTasks();
  
  console.log(`Thread manager starting with ${tasks.length} tasks...`);
  
  if (tasks.length === 0) {
    console.log('No repositories configured. Add them to src/config/repositories.ts');
    process.exit(0);
  }
  
  const results = await manager.runParallel(tasks);
  
  console.log('\n=== Results ===');
  for (const [id, result] of results) {
    console.log(`${id}: ${result.substring(0, 100)}...`);
  }
}