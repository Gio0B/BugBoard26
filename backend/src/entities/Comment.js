export class Comment {
  constructor({ id, issueId, authorId, authorEmail, text, createdAt }) {
    if (!id || !issueId || !authorId || !authorEmail || !text || !createdAt) {
      throw new TypeError('Cannot create Comment from incomplete data');
    }
    this.id = id;
    this.issueId = issueId;
    this.authorId = authorId;
    this.authorEmail = authorEmail;
    this.text = text;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    Object.freeze(this);
  }
}
