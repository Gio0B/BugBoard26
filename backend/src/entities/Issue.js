const TYPES = new Set(['QUESTION', 'BUG', 'DOCUMENTATION', 'FEATURE']);
const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const STATUSES = new Set(['TODO', 'IN_PROGRESS', 'DONE']);

export class Issue {
  constructor({ id, title, description, type, priority, status, archived, authorId, authorEmail, images = [], createdAt, updatedAt }) {
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    if (!id || !title || !description || !authorId || !authorEmail
      || !TYPES.has(type) || !PRIORITIES.has(priority) || !STATUSES.has(status)
      || typeof archived !== 'boolean' || !Array.isArray(images)
      || Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
      throw new TypeError('Cannot create Issue from incomplete data');
    }
    this.id = id;
    this.title = title;
    this.description = description;
    this.type = type;
    this.priority = priority;
    this.status = status;
    this.archived = archived;
    this.authorId = authorId;
    this.authorEmail = authorEmail;
    this.images = Object.freeze(images.map((image) => Object.freeze({ ...image })));
    this.createdAt = created;
    this.updatedAt = updated;
    Object.freeze(this);
  }
}
