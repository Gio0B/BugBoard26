import { AppError, ServiceUnavailableError, ValidationError } from '../errors/AppError.js';

const unavailableDatabaseCodes = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '08P01',
  '57P01',
  '57P02',
  '57P03',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
]);

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new ValidationError([], 'Il corpo JSON della richiesta non è valido.');
  }

  if (unavailableDatabaseCodes.has(error?.code)) {
    return new ServiceUnavailableError(undefined, error);
  }

  return null;
}

export function errorHandler(error, request, response, _next) {
  const operationalError = normalizeError(error);

  if (!operationalError) {
    request.log.error({ error }, 'Unhandled request error');
    return response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Si è verificato un errore inatteso.',
        details: [],
        requestId: request.id,
      },
    });
  }

  if (operationalError.status >= 500) {
    request.log.error({ error: operationalError }, 'Operational server error');
  }

  return response.status(operationalError.status).json({
    error: {
      code: operationalError.code,
      message: operationalError.message,
      details: operationalError.details,
      requestId: request.id,
    },
  });
}
