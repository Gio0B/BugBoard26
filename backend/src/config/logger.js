import pino from 'pino';
import { config } from './env.js';

export const logger = pino({
  level: config.logLevel,
  base: {
    service: 'bugboard26-backend',
    environment: config.nodeEnv,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'databaseUrl',
      'DATABASE_URL',
      'JWT_SECRET',
      'err.config.connectionString',
      'error.config.connectionString',
    ],
    censor: '[REDACTED]',
  },
});
