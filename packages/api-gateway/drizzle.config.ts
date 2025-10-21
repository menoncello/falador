import type { Config } from 'drizzle-kit';

export const drizzleConfig: Config = {
  schema: './src/drizzle/schema/index.ts',
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env['DATABASE_URL'] ||
      'postgresql://falador:falador_dev@localhost:5432/falador',
  },
  verbose: true,
  strict: true,
};
