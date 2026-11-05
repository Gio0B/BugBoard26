import { Router } from 'express';
export function createIssueRouter({ controller, commentController, authenticate, validateCreate, validateList,
  validateId, validateImageIds, validateStatus, validateCreateComment, validateCommentList, uploadImages, authorizeAdmin }) {
  const router = Router();
  router.use(authenticate);
  router.post('/', uploadImages, validateCreate, controller.create);
  router.get('/', validateList, controller.list);
  router.get('/archived', validateList, controller.listArchived);
  router.post('/:id/comments', validateId, validateCreateComment, commentController.create);
  router.get('/:id/comments', validateId, validateCommentList, commentController.list);
  router.get('/:id/images/:imageId', validateImageIds, controller.getImage);
  router.patch('/:id/status', validateStatus, controller.updateStatus);
  router.patch('/:id/archive', validateId, authorizeAdmin, controller.archive);
  router.get('/:id', validateId, controller.get);
  return router;
}
