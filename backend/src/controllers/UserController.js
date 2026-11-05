export class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  create = async (request, response) => {
    const user = await this.userService.createUser({
      actor: request.user,
      input: request.validated.body,
    });
    return response.status(201).json({ user });
  };
}
