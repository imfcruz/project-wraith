import { defineConfig } from 'drizzle-kit';
import process from 'node:process';

const databaseUrl = process.env['DATABASE_URL'];

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/infrastructure/database/schema/index.ts',
  strict: true,
  verbose: true,
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
  migrations: {
    prefix: 'timestamp',
    schema: 'public',
    table: '__drizzle_migrations',
  },
});
