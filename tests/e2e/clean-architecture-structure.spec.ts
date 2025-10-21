import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { test, expect } from '@playwright/test';

/**
 * Clean Architecture Structure Tests
 *
 * These tests validate the Clean Architecture folder structure for Story 1.5.
 * All tests MUST fail initially (RED phase) before implementation.
 *
 * Acceptance Criteria Mapping:
 * AC1: Folder structure created: domain/, application/, infrastructure/, presentation/
 */

test.describe('1.5-ARCH-001: Clean Architecture Folder Structure', () => {
  const expectedStructure = {
    'packages/core-domain': ['src'],
    'packages/application': ['src'],
    'packages/infrastructure': ['src'],
    'packages/api-gateway': ['src'],
    'packages/cli': ['src'],
  };

  test.describe('AC1: Folder structure created', () => {
    test('should have all required Clean Architecture packages', async ({}) => {
      // GIVEN: Project root directory
      const projectRoot = process.cwd();

      // WHEN: Checking for package directories
      const missingPackages = Object.keys(expectedStructure).filter(
        (pkg) => !existsSync(join(projectRoot, pkg))
      );

      // THEN: All required packages should exist
      expect(missingPackages).toHaveLength(0);
    });

    test('should have src directories in all packages', async ({}) => {
      // GIVEN: Project root directory
      const projectRoot = process.cwd();

      // WHEN: Checking for src directories
      const packagesWithoutSrc = Object.keys(expectedStructure).filter(
        (pkg) => {
          const srcPath = join(projectRoot, pkg, 'src');
          return !existsSync(srcPath);
        }
      );

      // THEN: All packages should have src directories
      expect(packagesWithoutSrc).toHaveLength(0);
    });

    test('should have proper domain layer structure', async ({}) => {
      // GIVEN: Domain package path
      const domainPath = join(process.cwd(), 'packages/core-domain/src');

      // WHEN: Checking for domain layer directories
      const expectedDirs = ['entities', 'interfaces', 'services'];
      const missingDirs = expectedDirs.filter(
        (dir) => !existsSync(join(domainPath, dir))
      );

      // THEN: All domain directories should exist
      expect(missingDirs).toHaveLength(0);
    });

    test('should have proper application layer structure', async ({}) => {
      // GIVEN: Application package path
      const appPath = join(process.cwd(), 'packages/application/src');

      // WHEN: Checking for application layer directories
      const expectedDirs = ['use-cases', 'dto'];
      const missingDirs = expectedDirs.filter(
        (dir) => !existsSync(join(appPath, dir))
      );

      // THEN: All application directories should exist
      expect(missingDirs).toHaveLength(0);
    });

    test('should have proper infrastructure layer structure', async ({}) => {
      // GIVEN: Infrastructure package path
      const infraPath = join(process.cwd(), 'packages/infrastructure/src');

      // WHEN: Checking for infrastructure layer directories
      const expectedDirs = ['database', 'external', 'config'];
      const missingDirs = expectedDirs.filter(
        (dir) => !existsSync(join(infraPath, dir))
      );

      // THEN: All infrastructure directories should exist
      expect(missingDirs).toHaveLength(0);
    });

    test('should have proper presentation layer structure', async ({}) => {
      // GIVEN: Presentation package paths
      const apiPath = join(process.cwd(), 'packages/api-gateway/src');
      const cliPath = join(process.cwd(), 'packages/cli/src');

      // WHEN: Checking for presentation layer directories
      const apiDirs = ['routes', 'middleware', 'controllers'];
      const cliDirs = ['commands'];

      const missingApiDirs = apiDirs.filter(
        (dir) => !existsSync(join(apiPath, dir))
      );
      const missingCliDirs = cliDirs.filter(
        (dir) => !existsSync(join(cliPath, dir))
      );

      // THEN: All presentation directories should exist
      expect(missingApiDirs).toHaveLength(0);
      expect(missingCliDirs).toHaveLength(0);
    });

    test('should have package.json files for all packages', async ({}) => {
      // GIVEN: Project root directory
      const projectRoot = process.cwd();

      // WHEN: Checking for package.json files
      const packagesWithoutPackageJson = Object.keys(expectedStructure).filter(
        (pkg) => {
          const packageJsonPath = join(projectRoot, pkg, 'package.json');
          return !existsSync(packageJsonPath);
        }
      );

      // THEN: All packages should have package.json
      expect(packagesWithoutPackageJson).toHaveLength(0);
    });

    test('should have TypeScript config files', async ({}) => {
      // GIVEN: Project root directory
      const projectRoot = process.cwd();

      // WHEN: Checking for TypeScript configuration
      const hasRootTsConfig = existsSync(join(projectRoot, 'tsconfig.json'));
      const hasPackageTsConfigs = Object.keys(expectedStructure).every(
        (pkg) => {
          const pkgTsConfigPath = join(projectRoot, pkg, 'tsconfig.json');
          return existsSync(pkgTsConfigPath);
        }
      );

      // THEN: TypeScript configs should exist
      expect(hasRootTsConfig).toBe(true);
      expect(hasPackageTsConfigs).toBe(true);
    });
  });
});
