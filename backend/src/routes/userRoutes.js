import { Router } from 'express';

export function createUserRouter({ userController, authenticate, authorizeAdmin, validateCreateUser }) {
  const router = Router();
  router.post('/', authenticate, authorizeAdmin, validateCreateUser, userController.create);
  return router;
}
