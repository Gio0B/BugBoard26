import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './config/database.js';
import { createContainer } from './config/container.js';
import { HealthController } from './controllers/HealthController.js';
import { AuthorizationError, NotFoundError } from './errors/AppError.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createHealthRouter } from './routes/healthRoutes.js';
import { createUserRouter } from './routes/userRoutes.js';
import { createIssueRouter } from './routes/issueRoutes.js';

function isAllowedOrigin(origin) {
  return !origin || config.corsOrigins.includes(origin);
}

export function createApp({ database = pool } = {}) {
  const app = express();
  const container = createContainer({ database });
  const healthController = new HealthController({ database });

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      genReqId(request, response) {
        const requestId = request.headers['x-request-id'] || crypto.randomUUID();
        response.setHeader('x-request-id', requestId);
        return requestId;
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new AuthorizationError());
      },
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '64kb' }));

  app.use('/api/health', createHealthRouter({ healthController }));
  app.use(
    '/api/auth',
    createAuthRouter({
      authController: container.controllers.authController,
      loginRateLimiter: container.middleware.loginRateLimiter,
      validateLogin: container.middleware.validateLogin,
    }),
  );
  app.use(
    '/api/users',
    createUserRouter({
      userController: container.controllers.userController,
      authenticate: container.middleware.authenticate,
      authorizeAdmin: container.middleware.authorizeAdmin,
      validateCreateUser: container.middleware.validateCreateUser,
    }),
  );
  app.use('/api/issues', createIssueRouter({
    controller: container.controllers.issueController,
    commentController: container.controllers.commentController,
    authenticate: container.middleware.authenticate,
    validateCreate: container.middleware.validateCreateIssue,
    validateList: container.middleware.validateIssueList,
    validateId: container.middleware.validateIssueId,
    validateImageIds: container.middleware.validateIssueImageIds,
    validateStatus: container.middleware.validateIssueStatus,
    uploadImages: container.middleware.uploadIssueImages,
    validateCreateComment: container.middleware.validateCreateComment,
    validateCommentList: container.middleware.validateCommentList,
    authorizeAdmin: container.middleware.authorizeAdmin,
  }));

  app.use((_request, _response, next) => {
    next(new NotFoundError('L’endpoint richiesto non esiste.'));
  });

  app.use(errorHandler);

  return app;
}
