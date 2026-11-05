export class CommentController {
  constructor({ commentService }) { this.commentService = commentService; }
  create = async (req, res) => res.status(201).json({ comment: await this.commentService.createComment({
    issueId: req.validated.params.id, actor: req.user, input: req.validated.body,
  }) });
  list = async (req, res) => res.json(await this.commentService.listComments({
    issueId: req.validated.params.id, limit: req.validated.query.limit,
  }));
}
