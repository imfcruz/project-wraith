import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

export interface DatabaseConfig {
  readonly poolMax: number;
  readonly url: string;
}

export interface DatabaseContext {
  readonly db: NodePgDatabase<typeof schema>;
  checkConnection(): Promise<void>;
  close(): Promise<void>;
}

export function createDatabase(config: DatabaseConfig): DatabaseContext {
  const pool = new Pool({
    connectionString: config.url,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
    max: config.poolMax,
    ssl: {
      rejectUnauthorized: false,
    }
  });
  
  const db = drizzle({ client: pool, schema });

  return {
    db,
    async checkConnection(): Promise<void> {
      await db.execute(sql`select 1`);
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}