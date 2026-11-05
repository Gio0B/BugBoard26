import pg from 'pg';

const { Pool } = pg;

function identifyDatabase(value) {
  const parsed = new URL(value);
  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new Error('Database URL must use the PostgreSQL protocol');
  }
  return `${parsed.hostname.toLowerCase()}:${parsed.port || '5432'}${parsed.pathname}`;
}

function validateResetEnvironment() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Test database reset requires NODE_ENV=test');
  }

  if (process.env.ALLOW_TEST_DB_RESET !== 'true') {
    throw new Error('Test database reset requires ALLOW_TEST_DB_RESET=true');
  }

  if (!process.env.DATABASE_URL || !process.env.TEST_DATABASE_URL) {
    throw new Error('DATABASE_URL and TEST_DATABASE_URL are both required for the safety comparison');
  }

  if (identifyDatabase(process.env.DATABASE_URL) === identifyDatabase(process.env.TEST_DATABASE_URL)) {
    throw new Error('Refusing to reset: application and test URLs identify the same database');
  }
}

async function resetTestDatabase() {
  validateResetEnvironment();

  const database = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    application_name: 'bugboard26-test-reset',
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  const client = await database.connect();

  try {
    await client.query('BEGIN');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
    await client.query('GRANT USAGE ON SCHEMA public TO PUBLIC');
    await client.query('COMMIT');
    process.stdout.write('Test database schema reset completed.\n');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await database.end();
  }
}

try {
  await resetTestDatabase();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ level: 'fatal', message: error.message })}\n`);
  process.exit(1);
}
