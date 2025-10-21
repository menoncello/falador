import { faker } from '@faker-js/faker';

/**
 * User Factory
 *
 * Factory for creating test user data using faker for randomization.
 * Supports overrides for specific test scenarios.
 */

export interface UserFactoryData {
  id?: string;
  email?: string;
  name?: string;
  password?: string;
  tier?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
  updatedAt?: string;
}

export const createUser = (
  overrides: UserFactoryData = {}
): Required<UserFactoryData> => {
  const now = new Date().toISOString();

  return {
    id: overrides.id || faker.string.uuid(),
    email: overrides.email || faker.internet.email().toLowerCase(),
    name: overrides.name || faker.person.fullName(),
    password:
      overrides.password ||
      `${faker.internet.password({ length: 12, memorable: true })}123!`,
    tier: overrides.tier || 'free',
    createdAt:
      overrides.createdAt || faker.date.recent({ days: 30 }).toISOString(),
    updatedAt: overrides.updatedAt || now,
  };
};

export const createUsers = (
  count: number,
  overrides: UserFactoryData = {}
): Array<Required<UserFactoryData>> => {
  return Array.from({ length: count }, () => createUser(overrides));
};

export const createProUser = (
  overrides: UserFactoryData = {}
): Required<UserFactoryData> => {
  return createUser({
    tier: 'pro',
    ...overrides,
  });
};

export const createEnterpriseUser = (
  overrides: UserFactoryData = {}
): Required<UserFactoryData> => {
  return createUser({
    tier: 'enterprise',
    ...overrides,
  });
};

export const createUsersWithTiers = (
  counts: { free?: number; pro?: number; enterprise?: number } = {}
): Array<Required<UserFactoryData>> => {
  const { free = 5, pro = 2, enterprise = 1 } = counts;

  return [
    ...createUsers(free, { tier: 'free' }),
    ...createUsers(pro, { tier: 'pro' }),
    ...createUsers(enterprise, { tier: 'enterprise' }),
  ];
};
