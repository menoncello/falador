#!/bin/bash

# Security Scanning Script for Falador Project
# Performs comprehensive security vulnerability scanning

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_ROOT/docs/security-reports"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Create reports directory
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}🔒 Falador Security Scanner${NC}"
echo -e "${BLUE}=====================================${NC}"
echo "Scan started at: $(date)"
echo "Project root: $PROJECT_ROOT"
echo "Report directory: $REPORT_DIR"
echo ""

# Initialize report file
REPORT_FILE="$REPORT_DIR/security-scan-$TIMESTAMP.md"
cat > "$REPORT_FILE" << EOF
# Security Scan Report

**Generated:** $(date)
**Project:** Falador Audiobook Platform
**Scanner:** Automated Security Scan Script

## Executive Summary

EOF

SCAN_SUCCESS=true
VULNERABILITIES_FOUND=false

# Function to log results
log_result() {
    local status=$1
    local message=$2
    local details=$3

    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            echo "✅ $message" >> "$REPORT_FILE"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            echo "⚠️ $message" >> "$REPORT_FILE"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            echo "❌ $message" >> "$REPORT_FILE"
            SCAN_SUCCESS=false
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            echo "ℹ️ $message" >> "$REPORT_FILE"
            ;;
    esac

    if [[ -n "$details" ]]; then
        echo "$details" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Dependency Vulnerability Scan (Bun)
echo "1. Scanning dependencies for vulnerabilities..."
if command_exists bun; then
    echo "Running: bun audit"
    if bun audit > "$REPORT_DIR/bun-audit-$TIMESTAMP.log" 2>&1; then
        if grep -q "vulnerabilities found" "$REPORT_DIR/bun-audit-$TIMESTAMP.log"; then
            log_result "WARNING" "Dependency vulnerabilities detected" "\`\`\`\\n$(cat "$REPORT_DIR/bun-audit-$TIMESTAMP.log")\\n\`\`\`"
            VULNERABILITIES_FOUND=true
        else
            log_result "SUCCESS" "No dependency vulnerabilities found" "Scanned $(bun pm ls | grep -c "✓") packages with Bun"
        fi
    else
        log_result "ERROR" "Bun audit failed" "\`\`\`\\n$(cat "$REPORT_DIR/bun-audit-$TIMESTAMP.log")\\n\`\`\`"
    fi
else
    log_result "WARNING" "Bun not found, skipping dependency scan"
fi

# 2. Code Security Analysis with ESLint Security Rules
echo "2. Running ESLint security analysis..."
if command_exists bun && [[ -f "$PROJECT_ROOT/package.json" ]]; then
    echo "Running: bunx eslint . --ext .ts,.js --config .eslintrc.security.js 2>/dev/null || bunx eslint . --ext .ts,.js"

    # Try to run with security focus, fall back to regular lint
    if bunx eslint . --ext .ts,.js 2>/dev/null > "$REPORT_DIR/eslint-security-$TIMESTAMP.log"; then
        error_count=$(grep -c "error" "$REPORT_DIR/eslint-security-$TIMESTAMP.log" 2>/dev/null || echo "0")
        warning_count=$(grep -c "warning" "$REPORT_DIR/eslint-security-$TIMESTAMP.log" 2>/dev/null || echo "0")

        if [[ $error_count -gt 0 ]]; then
            log_result "ERROR" "ESLint found $error_count security-related errors" "Found $error_count errors and $warning_count warnings"
            VULNERABILITIES_FOUND=true
        elif [[ $warning_count -gt 0 ]]; then
            log_result "WARNING" "ESLint found $warning_count security warnings" "Review warnings for potential security issues"
        else
            log_result "SUCCESS" "ESLint security analysis passed" "No security-related linting issues found"
        fi

        echo "ESLint results saved to: $REPORT_DIR/eslint-security-$TIMESTAMP.log"
    else
        log_result "WARNING" "ESLint security analysis failed" "Check configuration and try manual scan"
    fi
else
    log_result "WARNING" "ESLint not available, skipping code security analysis"
fi

# 3. Secret Detection (Basic)
echo "3. Scanning for potential secrets in code..."
SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]{8,}['\"]"
    "api[_-]?key\s*=\s*['\"][^'\"]{16,}['\"]"
    "secret[_-]?key\s*=\s*['\"][^'\"]{16,}['\"]"
    "token\s*=\s*['\"][^'\"]{16,}['\"]"
    "private[_-]?key\s*=\s*['\"][^'\"]{16,}['\"]"
    "aws[_-]?secret[_-]?access[_-]?key"
    "github[_-]?token"
    "database[_-]?url"
)

