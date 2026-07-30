import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

const UPLOAD_ROOT = path.resolve('uploads');

const ALLOWED_MIME = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf', 'image/jpeg', 'image/png'],
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function storageFor(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(16).toString('hex');
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });
}

function fileFilterFor(kind) {
  return (req, file, cb) => {
    if (!ALLOWED_MIME[kind].includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Invalid file type. Allowed: ${ALLOWED_MIME[kind].join(', ')}`));
    }
    cb(null, true);
  };
}

export function uploadImage(subfolder) {
  return multer({
    storage: storageFor(subfolder),
    fileFilter: fileFilterFor('image'),
    limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  });
}

export function uploadDocument(subfolder) {
  return multer({
    storage: storageFor(subfolder),
    fileFilter: fileFilterFor('document'),
    limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  });
}

const SPREADSHEET_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

// In-memory — the import preview/commit flow parses the buffer directly and
// never needs the raw file to persist on disk.
export function uploadSpreadsheet() {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!SPREADSHEET_MIME.includes(file.mimetype)) {
        return cb(ApiError.badRequest('Invalid file type. Upload a .xlsx or .xls file'));
      }
      cb(null, true);
    },
    limits: { fileSize: 20 * 1024 * 1024 },
  });
}

// Bulk photo matching is a two-step flow (match, then commit) across two
// separate requests, so uploaded files are staged to disk under a per-batch
// folder rather than kept in memory, and moved into place on commit.
export function uploadPhotoBatch() {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const batchId = crypto.randomBytes(12).toString('hex');
        req.photoBatchId = req.photoBatchId || batchId;
        const dir = path.join(UPLOAD_ROOT, 'tmp', req.photoBatchId);
        ensureDir(dir);
        cb(null, dir);
      },
      filename: (req, file, cb) => cb(null, file.originalname),
    }),
    fileFilter: fileFilterFor('image'),
    limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 500 },
  });
}

export function photoBatchDir(batchId) {
  return path.join(UPLOAD_ROOT, 'tmp', batchId);
}

export default { uploadImage, uploadDocument, uploadSpreadsheet, uploadPhotoBatch, photoBatchDir };
