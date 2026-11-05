import { Router } from 'express';

export function createAuthRouter({ authController, loginRateLimiter, validateLogin }) {
  const router = Router();
  router.post('/login', loginRateLimiter, validateLogin, authController.login);
  return router;
}
