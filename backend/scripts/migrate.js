import crypto from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDatabasePool, pool } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

const MIGRATION_LOCK_NAMESPACE = 42626;
const MIGRATION_LOCK_KEY = 1;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(currentDirectory, '../database/migrations');

function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function loadMigrations() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && /^\d{3}_[a-z0-9_]+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (fileNames.length === 0) {
    throw new Error('No SQL migrations were found');
  }

  return Promise.all(
    fileNames.map(async (fileName) => {
      const content = await readFile(path.join(migrationsDirectory, fileName), 'utf8');
      return {
        version: fileName,
        checksum: calculateChecksum(content),
        content,
      };
    }),
  );
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function findAppliedMigration(client, version) {
  const result = await client.query(
    'SELECT version, checksum FROM schema_migrations WHERE version = $1',
    [version],
  );
  return result.rows[0] || null;
}

async function applyMigration(client, migration) {
  const applied = await findAppliedMigration(client, migration.version);

  if (applied) {
    if (applied.checksum.trim() !== migration.checksum) {
      throw new Error(`Checksum mismatch for applied migration ${migration.version}`);
    }
    logger.info({ migration: migration.version }, 'Migration already applied');
    return false;
  }

  await client.query(migration.content);
  await client.query(
    'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
    [migration.version, migration.checksum],
  );
  logger.info({ migration: migration.version }, 'Migration applied');
  return true;
}

export async function runMigrations({ database = pool } = {}) {
  const migrations = await loadMigrations();
  const client = await database.connect();
  let appliedCount = 0;

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [MIGRATION_LOCK_NAMESPACE, MIGRATION_LOCK_KEY]);
    await ensureMigrationTable(client);

    for (const migration of migrations) {
      if (await applyMigration(client, migration)) {
        appliedCount += 1;
      }
    }

    await client.query('COMMIT');
    logger.info({ appliedCount, migrationCount: migrations.length }, 'Database migrations complete');
    return { appliedCount, migrationCount: migrations.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runFromCommandLine() {
  try {
    await runMigrations();
  } catch (error) {
    logger.fatal({ error }, 'Database migration failed');
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  await runFromCommandLine();
}
