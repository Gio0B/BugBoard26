export class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  login = async (request, response) => {
    const result = await this.authService.login(request.validated.body);
    return response.set('Cache-Control', 'no-store').status(200).json(result);
  };
}
