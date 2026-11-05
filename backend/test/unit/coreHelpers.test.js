import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  hasValidSignature,
  sanitizeOriginalName,
  toIssueImage,
} from '../../src/middlewares/uploadIssueImages.js';
import { IssueService, toIssuePage } from '../../src/services/IssueService.js';

describe('IssueService', () => {
  test('calcola la pagina e aggiorna a In corso soltanto una issue attiva', async () => {
    const issue = {
      id: '26100000-0000-4000-8000-000000000001',
      title: 'Errore di accesso', description: 'Il login non completa la sessione.',
      type: 'BUG', priority: 'HIGH', status: 'TODO', archived: false,
      authorId: '26100000-0000-4000-8000-000000000101',
      authorEmail: 'user@bugboard26.local', images: [],
      createdAt: new Date('2026-08-01T10:00:00Z'), updatedAt: new Date('2026-08-01T10:00:00Z'),
    };
    const page = toIssuePage({ items: [issue], total: 21 }, { page: 2, limit: 10 });
    assert.equal(page.page, 2);
    assert.equal(page.limit, 10);
    assert.equal(page.total, 21);
    assert.equal(page.totalPages, 3);
    assert.equal(page.items[0].id, issue.id);

    const service = new IssueService({
      issueRepository: {
        updateStatus: async ({ id, status }) => {
          assert.equal(id, issue.id);
          assert.equal(status, 'IN_PROGRESS');
          return { ...issue, status };
        },
      },
    });
    const updated = await service.updateIssueStatus({ id: issue.id, status: 'IN_PROGRESS' });
    assert.equal(updated.status, 'IN_PROGRESS');

    const archivedService = new IssueService({
      issueRepository: {
        updateStatus: async () => null,
        findById: async () => ({ ...issue, archived: true }),
      },
    });
    await assert.rejects(
      archivedService.updateIssueStatus({ id: issue.id, status: 'IN_PROGRESS' }),
      (error) => error.code === 'RESOURCE_CONFLICT' && error.status === 409,
    );
  });
});

describe('hasValidSignature(buffer, mimetype)', () => {
  test('accetta PNG e WebP validi e rifiuta MIME o firme incoerenti', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    assert.equal(hasValidSignature(png, 'image/png'), true);
    assert.equal(hasValidSignature(png, 'image/jpeg'), false);
    assert.equal(hasValidSignature(webp, 'image/webp'), true);
    assert.equal(hasValidSignature(Buffer.from('test'), 'text/plain'), false);
  });
});

describe('sanitizeOriginalName(value, fallbackName)', () => {
  test('elimina percorso e caratteri di controllo e usa il fallback se necessario', () => {
    assert.equal(sanitizeOriginalName('../prove\u0000/foto.png', 'allegato'), 'foto.png');
    assert.equal(sanitizeOriginalName('\u0000\u0007', 'allegato'), 'allegato');
  });
});

describe('toIssueImage(file, fallbackName)', () => {
  test('normalizza un allegato valido e rifiuta il contenuto incoerente', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const image = toIssueImage({ originalname: '', mimetype: 'image/png', size: buffer.length, buffer }, 'immagine-1');
    assert.deepEqual(image, {
      originalName: 'immagine-1', mimeType: 'image/png', sizeBytes: buffer.length, data: buffer,
    });
    assert.throws(
      () => toIssueImage({ originalname: 'falso.png', mimetype: 'image/png', size: 4, buffer: Buffer.from('test') }, 'immagine-2'),
      /non corrisponde a un’immagine valida/,
    );
  });
});
