import { ConflictError, NotFoundError } from '../errors/AppError.js';
import { toCommentDto } from '../dto/commentDto.js';

export class CommentService {
  constructor({ commentRepository, issueRepository }) {
    this.commentRepository = commentRepository;
    this.issueRepository = issueRepository;
  }

  async createComment({ issueId, actor, input }) {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) throw new NotFoundError('La issue richiesta non esiste.');
    if (issue.archived) throw new ConflictError('Non è possibile commentare una issue archiviata.');
    return toCommentDto(await this.commentRepository.create({ issueId, authorId: actor.id, text: input.text }));
  }

  async listComments({ issueId, limit }) {
    const issue = await this.issueRepository.findById(issueId);
    if (!issue) throw new NotFoundError('La issue richiesta non esiste.');
    return { items: (await this.commentRepository.listByIssue(issueId, { limit })).map(toCommentDto) };
  }
}
