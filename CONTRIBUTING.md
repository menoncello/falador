# Contributing to Falador

Thank you for considering contributing to Falador! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [CI/CD Requirements](#cicd-requirements)

---

## Code of Conduct

This project follows a code of conduct. By participating, you agree to uphold this code. Please report unacceptable behavior to support@falador.ai.

## Getting Started

### Prerequisites

- **Bun** >= 1.3.0
- **PostgreSQL** >= 17.4
- **Redis** >= 7.0
- **Docker** (for local development)
- **Git**

### Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/falador.git
cd falador

# Add upstream remote
git remote add upstream https://github.com/yourusername/falador.git

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start Docker services
docker-compose up -d

# Run migrations
bun run db:migrate
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Fetch latest changes
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, readable code following our [coding standards](#coding-standards)
- Add tests for all new functionality
- Update documentation as needed
- Follow the [commit message convention](#commit-message-convention)

### 3. Run Tests Locally

```bash
# Run all quality gates (same as CI)
bun run quality-gates

# Individual checks
bun run lint           # ESLint
bun run typecheck      # TypeScript
bun run format:check   # Prettier
bun test              # Unit tests
bun run test:coverage  # Coverage (80% minimum)
bun run test:mutate    # Mutation testing (80% minimum)
bun run test:e2e       # E2E tests
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit (commitlint runs automatically via Husky)
git commit -m "feat(api): add health endpoint"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill out the PR template completely
```

---

## Coding Standards

### TypeScript

- **Strict Mode**: All TypeScript must compile with `strict: true`
- **No Any Types**: Never use `any` type - use proper types or `unknown`
- **Explicit Return Types**: All functions must have explicit return types
- **No Type Assertions**: Avoid `as` type assertions unless absolutely necessary

### ESLint

- **Zero Violations**: All code must pass ESLint with zero errors/warnings
- **No Disabled Rules**: ❌ NEVER use `eslint-disable` comments
- **Fix Issues**: Always fix the underlying code problem, never disable the rule

### Code Style

- **Prettier**: All code must be formatted with Prettier
- **File Naming**: kebab-case for files (e.g., `audio-service.ts`)
- **Class Naming**: PascalCase (e.g., `AudioService`)
- **Function Naming**: camelCase (e.g., `generateAudio`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Architecture

- **Clean Architecture**: Follow domain-driven design principles
- **SOLID Principles**: Single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion
- **Dependency Injection**: Use constructor injection with tsyringe
- **No Circular Dependencies**: Ensure proper layering (domain → application → infrastructure)

---

## Testing Requirements

### Test Coverage

All contributions must meet these minimum requirements:

- ✅ **80% Line Coverage** (c8, enforced in CI)
- ✅ **75% Branch Coverage** (c8, enforced in CI)
- ✅ **85% Function Coverage** (c8, enforced in CI)
- ✅ **80% Mutation Score** (Stryker, enforced in CI)

### Test Structure

**Given-When-Then Pattern:**

```typescript
import { describe, test, expect } from 'bun:test';

describe('AudioGenerationService', () => {
  test('1.2-UNIT-001 [P0] - should generate audio successfully', async () => {
    // GIVEN: Audio service with mocked dependencies
    const mockTTS = {
      generate: mock(() => Promise.resolve(Buffer.from('audio'))),
    };
    const service = new AudioGenerationService(
      mockTTS,
      mockStorage,
      mockLogger
    );

    // WHEN: Generating audio from text
    const result = await service.generate('Hello world', voiceConfig);

    // THEN: Audio buffer should be returned
    expect(result).toBeDefined();
    expect(mockTTS.generate).toHaveBeenCalledWith('Hello world', voiceConfig);
  });
});
```

### Test ID Convention

Format: `X.Y-TYPE-NNN [P#]`

- **X.Y**: Story ID (e.g., 1.2 for Story 1.2)
- **TYPE**: Test type (UNIT, API, E2E, CI)
- **NNN**: Sequential number (001, 002, etc.)
- **P#**: Priority level (P0 = critical, P1 = high, P2 = medium, P3 = low)

Examples:

- `1.2-CI-001 [P0]` - Story 1.2, CI test, first test, critical priority
- `3.4-UNIT-012 [P1]` - Story 3.4, unit test, twelfth test, high priority

### Mutation Testing

**CRITICAL RULE**: NEVER reduce mutation testing thresholds to make tests pass.

If mutation score is below 80%:

1. ✅ **ADD MORE TESTS** to kill surviving mutants
2. ✅ **IMPROVE TEST QUALITY** to cover edge cases
3. ❌ **NEVER LOWER THRESHOLDS** as a shortcut

This rule is enforced per CLAUDE.md user preferences.

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope): subject

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semi-colons)
- **refactor**: Code refactoring (no functional changes)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes
- **build**: Build system changes
- **perf**: Performance improvements

### Examples

```bash
feat(api): add health endpoint
fix(tts): resolve audio generation timeout
docs(readme): update installation instructions
test(audio): add unit tests for TTS gateway
refactor(plugin): improve plugin architecture
ci(actions): add mutation testing to pipeline
```

### Rules

- **Lowercase**: Type and scope must be lowercase
- **Present Tense**: Use "add" not "added"
- **No Period**: Subject line should not end with a period
- **Max Length**: Subject line max 100 characters
- **Imperative Mood**: "add feature" not "adds feature"

**The commit-msg hook will reject commits that don't follow this convention.**

---

## Pull Request Process

### Before Submitting

1. ✅ All tests pass locally (`bun run quality-gates`)
2. ✅ Code coverage meets 80% threshold
3. ✅ Mutation score meets 80% threshold
4. ✅ No ESLint violations
5. ✅ No TypeScript errors
6. ✅ Prettier formatting applied
7. ✅ Documentation updated (if applicable)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Closes #123

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Quality Checks

- [ ] ESLint passing
- [ ] TypeScript passing
- [ ] Tests passing (100% pass rate)
- [ ] Coverage >= 80%
- [ ] Mutation score >= 80%
- [ ] Documentation updated

## Screenshots (if applicable)

Add screenshots for UI changes
```

### Review Process

1. **Automated Checks**: CI pipeline must pass (all jobs green)
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Reviewer verifies tests are comprehensive
4. **Documentation**: Reviewer checks documentation updates
5. **Merge**: Squash and merge (maintainer only)

---

## CI/CD Requirements

### CI Pipeline Jobs

All PRs trigger the CI pipeline with these jobs:

1. **lint**: ESLint + TypeScript type checking
2. **test**: Unit/integration tests with PostgreSQL/Redis
3. **mutation-test**: Stryker mutation testing (80% threshold)
4. **e2e**: Playwright E2E tests
5. **build**: Docker image build validation

**All jobs must pass before merge.**

### Branch Protection Rules

The `main` and `staging` branches are protected:

- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require commit signature (recommended)
- ❌ No direct pushes allowed
- ❌ No force pushes allowed

---

## Getting Help

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/falador/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/falador/discussions)
- **Discord**: [Join our Discord](https://discord.gg/falador)

---

## License

By contributing to Falador, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Falador! 🎙️**
