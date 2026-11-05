import crypto from 'node:crypto';
import { User } from '../entities/User.js';
import { ConflictError } from '../errors/AppError.js';

function mapUser(row) {
  if (!row) {
    return null;
  }

  return new User({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  });
}

export class UserRepository {
  constructor({ database }) {
    this.database = database;
  }

  async findByEmail(email) {
    const result = await this.database.query(
      `
        SELECT id, email, password_hash, role, created_at
        FROM users
        WHERE email = $1
      `,
      [email],
    );
    return mapUser(result.rows[0]);
  }

  async findById(id) {
    const result = await this.database.query(
      `
        SELECT id, email, password_hash, role, created_at
        FROM users
        WHERE id = $1
      `,
      [id],
    );
    return mapUser(result.rows[0]);
  }

  async create({ email, passwordHash, role }) {
    try {
      const result = await this.database.query(
        `
          INSERT INTO users (id, email, password_hash, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, password_hash, role, created_at
        `,
        [crypto.randomUUID(), email, passwordHash, role],
      );
      return mapUser(result.rows[0]);
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictError('Esiste già un utente con questa email.');
      }
      throw error;
    }
  }
}
