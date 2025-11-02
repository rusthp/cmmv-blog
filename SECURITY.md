# Security Policy

## Supported Versions

We currently provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of our project seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send an email to the project maintainer with details of the vulnerability
2. **Private Security Advisory**: Use GitHub's private security advisory feature
3. **Direct Contact**: Contact the project maintainer directly through secure channels

### What to Include

When reporting a vulnerability, please include:

- **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass)
- **Affected component** (specific file, module, or feature)
- **Steps to reproduce** (detailed instructions to demonstrate the vulnerability)
- **Potential impact** (what could an attacker do with this vulnerability)
- **Suggested fix** (if you have any ideas on how to fix it)

### Response Timeline

We will acknowledge receipt of your report within **48 hours** and provide a more detailed response within **7 days** indicating the next steps in handling your report.

### Disclosure Policy

- We will inform you when the vulnerability has been fixed
- We may ask you to verify the fix before public disclosure
- We will credit you for the discovery (if you wish) in our security advisories
- We aim to fix critical vulnerabilities within **30 days** of confirmation

## Security Best Practices

### For Contributors

1. **Never commit secrets** (API keys, passwords, tokens, etc.)
2. **Use environment variables** for sensitive configuration
3. **Review dependencies** for known vulnerabilities
4. **Follow secure coding practices** as outlined in AGENTS.md
5. **Run security audits** before submitting PRs

### For Users

1. **Keep dependencies updated**: Run `pnpm audit` regularly
2. **Use environment variables**: Never hardcode sensitive data
3. **Review permissions**: Ensure proper access control configuration
4. **Monitor logs**: Watch for suspicious activity
5. **Regular backups**: Keep backups of your database and media files

## Security Checklist

### Authentication & Authorization

- [ ] JWT tokens properly signed and validated
- [ ] Password hashing using secure algorithms (bcrypt, argon2)
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
- [ ] No known vulnerabilities in dependencies
- [ ] Pinned dependency versions in production

### Infrastructure

- [ ] Secure server configuration
- [ ] Firewall rules properly configured
- [ ] Regular security updates applied
- [ ] Monitoring and logging enabled
- [ ] Backup and recovery procedures tested

## Known Security Considerations

### Current Security Measures

1. **Input Validation**: All user inputs are validated and sanitized
2. **SQL Injection Prevention**: Using parameterized queries with Repository pattern
3. **XSS Prevention**: Vue.js automatically escapes content
4. **CORS Configuration**: Configured per deployment
5. **Authentication**: JWT-based authentication with refresh tokens

### Areas Under Review

- API rate limiting (planned)
- Enhanced logging and monitoring (in progress)
- Automated security scanning (planned)

## Security Updates

Security updates are released as:
- **Patch versions** (e.g., 0.1.96 → 0.1.97) for critical security fixes
- **Security advisories** published on GitHub when vulnerabilities are fixed

## Dependency Security

We regularly audit our dependencies:

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix

# Check outdated packages
pnpm outdated
```

## Reporting Security Issues in Code

If you find a security issue in the codebase:

1. **Do not** create a public issue
2. **Do** follow the reporting process above
3. **Do** allow time for a fix before public disclosure
4. **Do** help verify the fix if requested

## Thank You

Thank you for helping keep our project and users safe!

