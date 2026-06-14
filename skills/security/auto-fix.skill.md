# Auto-Fix Security Skill

Automated vulnerability remediation using pi + poolside/lagina-m.1.

## Capabilities
- Parse trivy vulnerability reports
- Generate automated code fixes for known CVEs
- Create PRs with security patches
- Auto-create GitHub issues for critical findings
- Post fix summaries to Discord/Slack

## Workflow
1. Analyze security scan report
2. Identify fixable vulnerabilities (have FixedVersion)
3. Use pi to generate and apply fixes
4. Create branch and commit changes
5. Open PR with vulnerability details
6. Notify maintainers

## Usage
```
bun run src/security-fix.ts bigknoxy/joshbot
```

## Example Fix
CVE-2022-32149 in golang.org/x/text v0.3.7 → v0.3.8
- Runs: `go get golang.org/x/text@v0.3.8`
- Updates go.mod
- Creates PR with fix