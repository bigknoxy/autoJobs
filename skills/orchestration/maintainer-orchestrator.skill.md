# Maintainer Orchestrator Skill

Coordinates automated maintenance tasks for repository monitoring. Runs in loops with configurable intervals.

## Capabilities
- Wake up on interval (default 5 minutes)
- Delegate work to parallel pi threads
- Prioritize tasks based on urgency
- Maintain state across runs
- Send notifications via webhooks

## Usage
```
pi --skill skills/orchestration/maintainer-orchestrator.skill.md --model poolside/lagina-m.1 "Start monitoring loop"
```

## Task Priority
1. **High**: Failing pipelines, security vulnerabilities
2. **Medium**: New PRs needing review, outdated dependencies
3. **Low**: Routine sync, documentation updates

## Architecture
- Master loop spawns worker threads
- Each thread handles one repo/task
- Results aggregated and reported
- State persisted in logs/ directory