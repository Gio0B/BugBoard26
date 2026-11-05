import { spawn } from 'node:child_process';
import { closeDatabasePool, verifyDatabaseConnection } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { runMigrations } from './migrate.js';
import { runSeed } from './seed.js';

const command = process.argv[2];
const commandArguments = process.argv.slice(3);
let childProcess = null;
let startupInterrupted = false;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDatabase() {
  const maximumAttempts = 5;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      if (await verifyDatabaseConnection()) {
        logger.info({ attempt }, 'Database connection verified');
        return;
      }
    } catch (error) {
      logger.warn({ attempt, error }, 'Database connection attempt failed');
    }

    if (attempt < maximumAttempts) {
      await delay(2 ** (attempt - 1) * 1000);
    }
  }

  throw new Error('Database unavailable after startup retries');
}

async function forwardSignal(signal) {
  logger.info({ signal }, 'Container signal received');
  startupInterrupted = true;

  if (childProcess) {
    childProcess.kill(signal);
    return;
  }

  await closeDatabasePool().catch((error) => {
    logger.error({ error }, 'Failed to close database pool during interrupted startup');
  });
  process.exit(0);
}

process.once('SIGTERM', () => forwardSignal('SIGTERM'));
process.once('SIGINT', () => forwardSignal('SIGINT'));

async function start() {
  if (!command) {
    throw new Error('No container command was provided');
  }

  await waitForDatabase();
  await runMigrations();
  await runSeed();
  await closeDatabasePool();

  if (startupInterrupted) {
    return;
  }

  childProcess = spawn(command, commandArguments, {
    stdio: 'inherit',
    shell: false,
  });

  childProcess.once('error', (error) => {
    logger.fatal({ error, command }, 'Application process could not start');
    process.exit(1);
  });

  childProcess.once('exit', (code, signal) => {
    logger.info({ code, signal }, 'Application process exited');
    process.exit(code ?? 0);
  });
}

try {
  await start();
} catch (error) {
  logger.fatal({ error }, 'Container startup failed');
  await closeDatabasePool().catch(() => undefined);
  process.exit(1);
}
