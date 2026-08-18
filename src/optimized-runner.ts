#!/usr/bin/env bun
/**
 * Optimized Auto-Runner - efficient, low-overhead repository monitoring.
 *
 * Optimizations over the plain auto-runner:
 * 1. PR data is cached for 30 minutes so repeated runs do not re-hit the API.
 * 2. Delta detection via a processed-PRs ledger reports only new PRs.
 * 3. A single cron entry runs this file (no per-task shell fan-out).
 */
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { REPOSITORIES } from './config/repositories';

const LOG_DIR = join(import.meta.dir, '..', 'logs');

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes cache

interface CachedResult {
  timestamp: number;
  data: any[];
}

interface PullRequest {
  number: number;
  title: string;
  author: { login: string };
  createdAt: string;
  headRefName: string;
}

function log(msg: string) {
  const line = `${new Date().toISOString()} - ${msg}`;
  console.log(line);
  writeFileSync(join(LOG_DIR, 'optimized-runner.log'), line + '\n', { flag: 'a' });
}

/**
 * Fetch open PRs per repository using individual gh calls, with a 30-minute
 * on-disk cache so back-to-back runs are nearly free.
 */
function fetchPrsWithCaching(repos: string[]): Map<string, PullRequest[]> {
  const results = new Map<string, PullRequest[]>();
  const now = Date.now();

  for (const spec of repos) {
    const cacheFile = join(LOG_DIR, `cache-prs-${spec.replace('/', '-')}.json`);

    // Check cache first
    if (existsSync(cacheFile)) {
      try {
        const cached: CachedResult = JSON.parse(readFileSync(cacheFile, 'utf8'));
        if (now - cached.timestamp < CACHE_DURATION_MS && Array.isArray(cached.data)) {
          results.set(spec, cached.data);
          continue;
        }
      } catch { /* ignore cache errors */ }
    }

    // Fetch fresh data; on failure fall back to stale cache if present.
    try {
      const json = execSync(
        `gh pr list --repo ${spec} --state open --json number,title,author,createdAt,headRefName --jq '.'`,
        { encoding: 'utf8' }
      );
      const prs: PullRequest[] = JSON.parse(json);
      results.set(spec, prs);
      writeFileSync(cacheFile, JSON.stringify({ timestamp: now, data: prs }));
    } catch (e) {
      log(`Failed to fetch ${spec}: ${(e as Error).message}`);
      try {
        const stale: CachedResult = JSON.parse(readFileSync(cacheFile, 'utf8'));
        if (Array.isArray(stale.data)) {
          results.set(spec, stale.data);
          log(`Using stale cache for ${spec}`);
          continue;
        }
      } catch { /* no stale cache */ }
      results.set(spec, []);
    }
  }

  return results;
}

/**
 * Check whether a PR has already been reported.
 */
function isProcessed(prKey: string): boolean {
  const processedFile = join(LOG_DIR, 'processed-prs.json');
  if (!existsSync(processedFile)) return false;
  try {
    const processed = new Set(JSON.parse(readFileSync(processedFile, 'utf8')));
    return processed.has(prKey);
  } catch {
    return false;
  }
}

/**
 * Record a PR as processed. Keeps only the most recent 1000 keys.
 */
function markProcessed(prKey: string) {
  const processedFile = join(LOG_DIR, 'processed-prs.json');
  let processed: string[] = [];
  try {
    processed = JSON.parse(readFileSync(processedFile, 'utf8'));
    if (!Array.isArray(processed)) processed = [];
  } catch { /* start fresh */ }

  processed.push(prKey);
  if (processed.length > 1000) processed = processed.slice(-1000);
  writeFileSync(processedFile, JSON.stringify(processed));
}

async function main() {
  log('\n=== OPTIMIZED MONITORING CYCLE ===');

  const repos = REPOSITORIES.map(r => `${r.owner}/${r.name}`);
  log(`Fetching PRs for ${repos.length} repos with caching...`);
  const results = fetchPrsWithCaching(repos);

  let totalPRs = 0;
  for (const [spec, prs] of results) {
    totalPRs += prs.length;
    const newPRs = prs.filter(p => !isProcessed(`${spec}-${p.number}`));
    log(`${spec}: ${prs.length} PRs (${newPRs.length} new)`);
    for (const pr of newPRs) {
      log(`  new PR ${spec}#${pr.number}: ${pr.title} (by ${pr.author?.login ?? 'unknown'})`);
      markProcessed(`${spec}-${pr.number}`);
    }
  }

  log(`Total: ${totalPRs} open PRs`);
  log('Cycle complete');
}

main().catch(e => log(`Error: ${e.message}`));
