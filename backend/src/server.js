import { createApp } from './app.js';
import { config } from './config/env.js';
import { closeDatabasePool } from './config/database.js';
import { logger } from './config/logger.js';

const app = createApp();
const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info({ port: config.port }, 'BugBoard26 backend listening');
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown started');

  const forcedExit = setTimeout(() => {
    logger.fatal('Graceful shutdown timed out');
    process.exit(1);
  }, 10000);
  forcedExit.unref();

  server.close(async (serverError) => {
    try {
      await closeDatabasePool();
      clearTimeout(forcedExit);
      if (serverError) {
        logger.error({ error: serverError }, 'HTTP server close failed');
        process.exit(1);
      }
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Database pool close failed');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (error) => {
  logger.fatal({ error }, 'Unhandled promise rejection');
  void shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  void shutdown('uncaughtException');
});
