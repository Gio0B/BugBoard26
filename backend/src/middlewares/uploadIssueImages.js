import path from 'node:path';
import multer from 'multer';
import { ValidationError } from '../errors/AppError.js';

export const MAX_ISSUE_IMAGES = 5;
export const MAX_ISSUE_IMAGE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function hasPrefix(buffer, bytes, offset = 0) {
  return bytes.every((value, index) => buffer[offset + index] === value);
}

export function hasValidSignature(buffer, mimetype) {
  if (mimetype === 'image/jpeg') return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
  if (mimetype === 'image/png') return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimetype === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (mimetype === 'image/webp') {
    return hasPrefix(buffer, [0x52, 0x49, 0x46, 0x46])
      && hasPrefix(buffer, [0x57, 0x45, 0x42, 0x50], 8);
  }
  return false;
}

export function sanitizeOriginalName(value, fallbackName = 'immagine') {
  const normalized = path.basename(value || '').normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 255);
  return normalized || fallbackName;
}

function attachmentError(message) {
  return new ValidationError([{ path: ['images'], message }], message);
}

export function toIssueImage(file, fallbackName = 'immagine') {
  const originalName = sanitizeOriginalName(file.originalname, fallbackName);
  if (!hasValidSignature(file.buffer, file.mimetype)) {
    throw attachmentError(`Il contenuto di “${originalName}” non corrisponde a un’immagine valida.`);
  }
  return Object.freeze({
    originalName,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    data: file.buffer,
  });
}

const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ISSUE_IMAGE_BYTES,
    files: MAX_ISSUE_IMAGES,
    fields: 4,
    fieldSize: 64 * 1024,
    parts: MAX_ISSUE_IMAGES + 4,
  },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(attachmentError('Sono consentite soltanto immagini JPEG, PNG, WebP o GIF.'));
      return;
    }
    callback(null, true);
  },
}).array('images', MAX_ISSUE_IMAGES);

function multerError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return attachmentError('Ogni immagine può pesare al massimo 5 MB.');
  }
  if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
    return attachmentError(`È possibile allegare al massimo ${MAX_ISSUE_IMAGES} immagini.`);
  }
  return attachmentError('Gli allegati immagine non sono validi.');
}

export function uploadIssueImages(request, response, next) {
  parser(request, response, (error) => {
    if (error) {
      next(error instanceof multer.MulterError ? multerError(error) : error);
      return;
    }

    try {
      request.issueImages = (request.files || [])
        .map((file, index) => toIssueImage(file, `immagine-${index + 1}`));
      next();
    } catch (validationError) {
      next(validationError);
    }
  });
}
