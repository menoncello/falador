/**
 * Commitlint Configuration
 * Enforces Conventional Commits standard
 *
 * Format: type(scope): subject
 * Example: feat(api): add health endpoint
 *
 * Types: feat, fix, docs, style, refactor, test, chore, ci, build, perf
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, missing semi-colons, etc)
        'refactor', // Code refactoring
        'test', // Adding or updating tests
        'chore', // Maintenance tasks
        'ci', // CI/CD changes
        'build', // Build system changes
        'perf', // Performance improvements
        'revert', // Revert previous commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
