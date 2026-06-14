# Dogfood Tester Skill

Deep PR validation: runs full test suite + checks compatibility before merge.

## Validation Layers

### 1. Build Verification
- Clone PR branch
- Install dependencies
- Run full build (npm run build / go build)
- Check for TypeScript errors

### 2. Test Suite Execution
- Run unit tests (npm test)
- Run e2e tests if available
- Capture test coverage changes

### 3. Integration Check
- Merge PR changes with main branch locally
- Run smoke tests
- Check for conflicts/conflicts

### 4. Breaking Change Detection
- Detect exported API changes
- Check for removed functions
- Validate CLI interface changes

## Usage
```
pi --skill skills/testing/dogfood-tester.skill.md -p "Dogfood PR #56 on bigknoxy/joshbot"
```

## Merge Blocking
- FAIL: Build broken or tests failing
- WARN: Breaking API changes detected
- PASS: All checks green