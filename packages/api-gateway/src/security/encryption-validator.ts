/**
 * Data Encryption Configuration Validator
 * Validates and monitors encryption settings and practices
 */

export interface EncryptionConfig {
  jwtSecret: string | undefined;
  bcryptRounds: number;
  sessionDuration: number;
  minSecretLength: number;
  randomBytesLength: number;
  hasJwtSecretFromEnv: boolean;
}

export interface EncryptionValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  recommendations: string[];
  config: EncryptionConfig;
}

export interface ValidationIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'configuration' | 'security' | 'compliance' | 'performance';
  message: string;
  recommendation: string;
  current: any;
  expected: any;
}

export interface EncryptionMetrics {
  passwordHashRounds: number;
  jwtSecretLength: number;
  sessionDuration: number;
  apiKeyEntropy: number;
  timestamp: number;
  environment: string;
}

/**
 *
 */
export class EncryptionValidator {
  private static readonly MIN_BCRYPT_ROUNDS = 12;
  private static readonly MIN_JWT_SECRET_LENGTH = 32;
  private static readonly MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MIN_RANDOM_BYTES = 32;
  private static readonly RECOMMENDED_BCRYPT_ROUNDS = 14;
  private static readonly RECOMMENDED_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  private config: EncryptionConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EncryptionConfig {
    const jwtSecret = process.env['JWT_SECRET'];
    const bcryptRoundsStr = process.env['BCRYPT_ROUNDS'];
    const sessionDurationStr = process.env['SESSION_DURATION'];

    return {
      jwtSecret: jwtSecret ?? undefined,
      bcryptRounds: bcryptRoundsStr ? parseInt(bcryptRoundsStr, 10) : 10, // Lower default to trigger warnings
      sessionDuration: sessionDurationStr ? parseInt(sessionDurationStr, 10) : 24 * 60 * 60 * 1000, // 24 hours
      minSecretLength: 32,
      randomBytesLength: 32,
      hasJwtSecretFromEnv: !!jwtSecret,
    };
  }

