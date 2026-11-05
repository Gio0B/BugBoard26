import crypto from 'node:crypto';
import { Issue } from '../entities/Issue.js';

const selectIssue = `
  SELECT i.id, i.title, i.description, i.type, i.priority, i.status,
         i.archived, i.author_id, u.email AS author_email, i.created_at, i.updated_at,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', image.id,
             'originalName', image.original_name,
             'mimeType', image.mime_type,
             'sizeBytes', image.size_bytes,
             'createdAt', image.created_at
           ) ORDER BY image.position ASC)
           FROM issue_images image
           WHERE image.issue_id = i.id
         ), '[]'::json) AS images
  FROM issues i JOIN users u ON u.id = i.author_id`;

function mapIssue(row) {
  return row ? new Issue({ id: row.id, title: row.title, description: row.description,
    type: row.type, priority: row.priority, status: row.status, archived: row.archived,
    authorId: row.author_id, authorEmail: row.author_email,
    images: row.images || [],
    createdAt: row.created_at, updatedAt: row.updated_at }) : null;
}

export class IssueRepository {
  constructor({ database }) { this.database = database; }

  async create({ title, description, type, priority, authorId, images = [] }) {
    const id = crypto.randomUUID();
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO issues (id,title,description,type,priority,status,author_id,archived)
         VALUES ($1,$2,$3,$4,$5,'TODO',$6,FALSE)`,
        [id, title, description, type, priority, authorId],
      );
      for (const [position, image] of images.entries()) {
        await client.query(
          `INSERT INTO issue_images (id,issue_id,original_name,mime_type,size_bytes,data,position)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [crypto.randomUUID(), id, image.originalName, image.mimeType, image.sizeBytes, image.data, position],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.findById(id);
  }

  async findById(id) {
    const result = await this.database.query(`${selectIssue} WHERE i.id = $1`, [id]);
    return mapIssue(result.rows[0]);
  }

  async findImage({ issueId, imageId }) {
    const result = await this.database.query(
      `SELECT id, issue_id, original_name, mime_type, size_bytes, data, created_at
       FROM issue_images WHERE issue_id = $1 AND id = $2`,
      [issueId, imageId],
    );
    const row = result.rows[0];
    return row ? {
      id: row.id,
      issueId: row.issue_id,
      originalName: row.original_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      data: row.data,
      createdAt: row.created_at,
    } : null;
  }

  async listActive({ limit = 20, offset = 0, type, status, priority, sortBy = 'createdAt', direction = 'desc' } = {}) {
    return this.listByArchiveState({ archived: false, limit, offset, type, status, priority, sortBy, direction });
  }

  async listArchived({ limit = 20, offset = 0, type, status, priority, sortBy = 'createdAt', direction = 'desc' } = {}) {
    return this.listByArchiveState({ archived: true, limit, offset, type, status, priority, sortBy, direction });
  }

  async listByArchiveState({ archived, limit, offset, type, status, priority, sortBy, direction }) {
    const values = [];
    const clauses = [`i.archived = ${archived ? 'TRUE' : 'FALSE'}`];
    for (const [column, value] of [['type', type], ['status', status], ['priority', priority]]) {
      if (value) {
        values.push(value);
        clauses.push(`i.${column} = $${values.length}`);
      }
    }
    const where = clauses.join(' AND ');
    const sortColumns = {
      createdAt: 'i.created_at',
      priority: "CASE i.priority WHEN 'CRITICAL' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 ELSE 1 END",
    };
    const order = direction === 'asc' ? 'ASC' : 'DESC';
    const pageValues = [...values, limit, offset];
    const [rows, count] = await Promise.all([
      this.database.query(
        `${selectIssue} WHERE ${where} ORDER BY ${sortColumns[sortBy]} ${order}, i.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        pageValues,
      ),
      this.database.query(`SELECT COUNT(*)::int AS count FROM issues i WHERE ${where}`, values),
    ]);
    return { items: rows.rows.map(mapIssue), total: count.rows[0].count };
  }

  async updateStatus({ id, status }) {
    const result = await this.database.query(
      'UPDATE issues SET status = $2 WHERE id = $1 AND archived = FALSE RETURNING id',
      [id, status],
    );
    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  }

  async archive(id) {
    const result = await this.database.query(
      'UPDATE issues SET archived = TRUE WHERE id = $1 AND archived = FALSE RETURNING id',
      [id],
    );
    if (!result.rows[0]) return this.findById(id);
    return this.findById(result.rows[0].id);
  }
}
