# E2E Tester Skill

Runs end-to-end tests on repositories with automated test infrastructure.

## Capabilities
- Clone repo and install dependencies
- Run E2E test suites (Playwright, Cypress, Puppeteer)
- Generate test reports
- Post results to PR comments
- Auto-create issues for failing tests

## Usage
```
pi --skill skills/testing/e2e-tester.skill.md -p "Run E2E tests on https://github.com/bigknoxy/repo#123"
```

## Test Detection
- Looks for `playwright.config.*` or `cypress.config.*`
- Checks for `e2e` or `test` scripts in package.json
- Runs tests in isolated worktrees

## Output
- Test results JSON
- Screenshots/videos of failures
- Summary for PR comment