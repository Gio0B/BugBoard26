import { AuthorizationError, ConflictError, NotFoundError } from '../errors/AppError.js';
import { toIssueDto } from '../dto/issueDto.js';

export function toIssuePage(result, { page, limit }) {
  return {
    items: result.items.map(toIssueDto),
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
  };
}

export class IssueService {
  constructor({ issueRepository }) { this.issueRepository = issueRepository; }
  async createIssue({ actor, input, images = [] }) {
    return toIssueDto(await this.issueRepository.create({ ...input, images, authorId: actor.id }));
  }
  async getIssue(id) {
    const issue = await this.issueRepository.findById(id);
    if (!issue) throw new NotFoundError('La issue richiesta non esiste.');
    return toIssueDto(issue);
  }
  async getIssueImage({ issueId, imageId }) {
    const image = await this.issueRepository.findImage({ issueId, imageId });
    if (!image) throw new NotFoundError('L’immagine richiesta non esiste.');
    return image;
  }
  async listIssues(query) {
    const offset = (query.page - 1) * query.limit;
    const result = await this.issueRepository.listActive({ ...query, limit: query.limit, offset });
    return toIssuePage(result, query);
  }

  async listArchivedIssues(query) {
    const offset = (query.page - 1) * query.limit;
    const result = await this.issueRepository.listArchived({ ...query, limit: query.limit, offset });
    return toIssuePage(result, query);
  }

  async updateIssueStatus({ id, status }) {
    const issue = await this.issueRepository.updateStatus({ id, status });
    if (issue) return toIssueDto(issue);

    const existing = await this.issueRepository.findById(id);
    if (!existing) throw new NotFoundError('La issue richiesta non esiste.');
    throw new ConflictError('Non è possibile modificare lo stato di una issue archiviata.');
  }

  async archiveIssue({ id, actor }) {
    if (actor.role !== 'ADMIN') throw new AuthorizationError();
    const issue = await this.issueRepository.archive(id);
    if (!issue) throw new NotFoundError('La issue richiesta non esiste.');
    return toIssueDto(issue);
  }
}
