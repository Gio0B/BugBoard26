import pg from 'pg';
import { config } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: true,
  },
  application_name: 'bugboard26-backend',
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  allowExitOnIdle: false,
});

pool.on('error', (error) => {
  logger.error({ error }, 'Unexpected PostgreSQL pool error');
});

export async function verifyDatabaseConnection(database = pool) {
  const result = await database.query('SELECT 1 AS connected');
  return result.rows[0]?.connected === 1;
}

export async function closeDatabasePool() {
  await pool.end();
}
