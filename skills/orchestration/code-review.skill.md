# Code Review Skill

Reviews open PRs for quality, security, and correctness before merge. Runs in the monitoring loop.

## Review Process

### 1. PR Analysis
- Clone PR branch in isolated worktree
- Analyze code changes for:
  - Breaking changes (API compatibility)
  - Test coverage (check for test files)
  - Security vulnerabilities (Trivy scan)
  - Code quality (TypeScript errors, linting)

### 2. Testing
- Run project's test suite
- If no tests exist: auto-create tests for changed code
- Run security scan on PR branch
- Verify build passes

### 3. Dogfooding
- Check if changes integrate with main branch
- Run integration tests if available
- Validate CI/CD pipelines

### 4. Report
- Post detailed comment on PR with:
  - Security findings
  - Test results
  - Code quality issues
  - Recommendation (APPROVE / REQUEST CHANGES)

## Usage
```
pi --skill skills/orchestration/code-review.skill.md -p "Review PR #56 on bigknoxy/joshbot"
```

Or in monitoring loop:
```
pi --skill skills/orchestration/code-review.skill.md -p "Review all open PRs"
```

## Output Format
```json
{
  "approval": "APPROVED|CHANGES_REQUESTED|WORK_IN_PROGRESS",
  "security": { "score": 8.5, "findings": [] },
  "tests": { "passed": 12, "failed": 0 },
  "issues": ["Missing test for new function", "Consider using const instead of let"]
}
```