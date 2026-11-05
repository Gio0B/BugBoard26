import { AuthenticationError } from '../errors/AppError.js';

export function createAuthenticationMiddleware({ authService }) {
  return function authenticate(request, _response, next) {
    const authorization = request.get('authorization');
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);

    if (!match) {
      return next(new AuthenticationError());
    }

    try {
      request.user = authService.verifyAccessToken(match[1]);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
