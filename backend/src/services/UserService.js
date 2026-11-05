import bcrypt from 'bcrypt';
import { AuthorizationError } from '../errors/AppError.js';
import { toUserDto } from '../dto/userDto.js';

export class UserService {
  constructor({ userRepository, bcryptRounds }) {
    this.userRepository = userRepository;
    this.bcryptRounds = bcryptRounds;
  }

  async createUser({ actor, input }) {
    if (actor?.role !== 'ADMIN') {
      throw new AuthorizationError();
    }

    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);
    const user = await this.userRepository.create({
      email,
      passwordHash,
      role: input.role,
    });

    return toUserDto(user);
  }
}
