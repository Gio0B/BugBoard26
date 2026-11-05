import crypto from 'node:crypto';
import { Comment } from '../entities/Comment.js';

const selectComment = `
  SELECT c.id, c.issue_id, c.author_id, u.email AS author_email, c.text, c.created_at
  FROM comments c JOIN users u ON u.id = c.author_id`;

function mapComment(row) {
  return row ? new Comment({
    id: row.id, issueId: row.issue_id, authorId: row.author_id,
    authorEmail: row.author_email, text: row.text, createdAt: row.created_at,
  }) : null;
}

export class CommentRepository {
  constructor({ database }) { this.database = database; }

  async create({ issueId, authorId, text }) {
    const id = crypto.randomUUID();
    await this.database.query(
      'INSERT INTO comments (id, issue_id, author_id, text) VALUES ($1,$2,$3,$4)',
      [id, issueId, authorId, text],
    );
    const result = await this.database.query(`${selectComment} WHERE c.id = $1`, [id]);
    return mapComment(result.rows[0]);
  }

  async listByIssue(issueId, { limit = 100 } = {}) {
    const result = await this.database.query(
      `${selectComment} WHERE c.issue_id = $1 ORDER BY c.created_at ASC, c.id ASC LIMIT $2`,
      [issueId, limit],
    );
    return result.rows.map(mapComment);
  }
}
