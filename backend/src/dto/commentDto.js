export function toCommentDto(comment) {
  return {
    id: comment.id,
    issueId: comment.issueId,
    author: { id: comment.authorId, email: comment.authorEmail },
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  };
}
