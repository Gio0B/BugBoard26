import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors/AppError.js';
import { toUserDto } from '../dto/userDto.js';

const TOKEN_ISSUER = 'bugboard26';
const TOKEN_AUDIENCE = 'bugboard26-web';
const TOKEN_ALGORITHM = 'HS256';
const DUMMY_PASSWORD_HASH = '$2b$12$ek3AgKhttWgBf8tqlwVr.ufFeV9zROR6hoFLU0qmdZWmy/YmC5m32';

export class AuthService {
  constructor({ userRepository, jwtSecret, jwtExpiresIn }) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!user || !passwordMatches) {
      throw new AuthenticationError('Email o password non corrette.');
    }

    const accessToken = jwt.sign(
      {
        role: user.role,
        email: user.email,
      },
      this.jwtSecret,
      {
        algorithm: TOKEN_ALGORITHM,
        audience: TOKEN_AUDIENCE,
        issuer: TOKEN_ISSUER,
        subject: user.id,
        expiresIn: this.jwtExpiresIn,
      },
    );

    return Object.freeze({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: toUserDto(user),
    });
  }

  verifyAccessToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: [TOKEN_ALGORITHM],
        audience: TOKEN_AUDIENCE,
        issuer: TOKEN_ISSUER,
      });

      if (
        typeof payload !== 'object'
        || typeof payload.sub !== 'string'
        || typeof payload.email !== 'string'
        || !['ADMIN', 'USER'].includes(payload.role)
      ) {
        throw new AuthenticationError();
      }

      return Object.freeze({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError();
    }
  }
}
