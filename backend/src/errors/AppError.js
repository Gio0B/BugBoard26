export class AppError extends Error {
  constructor({ code, message, status, details = [], cause }) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Credenziali o sessione non valide.') {
    super({
      code: 'AUTHENTICATION_REQUIRED',
      message,
      status: 401,
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Non disponi dei permessi necessari per questa operazione.') {
    super({
      code: 'FORBIDDEN',
      message,
      status: 403,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'La risorsa è in conflitto con i dati esistenti.') {
    super({
      code: 'RESOURCE_CONFLICT',
      message,
      status: 409,
    });
  }
}

export class ValidationError extends AppError {
  constructor(details = [], message = 'I dati inviati non sono validi.') {
    super({
      code: 'VALIDATION_ERROR',
      message,
      status: 400,
      details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'La risorsa richiesta non esiste.') {
    super({
      code: 'RESOURCE_NOT_FOUND',
      message,
      status: 404,
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Il servizio non è temporaneamente disponibile.', cause) {
    super({
      code: 'SERVICE_UNAVAILABLE',
      message,
      status: 503,
      cause,
    });
  }
}
