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

export default { uploadImage, uploadDocument };
