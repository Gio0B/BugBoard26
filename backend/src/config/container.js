import { config } from './env.js';
import { AuthController } from '../controllers/AuthController.js';
import { UserController } from '../controllers/UserController.js';
import { IssueController } from '../controllers/IssueController.js';
import { CommentController } from '../controllers/CommentController.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { IssueRepository } from '../repositories/IssueRepository.js';
import { CommentRepository } from '../repositories/CommentRepository.js';
import { AuthService } from '../services/AuthService.js';
import { UserService } from '../services/UserService.js';
import { IssueService } from '../services/IssueService.js';
import { CommentService } from '../services/CommentService.js';
import { createAuthenticationMiddleware } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { createLoginRateLimiter } from '../middlewares/loginRateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { uploadIssueImages } from '../middlewares/uploadIssueImages.js';
import { loginBodySchema } from '../validators/authValidators.js';
import { createUserBodySchema } from '../validators/userValidators.js';
import {
  createIssueBodySchema,
  issueIdParamsSchema,
  issueImageParamsSchema,
  issueListQuerySchema,
  updateIssueStatusBodySchema,
} from '../validators/issueValidators.js';
import { commentListQuerySchema, createCommentBodySchema } from '../validators/commentValidators.js';

export function createContainer({ database }) {
  const userRepository = new UserRepository({ database });
  const issueRepository = new IssueRepository({ database });
  const commentRepository = new CommentRepository({ database });
  const authService = new AuthService({
    userRepository,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
  });
  const userService = new UserService({
    userRepository,
    bcryptRounds: config.bcryptRounds,
  });
  const issueService = new IssueService({ issueRepository });
  const commentService = new CommentService({ commentRepository, issueRepository });
  const authController = new AuthController({ authService });
  const userController = new UserController({ userService });
  const issueController = new IssueController({ issueService });
  const commentController = new CommentController({ commentService });

  return Object.freeze({
    repositories: Object.freeze({ userRepository, issueRepository, commentRepository }),
    services: Object.freeze({ authService, userService, issueService, commentService }),
    controllers: Object.freeze({ authController, userController, issueController, commentController }),
    middleware: Object.freeze({
      authenticate: createAuthenticationMiddleware({ authService }),
      authorizeAdmin: authorize('ADMIN'),
      loginRateLimiter: createLoginRateLimiter(config.loginRateLimit),
      validateLogin: validate({ body: loginBodySchema }),
      validateCreateUser: validate({ body: createUserBodySchema }),
      validateCreateIssue: validate({ body: createIssueBodySchema }),
      validateIssueList: validate({ query: issueListQuerySchema }),
      validateIssueId: validate({ params: issueIdParamsSchema }),
      validateIssueImageIds: validate({ params: issueImageParamsSchema }),
      validateIssueStatus: validate({ params: issueIdParamsSchema, body: updateIssueStatusBodySchema }),
      uploadIssueImages,
      validateCreateComment: validate({ params: issueIdParamsSchema, body: createCommentBodySchema }),
      validateCommentList: validate({ params: issueIdParamsSchema, query: commentListQuerySchema }),
    }),
  });
}
