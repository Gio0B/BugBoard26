export class IssueController {
  constructor({ issueService }) { this.issueService = issueService; }
  create = async (req, res) => res.status(201).json({ issue: await this.issueService.createIssue({ actor: req.user, input: req.validated.body, images: req.issueImages }) });
  list = async (req, res) => res.json(await this.issueService.listIssues(req.validated.query));
  listArchived = async (req, res) => res.json(await this.issueService.listArchivedIssues(req.validated.query));
  get = async (req, res) => res.json({ issue: await this.issueService.getIssue(req.validated.params.id) });
  getImage = async (req, res) => {
    const image = await this.issueService.getIssueImage({
      issueId: req.validated.params.id,
      imageId: req.validated.params.imageId,
    });
    const safeName = image.originalName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    res.set({
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Content-Length': String(image.sizeBytes),
      'Content-Type': image.mimeType,
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(image.data);
  };
  updateStatus = async (req, res) => res.json({ issue: await this.issueService.updateIssueStatus({
    id: req.validated.params.id,
    status: req.validated.body.status,
  }) });
  archive = async (req, res) => res.json({ issue: await this.issueService.archiveIssue({
    id: req.validated.params.id, actor: req.user,
  }) });
}
