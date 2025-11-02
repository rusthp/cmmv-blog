# Security Checklist

## Pre-Commit Security Checks

Before committing code, verify:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] No sensitive data in code comments
- [ ] Environment variables used for configuration
- [ ] `.env` files in `.gitignore`
- [ ] Secrets properly stored in environment variables
- [ ] No credentials in log outputs

## Security Best Practices

### Authentication & Authorization
- [ ] JWT tokens properly signed and validated
- [ ] Password hashing using secure algorithms
- [ ] Session management secure
- [ ] Access control properly implemented
- [ ] Rate limiting on authentication endpoints

### Data Protection
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection enabled
- [ ] Data encryption at rest (if applicable)
- [ ] HTTPS enforced in production

### Dependencies
- [ ] Regular dependency updates
- [ ] Security audits (`pnpm audit`)
- [ ] No known vulnerabilities
- [ ] Pinned dependency versions in production

### Infrastructure
- [ ] Secure server configuration
- [ ] Firewall rules properly configured
- [ ] Regular security updates
- [ ] Monitoring and logging enabled
- [ ] Backup and recovery procedures tested

## CI/CD Security Checks

The following checks run automatically in CI/CD:

- ✅ **Secrets Scanning**: Gitleaks scans for hardcoded secrets
- ✅ **Dependency Audit**: npm audit checks for vulnerabilities
- ✅ **Snyk Security Scan**: Advanced vulnerability scanning
- ✅ **Dependency Review**: Automatic PR review for dependency changes
- ✅ **Code Security Checks**: Pattern matching for common security issues

## Manual Security Checks

Run these commands locally before pushing:

```bash
# Check for potential secrets
pnpm audit --production

# Check dependencies
pnpm outdated

# Type check
pnpm run type-check
```

## Reporting Security Issues

See `SECURITY.md` for information on reporting security vulnerabilities.

---

*Last updated: 2025-11-02*

