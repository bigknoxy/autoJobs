# Security Scan Skill

Performs automated security scans on repositories using various tools.

## Capabilities
- Run `trivy` filesystem scans
- Check for vulnerable dependencies
- Scan Dockerfiles and Kubernetes manifests
- Generate security reports
- Create or update security issues

## Tools Used
- trivy (infrastructure)
- npm audit (JavaScript)
- bun audit (if available)
- semgrep (code analysis)

## Usage
```
pi --skill skills/security/security-scan.skill.md -p "Scan https://github.com/bigknoxy/repo for vulnerabilities"
```

## Output
- JSON report in logs/security/
- GitHub issues for critical findings
- Summary for Slack/Discord webhook