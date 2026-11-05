export function toUserDto(user) {
  return Object.freeze({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
}
