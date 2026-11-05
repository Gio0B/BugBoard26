import { ValidationError } from '../errors/AppError.js';

function mapValidationIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

export function validate(schemas) {
  return async function validationMiddleware(request, _response, next) {
    try {
      const validated = {};

      for (const location of ['params', 'query', 'body']) {
        const schema = schemas[location];
        if (!schema) {
          continue;
        }

        const result = await schema.safeParseAsync(request[location]);
        if (!result.success) {
          return next(new ValidationError(mapValidationIssues(result.error.issues)));
        }
        validated[location] = result.data;
      }

      request.validated = Object.freeze(validated);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
