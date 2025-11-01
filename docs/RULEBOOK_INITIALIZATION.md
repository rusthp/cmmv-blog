# Rulebook Initialization

## Overview

This document describes the initialization of the Rulebook system in the CMMV Blog project.

## Date

2025-11-01

## Action Performed

The Rulebook was successfully initialized in the project using:

```bash
npx @hivellm/rulebook@latest init --yes
```

## Version

- **Rulebook Version**: `@hivellm/rulebook@0.16.0` (latest available)

## Files Created

### 1. AGENTS.md

Location: `B:\cmmv-blog\AGENTS.md`

This is the main rules file that contains all project standards and guidelines for AI assistants working on the project. It includes:

- Quality enforcement rules
- Documentation standards
- Testing requirements
- TypeScript project rules
- Agent automation workflow
- Git workflow rules

### 2. .cursorrules

Location: `B:\cmmv-blog\.cursorrules`

IDE-specific configuration file that references the AGENTS.md file and provides quick access to critical rules for development.

### 3. GitHub Actions Workflows

Three workflow files were generated in `.github/workflows/`:

#### typescript-test.yml
- Runs tests on multiple platforms (ubuntu-latest, windows-latest, macos-latest)
- Tests on Node.js versions 18.x and 20.x
- Generates coverage reports
- Uploads coverage to Codecov
- Performs security audits
- Checks for unused dependencies

#### typescript-lint.yml
- Type checking with TypeScript
- ESLint linting
- Prettier code formatting checks

#### codespell.yml
- Spelling verification using codespell

## Project Detection

The Rulebook automatically detected:

- **Language**: TypeScript (100% confidence)
- **Indicators**: 
  - package.json
  - tsconfig.json
  - 597 TypeScript files (.ts)

## Configuration

### Detected Project Structure

The tool detected a TypeScript monorepo structure with:
- Multiple apps (admin, api, web)
- Multiple packages (access-control, affiliate, ai-content, etc.)
- Turbo monorepo configuration
- pnpm workspace configuration

### Quality Standards Applied

The following quality standards are now enforced:

1. **Test Coverage**: Minimum 95%
2. **Test Execution**: 100% of tests must pass
3. **Linting**: Must pass with zero warnings
4. **Type Checking**: Strict TypeScript mode
5. **Code Formatting**: Prettier configuration
6. **Documentation**: Organized structure with `/docs` directory

## Next Steps

1. Review `AGENTS.md` to understand all project rules
2. Review generated workflows in `.github/workflows/`
3. Create `.rulesignore` if needed to selectively disable rules
4. Set up `/docs` structure for project documentation
5. Run AI assistant with the new rules

## Integration with Vectorizer

The project is already configured in the Vectorizer workspace (`vectorize-workspace.yml`) with two active collections:

- `cmmv-blog-source`: 5,890 vectors from 560 documents
- `cmmv-blog-config`: 35 vectors from 15 documents

Both collections are actively collecting project files according to their include/exclude patterns.

## Maintenance

To update the Rulebook configuration in the future:

```bash
npx @hivellm/rulebook@latest update
```

This will update `AGENTS.md` and `.rulebook` to the latest version while preserving custom configurations.

## References

- Rulebook Package: https://www.npmjs.com/package/@hivellm/rulebook
- Main Rules File: `AGENTS.md`
- IDE Configuration: `.cursorrules`
- GitHub Workflows: `.github/workflows/`

