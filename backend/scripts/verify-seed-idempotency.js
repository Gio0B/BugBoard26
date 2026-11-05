import { closeDatabasePool } from '../src/config/database.js';
import { runMigrations } from './migrate.js';
import { runSeed } from './seed.js';

try {
  // The reset service intentionally drops the public schema. Running migrations
  // here makes this one-shot check robust even when Compose finds an older
  // backend-test container that was already running before the reset.
  await runMigrations();
  const first = await runSeed();
  const second = await runSeed();
  const expected = { users: 2, issues: 10, comments: 6 };
  if (JSON.stringify(first) !== JSON.stringify(expected) || JSON.stringify(second) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected seed counts: ${JSON.stringify({ first, second })}`);
  }
  process.stdout.write(`${JSON.stringify({ message: 'Seed idempotency verified', counts: second })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ level: 'fatal', message: error.message })}\n`);
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
