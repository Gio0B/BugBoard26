import { rateLimit } from 'express-rate-limit';

export function createLoginRateLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler(_request, response) {
      response.status(429).json({
        error: {
          code: 'LOGIN_RATE_LIMITED',
          message: 'Troppi tentativi di accesso. Riprova più tardi.',
          details: [],
        },
      });
    },
  });
}
