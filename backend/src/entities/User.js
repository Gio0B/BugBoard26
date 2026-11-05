const allowedRoles = new Set(['ADMIN', 'USER']);

export class User {
  constructor({ id, email, passwordHash, role, createdAt }) {
    if (!id || !email || !passwordHash || !allowedRoles.has(role) || !createdAt) {
      throw new TypeError('Cannot create User from incomplete data');
    }

    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);

    Object.freeze(this);
  }

  hasRole(role) {
    return this.role === role;
  }
}
