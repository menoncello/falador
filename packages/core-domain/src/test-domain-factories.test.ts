/**
 * Test Domain Factories Unit Tests
 * Tests the factory functions used for creating test data
 */

import {
  createEnterpriseUser,
  createCompletedProject,
  createProjectWithLanguage,
  createMultipleProjects,
  createUserWithEmail,
  BusinessRuleTestData,
} from './test-domain-factories';
import type { User, Project } from './index';

describe('Test Domain Factories', () => {
  describe('createEnterpriseUser', () => {
    it('should create an enterprise user with default values', () => {
      const user = createEnterpriseUser();

      expect(user.tier).toBe('enterprise');
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
    });

    it('should create an enterprise user with custom overrides', () => {
      const customUser = createEnterpriseUser({
        email: 'enterprise@test.com',
        name: 'Enterprise User'
      });

      expect(customUser.tier).toBe('enterprise');
      expect(customUser.email).toBe('enterprise@test.com');
      expect(customUser.name).toBe('Enterprise User');
    });
  });

  describe('createCompletedProject', () => {
    it('should create a completed project with default values', () => {
      const project = createCompletedProject();

      expect(project.status).toBe('completed');
      expect(project.id).toBeDefined();
      expect(project.title).toBeDefined();
      expect(project.userId).toBeDefined();
    });

    it('should create a completed project with custom overrides', () => {
      const customProject = createCompletedProject({
        title: 'Completed Test Project',
        userId: 'user-123'
      });

      expect(customProject.status).toBe('completed');
      expect(customProject.title).toBe('Completed Test Project');
      expect(customProject.userId).toBe('user-123');
    });
  });

  describe('createProjectWithLanguage', () => {
    it('should create a project with specified language', () => {
      const project = createProjectWithLanguage('pt-BR');

      expect(project.language).toBe('pt-BR');
      expect(project.id).toBeDefined();
      expect(project.title).toBeDefined();
    });

    it('should create a project with language and custom overrides', () => {
      const project = createProjectWithLanguage('es-ES', {
        title: 'Spanish Project',
        status: 'in-progress'
      });

      expect(project.language).toBe('es-ES');
      expect(project.title).toBe('Spanish Project');
      expect(project.status).toBe('in-progress');
    });
  });

  describe('createMultipleProjects', () => {
    it('should create specified number of projects', () => {
      const projects = createMultipleProjects('user-123', 3);

      expect(projects).toHaveLength(3);
      projects.forEach(project => {
        expect(project.userId).toBe('user-123');
        expect(project.id).toBeDefined();
      });
    });

    it('should create projects with sequential IDs', () => {
      const projects = createMultipleProjects('user-123', 2);

      expect(projects[0].id).not.toBe(projects[1].id);
      expect(projects[0].userId).toBe(projects[1].userId);
    });
  });

  describe('createUserWithEmail', () => {
    it('should create user with specified email', () => {
      const user = createUserWithEmail('test@example.com');

      expect(user.email).toBe('test@example.com');
      expect(user.id).toBeDefined();
      expect(user.name).toBeDefined();
    });

    it('should create user with email and custom overrides', () => {
      const user = createUserWithEmail('test@example.com', {
        name: 'Test User',
        tier: 'pro'
      });

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.tier).toBe('pro');
    });
  });

  describe('BusinessRuleTestData', () => {
    describe('projectLimits', () => {
      it('should create free user for limits testing', () => {
        const freeUser = BusinessRuleTestData.projectLimits.freeUser();

        expect(freeUser.tier).toBe('free');
        expect(freeUser.id).toBeDefined();
      });

      it('should create pro user for limits testing', () => {
        const proUser = BusinessRuleTestData.projectLimits.proUser();

        expect(proUser.tier).toBe('pro');
        expect(proUser.id).toBeDefined();
      });

      it('should create enterprise user for limits testing', () => {
        const enterpriseUser = BusinessRuleTestData.projectLimits.enterpriseUser();

        expect(enterpriseUser.tier).toBe('enterprise');
        expect(enterpriseUser.id).toBeDefined();
      });

      it('should create projects at free user limit', () => {
        const projects = BusinessRuleTestData.projectLimits.projectsAtFreeLimit('user-123');

        expect(projects.length).toBeGreaterThan(0);
        projects.forEach(project => {
          expect(project.userId).toBe('user-123');
        });
      });

      it('should create projects at pro user limit', () => {
        const projects = BusinessRuleTestData.projectLimits.projectsAtProLimit('user-123');

        expect(projects.length).toBeGreaterThan(0);
        projects.forEach(project => {
          expect(project.userId).toBe('user-123');
        });
      });
    });

    describe('projectValidation', () => {
      it('should create valid project for validation testing', () => {
        const project = BusinessRuleTestData.projectValidation.validProject('user-123');

        expect(project.userId).toBe('user-123');
        expect(project.title).toBeTruthy();
        expect(project.title.length).toBeGreaterThan(0);
      });

      it('should create project without title for validation testing', () => {
        const project = BusinessRuleTestData.projectValidation.projectWithoutTitle('user-123');

        expect(project.userId).toBe('user-123');
        expect(project.title).toBe('');
      });

      it('should create project with invalid language for validation testing', () => {
        const project = BusinessRuleTestData.projectValidation.projectWithInvalidLanguage('user-123');

        expect(project.userId).toBe('user-123');
        // Should have some invalid language property
        expect(project).toBeDefined();
      });
    });
  });

  describe('Factory Function Consistency', () => {
    it('should create different objects with each call', () => {
      const user1 = createEnterpriseUser();
      const user2 = createEnterpriseUser();

      expect(user1.id).not.toBe(user2.id);
      expect(user1.tier).toBe(user2.tier);
    });

    it('should maintain type safety for all created objects', () => {
      const user = createEnterpriseUser();
      const project = createCompletedProject();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('tier');

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('status');
    });
  });
});