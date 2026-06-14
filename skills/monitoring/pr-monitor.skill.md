# PR Monitor Skill

This skill monitors open PRs across configured repositories, tracks pipeline status, and triggers automated actions.

## Capabilities
- List open PRs with status
- Monitor CI/CD pipeline status
- Comment on PRs with test results
- Auto-approve safe changes
- Trigger pi coding assistant for reviews

## Usage
```
pi --skill skills/monitoring/pr-monitor.skill.md "Monitor open PRs for bigknoxy repos"
```

## Workflow
1. Fetch open PRs from configured repos
2. Check pipeline/CI status
3. If pipeline fails, trigger security scan
4. If pipeline succeeds, run E2E tests
5. Generate summary report