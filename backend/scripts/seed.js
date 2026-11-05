import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { demoComments, demoIssues, demoUsers } from '../database/seeds/demoData.js';
import { config } from '../src/config/env.js';
import { closeDatabasePool, pool } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

const SEED_LOCK_NAMESPACE = 42626;
const SEED_LOCK_KEY = 2;

async function insertUser(client, user, email, passwordHash) {
  await client.query(
    `
      INSERT INTO users (id, email, password_hash, role, seed_key, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `,
    [user.id, email, passwordHash, user.role, user.seedKey, user.createdAt],
  );

  const result = await client.query(
    'SELECT id, email, role FROM users WHERE email = $1',
    [email],
  );

  if (result.rowCount !== 1) {
    throw new Error(`Unable to resolve demo user for role ${user.role}`);
  }

  return result.rows[0];
}

async function insertIssue(client, issue, authorId) {
  await client.query(
    `
      INSERT INTO issues (
        id, title, description, type, priority, status, author_id,
        archived, seed_key, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING
    `,
    [
      issue.id,
      issue.title,
      issue.description,
      issue.type,
      issue.priority,
      issue.status,
      authorId,
      issue.archived,
      issue.seedKey,
      issue.createdAt,
      issue.updatedAt,
    ],
  );
}

async function insertComment(client, comment, authorId, issueId) {
  await client.query(
    `
      INSERT INTO comments (id, issue_id, author_id, text, seed_key, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `,
    [comment.id, issueId, authorId, comment.text, comment.seedKey, comment.createdAt],
  );
}

async function countSeedRecords(client, table, seedKeys) {
  const allowedTables = new Set(['users', 'issues', 'comments']);
  if (!allowedTables.has(table)) {
    throw new Error('Unsupported seed table');
  }

  const result = await client.query(
    `SELECT COUNT(*)::int AS count FROM ${table} WHERE seed_key = ANY($1::varchar[])`,
    [seedKeys],
  );
  return result.rows[0].count;
}

export async function runSeed({ database = pool } = {}) {
  const client = await database.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [SEED_LOCK_NAMESPACE, SEED_LOCK_KEY]);

    const [adminPasswordHash, userPasswordHash] = await Promise.all([
      bcrypt.hash(config.demoAdminPassword, config.bcryptRounds),
      bcrypt.hash(config.demoUserPassword, config.bcryptRounds),
    ]);

    const admin = await insertUser(
      client,
      demoUsers.find((user) => user.role === 'ADMIN'),
      config.demoAdminEmail,
      adminPasswordHash,
    );
    const user = await insertUser(
      client,
      demoUsers.find((entry) => entry.role === 'USER'),
      config.demoUserEmail,
      userPasswordHash,
    );
    const authors = { admin: admin.id, user: user.id };

    for (const issue of demoIssues) {
      await insertIssue(client, issue, authors[issue.author]);
    }

    const issueRows = await client.query(
      'SELECT id, seed_key FROM issues WHERE seed_key = ANY($1::varchar[])',
      [demoIssues.map((issue) => issue.seedKey)],
    );
    const issueIds = new Map(issueRows.rows.map((issue) => [issue.seed_key, issue.id]));

    for (const comment of demoComments) {
      const issueId = issueIds.get(comment.issueSeedKey);
      if (!issueId) {
        throw new Error(`Demo issue missing for comment ${comment.seedKey}`);
      }
      await insertComment(client, comment, authors[comment.author], issueId);
    }

    const counts = {
      users: await countSeedRecords(client, 'users', demoUsers.map((entry) => entry.seedKey)),
      issues: await countSeedRecords(client, 'issues', demoIssues.map((entry) => entry.seedKey)),
      comments: await countSeedRecords(client, 'comments', demoComments.map((entry) => entry.seedKey)),
    };

    if (counts.users !== 2 || counts.issues !== 10 || counts.comments !== demoComments.length) {
      throw new Error('Demo seed verification failed');
    }

    await client.query('COMMIT');
    logger.info(counts, 'Demo seed complete');
    return counts;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runFromCommandLine() {
  try {
    await runSeed();
  } catch (error) {
    logger.fatal({ error }, 'Demo seed failed');
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  await runFromCommandLine();
}
