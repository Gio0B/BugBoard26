export function toIssueDto(issue) {
  return {
    id: issue.id, title: issue.title, description: issue.description,
    type: issue.type, priority: issue.priority, status: issue.status,
    archived: issue.archived,
    author: { id: issue.authorId, email: issue.authorEmail },
    images: issue.images.map((image) => ({
      id: image.id,
      originalName: image.originalName,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      createdAt: new Date(image.createdAt).toISOString(),
    })),
    createdAt: issue.createdAt.toISOString(), updatedAt: issue.updatedAt.toISOString(),
  };
}