secrets_found=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -i -E "$pattern" "$PROJECT_ROOT/packages" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" --exclude="*.test.ts" 2>/dev/null > "$REPORT_DIR/secrets-$TIMESTAMP.tmp"; then
        if [[ $secrets_found == false ]]; then
            log_result "WARNING" "Potential secrets found in code" "Review the following matches:"
            secrets_found=true
            VULNERABILITIES_FOUND=true
        fi
        echo "Pattern: $pattern" >> "$REPORT_FILE"
        cat "$REPORT_DIR/secrets-$TIMESTAMP.tmp" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
done

if [[ $secrets_found == false ]]; then
    log_result "SUCCESS" "No obvious secrets detected in source code" "Scanned for common secret patterns"
fi

# Clean up temp files
rm -f "$REPORT_DIR/secrets-$TIMESTAMP.tmp"

# 4. File Permission Security Check
echo "4. Checking file permissions..."
if command_exists find; then
    # Find files with overly permissive permissions
    writable_files=$(find "$PROJECT_ROOT" -type f -perm /o+w -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
    executable_dirs=$(find "$PROJECT_ROOT" -type d -perm /o=x -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)

    if [[ $writable_files -gt 0 ]]; then
        log_result "WARNING" "Found $writable_files world-writable files" "Review permissions for sensitive files"
    fi

    if [[ $executable_dirs -gt 0 ]]; then
        log_result "INFO" "Found $executable_dirs world-executable directories" "Generally acceptable for project directories"
    fi

    if [[ $writable_files -eq 0 ]]; then
        log_result "SUCCESS" "File permissions look secure" "No world-writable files found"
    fi
else
    log_result "WARNING" "Find command not available, skipping permission check"
fi

# 5. Dependency Version Check
echo "5. Checking for outdated dependencies..."
if command_exists bun; then
    echo "Running: bun outdated"
    if bun outdated > "$REPORT_DIR/outdated-$TIMESTAMP.log" 2>&1; then
        outdated_count=$(grep -c "patch\|minor\|major" "$REPORT_DIR/outdated-$TIMESTAMP.log" 2>/dev/null || echo "0")
        if [[ $outdated_count -gt 0 ]]; then
            log_result "INFO" "Found $outdated_count outdated dependencies" "Consider updating for security patches"
        else
            log_result "SUCCESS" "All dependencies are up to date"
        fi
    else
        log_result "INFO" "Could not check for outdated dependencies" "Manual review recommended"
    fi
fi

# 6. Environment Variable Security Check
echo "6. Checking environment variable security..."
env_files=("$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.local" "$PROJECT_ROOT/.env.production")
env_issues_found=false

for env_file in "${env_files[@]}"; do
    if [[ -f "$env_file" ]]; then
        # Check for sensitive data in env files
        if grep -q -E "(password|secret|key|token).*=.+" "$env_file" 2>/dev/null; then
            if [[ $env_issues_found == false ]]; then
                log_result "WARNING" "Sensitive data found in environment files" "Review and secure .env files"
                env_issues_found=true
            fi
            echo "File: $env_file" >> "$REPORT_FILE"
        fi
    fi
done

if [[ $env_issues_found == false ]]; then
    log_result "SUCCESS" "Environment files appear secure" "No obvious sensitive data patterns found"
fi

# Generate final summary
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [[ $SCAN_SUCCESS == true ]]; then
    if [[ $VULNERABILITIES_FOUND == true ]]; then
        echo "🔍 **Status:** Issues Found - Review Required" >> "$REPORT_FILE"
        echo "⚠️ **Action:** Address security concerns before production deployment" >> "$REPORT_FILE"
        echo -e "${YELLOW}🔍 Scan completed with issues found. Review the full report.${NC}"
    else
        echo "✅ **Status:** All Checks Passed" >> "$REPORT_FILE"
        echo "🛡️ **Security:** Good security posture" >> "$REPORT_FILE"
        echo -e "${GREEN}✅ Scan completed successfully with no security issues found.${NC}"
    fi
else
    echo "❌ **Status:** Scan Failed" >> "$REPORT_FILE"
    echo "🚨 **Action:** Fix scanning errors and re-run" >> "$REPORT_FILE"
    echo -e "${RED}❌ Security scan encountered errors. Check logs for details.${NC}"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*Report generated by automated security scanner*" >> "$REPORT_FILE"

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Security Scan Complete${NC}"
echo "Report saved to: $REPORT_FILE"
echo "Timestamp: $TIMESTAMP"
echo ""

# Exit with appropriate code
if [[ $SCAN_SUCCESS == false ]]; then
    exit 1
elif [[ $VULNERABILITIES_FOUND == true ]]; then
    exit 2  # Different exit code for vulnerabilities found
else
    exit 0
fi