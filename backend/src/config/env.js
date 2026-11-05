import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), {
        message: 'DATABASE_URL must use the PostgreSQL protocol',
      }),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
    JWT_EXPIRES_IN: z.string().min(1).default('1h'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:8080'),
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(10),
    LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900000),
    DEMO_ADMIN_EMAIL: z.email().default('admin@bugboard26.local'),
    DEMO_ADMIN_PASSWORD: z.string().min(12, 'DEMO_ADMIN_PASSWORD must contain at least 12 characters'),
    DEMO_USER_EMAIL: z.email().default('user@bugboard26.local'),
    DEMO_USER_PASSWORD: z.string().min(12, 'DEMO_USER_PASSWORD must contain at least 12 characters'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
    DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10000),
    DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10000),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== 'production') {
      return;
    }

    for (const field of ['JWT_SECRET', 'DEMO_ADMIN_PASSWORD', 'DEMO_USER_PASSWORD']) {
      if (values[field].toLowerCase().startsWith('replace-with')) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: `${field} must not use the example placeholder in production`,
        });
      }
    }
  });

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  process.stderr.write(`${JSON.stringify({ level: 'fatal', message: 'Invalid environment configuration', issues })}\n`);
  process.exitCode = 1;
  throw new Error('Invalid environment configuration');
}

const values = result.data;

export const config = Object.freeze({
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  databaseUrl: values.DATABASE_URL,
  jwtSecret: values.JWT_SECRET,
  jwtExpiresIn: values.JWT_EXPIRES_IN,
  bcryptRounds: values.BCRYPT_ROUNDS,
  corsOrigins: values.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  loginRateLimit: Object.freeze({
    limit: values.LOGIN_RATE_LIMIT_MAX,
    windowMs: values.LOGIN_RATE_LIMIT_WINDOW_MS,
  }),
  demoAdminEmail: values.DEMO_ADMIN_EMAIL.toLowerCase(),
  demoAdminPassword: values.DEMO_ADMIN_PASSWORD,
  demoUserEmail: values.DEMO_USER_EMAIL.toLowerCase(),
  demoUserPassword: values.DEMO_USER_PASSWORD,
  logLevel: values.LOG_LEVEL,
  database: Object.freeze({
    max: values.DB_POOL_MAX,
    idleTimeoutMillis: values.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: values.DB_CONNECTION_TIMEOUT_MS,
  }),
});
