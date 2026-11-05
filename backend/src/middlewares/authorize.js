import { AuthenticationError, AuthorizationError } from '../errors/AppError.js';

export function authorize(...allowedRoles) {
  const roles = new Set(allowedRoles);

  return function authorizationMiddleware(request, _response, next) {
    if (!request.user) {
      return next(new AuthenticationError());
    }

    if (!roles.has(request.user.role)) {
      return next(new AuthorizationError());
    }

    return next();
  };
}