  /**
   * Validate current encryption configuration
   */
  public validate(): EncryptionValidationResult {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Validate JWT Secret
    const jwtSecretIssues = this.validateJwtSecret();
    issues.push(...jwtSecretIssues);
    for (const issue of jwtSecretIssues) {
      score -= this.getScorePenalty(issue.severity);
    }

    // Validate bcrypt rounds
    const bcryptIssues = this.validateBcryptRounds();
    issues.push(...bcryptIssues);
    for (const issue of bcryptIssues) {
      score -= this.getScorePenalty(issue.severity);
    }

    // Validate session duration
    const sessionIssues = this.validateSessionDuration();
    issues.push(...sessionIssues);
    for (const issue of sessionIssues) {
      score -= this.getScorePenalty(issue.severity);
    }

    // Validate random bytes configuration
    const randomBytesIssues = this.validateRandomBytes();
    issues.push(...randomBytesIssues);
    for (const issue of randomBytesIssues) {
      score -= this.getScorePenalty(issue.severity);
    }

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues));

    // Sort issues by severity
    issues.sort(
      (a, b) =>
        this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)
    );

    return {
      isValid: issues.filter((i) => i.severity === 'critical').length === 0,
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations,
      config: { ...this.config },
    };
  }

  private validateJwtSecret(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const secret = this.config.jwtSecret || 'development-secret-change-in-production-min-32-chars';

    if (!this.config.hasJwtSecretFromEnv) {
      issues.push({
        severity: 'critical',
        category: 'configuration',
        message: 'JWT_SECRET environment variable is not set',
        recommendation:
          'Set a strong, randomly generated JWT_SECRET environment variable',
        current: 'undefined',
        expected: 'string with >= 32 characters',
      });
    }

    const secretLength = secret.length;
    if (secretLength < EncryptionValidator.MIN_JWT_SECRET_LENGTH) {
      issues.push({
        severity: 'critical',
        category: 'security',
        message: `JWT secret is too short (${secretLength} characters)`,
        recommendation: 'Use a JWT secret with at least 32 characters',
        current: secretLength,
        expected: `>= ${EncryptionValidator.MIN_JWT_SECRET_LENGTH}`,
      });
    }

    if (
      secret === 'test-secret-key' ||
      secret === 'development-secret-change-in-production-min-32-chars'
    ) {
      issues.push({
        severity: 'critical',
        category: 'security',
        message: 'Using default or weak JWT secret',
        recommendation: 'Replace with a strong, randomly generated secret',
        current: `${secret.substring(0, 8)}...`,
        expected: 'randomly generated secret',
      });
    }

    // Check for common weak patterns
    if (this.isWeakSecret(secret)) {
      issues.push({
        severity: 'high',
        category: 'security',
        message: 'JWT secret contains weak patterns',
        recommendation:
          'Use a cryptographically random secret without common patterns',
        current: 'contains weak patterns',
        expected: 'cryptographically random',
      });
    }

    return issues;
  }

  private validateBcryptRounds(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (this.config.bcryptRounds < EncryptionValidator.MIN_BCRYPT_ROUNDS) {
      issues.push({
        severity: 'high',
        category: 'security',
        message: `Bcrypt rounds too low (${this.config.bcryptRounds})`,
        recommendation: `Increase bcrypt rounds to at least ${EncryptionValidator.MIN_BCRYPT_ROUNDS}`,
        current: this.config.bcryptRounds,
        expected: `>= ${EncryptionValidator.MIN_BCRYPT_ROUNDS}`,
      });
    }

    if (
      this.config.bcryptRounds < EncryptionValidator.RECOMMENDED_BCRYPT_ROUNDS
    ) {
      issues.push({
        severity: 'medium',
        category: 'compliance',
        message: `Bcrypt rounds below recommended (${this.config.bcryptRounds})`,
        recommendation: `Consider increasing to ${EncryptionValidator.RECOMMENDED_BCRYPT_ROUNDS} for better security`,
        current: this.config.bcryptRounds,
        expected: `>= ${EncryptionValidator.RECOMMENDED_BCRYPT_ROUNDS}`,
      });
    }

    if (this.config.bcryptRounds > 16) {
      issues.push({
        severity: 'low',
        category: 'performance',
        message: `Bcrypt rounds very high (${this.config.bcryptRounds})`,
        recommendation: 'Consider balancing security and performance',
        current: this.config.bcryptRounds,
        expected: '12-14 rounds recommended',
      });
    }

    return issues;
  }

  private validateSessionDuration(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (
      this.config.sessionDuration > EncryptionValidator.MAX_SESSION_DURATION
    ) {
      issues.push({
        severity: 'medium',
        category: 'security',
        message: `Session duration too long (${this.formatDuration(this.config.sessionDuration)})`,
        recommendation: 'Consider shorter session duration for better security',
        current: this.config.sessionDuration,
        expected: `<= ${EncryptionValidator.MAX_SESSION_DURATION}`,
      });
    }

    if (
      this.config.sessionDuration >
      EncryptionValidator.RECOMMENDED_SESSION_DURATION
    ) {
      issues.push({
        severity: 'low',
        category: 'compliance',
        message: `Session duration exceeds recommendation (${this.formatDuration(this.config.sessionDuration)})`,
        recommendation: `Consider reducing to ${this.formatDuration(EncryptionValidator.RECOMMENDED_SESSION_DURATION)}`,
        current: this.config.sessionDuration,
        expected: `<= ${EncryptionValidator.RECOMMENDED_SESSION_DURATION}`,
      });
    }

    return issues;
  }

  private validateRandomBytes(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (this.config.randomBytesLength < EncryptionValidator.MIN_RANDOM_BYTES) {
      issues.push({
        severity: 'high',
        category: 'security',
        message: `Random bytes length too low (${this.config.randomBytesLength})`,
        recommendation: `Use at least ${EncryptionValidator.MIN_RANDOM_BYTES} bytes for cryptographic randomness`,
        current: this.config.randomBytesLength,
        expected: `>= ${EncryptionValidator.MIN_RANDOM_BYTES}`,
      });
    }

    return issues;
  }

  private isWeakSecret(secret: string): boolean {
    const weakPatterns = [
      /password/i,
      /secret/i,
      /test/i,
      /dev/i,
      /demo/i,
      /123/i,
      /abc/i,
      /^(.)\1+$/, // Repeated characters
      /^[A-Za-z]+$/, // Only letters
      /^\d+$/, // Only numbers
    ];

    return weakPatterns.some((pattern) => pattern.test(secret));
  }

  private getScorePenalty(severity: ValidationIssue['severity']): number {
    switch (severity) {
      case 'critical':
        return 40;
      case 'high':
        return 15;
      case 'medium':
        return 8;
      case 'low':
        return 3;
      default:
        return 0;
    }
  }

  private getSeverityWeight(severity: ValidationIssue['severity']): number {
    switch (severity) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }

  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];

    // General recommendations
    if (issues.some((i) => i.category === 'security')) {
      recommendations.push(
        '🔒 Review security configurations and follow security best practices'
      );
    }

    if (issues.some((i) => i.category === 'configuration')) {
      recommendations.push(
        '⚙️ Ensure all required environment variables are properly configured'
      );
    }

    if (issues.some((i) => i.category === 'compliance')) {
      recommendations.push(
        '📋 Align configurations with security compliance requirements'
      );
    }

    if (issues.some((i) => i.category === 'performance')) {
      recommendations.push(
        '⚡ Balance security settings with application performance'
      );
    }

    // Specific recommendations
    if (issues.some((i) => i.message.includes('JWT'))) {
      recommendations.push(
        '🔑 Generate a new JWT secret using: openssl rand -base64 32'
      );
    }

    if (issues.some((i) => i.message.includes('bcrypt'))) {
      recommendations.push(
        '🛡️ Consider stronger password hashing for production environments'
      );
    }

    return recommendations;
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get current encryption metrics
   */
  public getMetrics(): EncryptionMetrics {
    return {
      passwordHashRounds: this.config.bcryptRounds,
      jwtSecretLength: this.config.jwtSecret?.length || 0,
      sessionDuration: this.config.sessionDuration,
      apiKeyEntropy: this.config.randomBytesLength * 8, // Convert bytes to bits
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Check if the current configuration is production-ready
   */
  public isProductionReady(): boolean {
    const validation = this.validate();

    if (!validation.isValid) {
      return false;
    }

    // Additional production checks
    if (!this.config.jwtSecret || this.config.jwtSecret.length < 32) {
      return false;
    }

    if (this.config.bcryptRounds < 12) {
      return false;
    }

    if (process.env.NODE_ENV === 'production') {
      // Production-specific checks
      if (
        this.config.jwtSecret.includes('test') ||
        this.config.jwtSecret.includes('dev') ||
        this.config.jwtSecret.includes('demo')
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Export validation results for external systems
   */
  public exportValidation(): string {
    const validation = this.validate();
    const metrics = this.getMetrics();

    return JSON.stringify(
      {
        timestamp: Date.now(),
        validation: {
          isValid: validation.isValid,
          score: validation.score,
          issuesCount: validation.issues.length,
          criticalIssues: validation.issues.filter(
            (i) => i.severity === 'critical'
          ).length,
          highIssues: validation.issues.filter((i) => i.severity === 'high')
            .length,
          mediumIssues: validation.issues.filter((i) => i.severity === 'medium')
            .length,
          lowIssues: validation.issues.filter((i) => i.severity === 'low')
            .length,
        },
        metrics,
        configuration: {
          environment: process.env.NODE_ENV || 'development',
          productionReady: this.isProductionReady(),
        },
        recommendations: validation.recommendations,
        issues: validation.issues.map((issue) => ({
          severity: issue.severity,
          category: issue.category,
          message: issue.message,
          recommendation: issue.recommendation,
        })),
      },
      null,
      2
    );
  }
}

// Singleton instance for application-wide validation
export const encryptionValidator = new EncryptionValidator();
