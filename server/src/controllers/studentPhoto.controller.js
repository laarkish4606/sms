import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import Student from '../models/Student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { photoBatchDir } from '../middleware/upload.middleware.js';

const UPLOAD_ROOT = path.resolve('uploads');
const STUDENTS_DIR = path.join(UPLOAD_ROOT, 'students');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// Step 1: upload a batch of photos and auto-match each by filename (sans
// extension) against a student's admission number. Nothing is committed to
// a student record yet — files sit staged under uploads/tmp/<batchId>/ until
// the admin confirms via commitBulkPhotos.
export const matchBulkPhotos = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No photos uploaded');
  const batchId = req.photoBatchId;

  const students = await Student.find({ school: req.schoolId }).select('admissionNumber firstName lastName photo').lean();
  const byAdmissionNumber = new Map(students.map((s) => [s.admissionNumber.trim().toLowerCase(), s]));

  const matched = [];
  const unmatched = [];
  const duplicates = [];
  const claimedAdmissionNumbers = new Set();

  for (const file of req.files) {
    const baseName = path.parse(file.originalname).name.trim();
    const student = byAdmissionNumber.get(baseName.toLowerCase());

    if (!student) {
      unmatched.push({ filename: file.originalname });
      continue;
    }
    if (claimedAdmissionNumbers.has(student.admissionNumber)) {
      duplicates.push({ filename: file.originalname, admissionNumber: student.admissionNumber, reason: 'Another photo in this batch already matched this student' });
      continue;
    }
    claimedAdmissionNumbers.add(student.admissionNumber);
    matched.push({
      filename: file.originalname,
      studentId: student._id,
      admissionNumber: student.admissionNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      hasExistingPhoto: Boolean(student.photo),
    });
  }

  sendSuccess(res, {
    data: {
      batchId,
      totalPhotos: req.files.length,
      matched,
      unmatched,
      duplicates,
      allStudents: students.map((s) => ({ _id: s._id, admissionNumber: s.admissionNumber, name: `${s.firstName} ${s.lastName}` })),
    },
  });
});

// Step 2: given the (possibly admin-corrected) filename -> student mapping,
// move each staged file into permanent storage and set student.photo.
export const commitBulkPhotos = asyncHandler(async (req, res) => {
  const { batchId, assignments } = req.body;
  if (!batchId) throw ApiError.badRequest('batchId is required');
  if (!Array.isArray(assignments) || !assignments.length) throw ApiError.badRequest('No assignments to commit');

  const stagingDir = photoBatchDir(batchId);
  await ensureDir(STUDENTS_DIR);

  let uploaded = 0;
  let skipped = 0;
  const failed = [];

  for (const { filename, studentId, overwrite } of assignments) {
    try {
      const student = await Student.findOne({ _id: studentId, school: req.schoolId });
      if (!student) throw new Error('Student not found');
      if (student.photo && !overwrite) {
        skipped += 1;
        continue;
      }

      const sourcePath = path.join(stagingDir, filename);
      const ext = path.extname(filename).toLowerCase();
      const destName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
      const destPath = path.join(STUDENTS_DIR, destName);

      await fs.rename(sourcePath, destPath);
      student.photo = `/uploads/students/${destName}`;
      await student.save({ validateBeforeSave: false });
      uploaded += 1;
    } catch (err) {
      failed.push({ filename, error: err.message });
    }
  }

  // Best-effort cleanup of the staging directory (including any unassigned files).
  await fs.rm(stagingDir, { recursive: true, force: true }).catch(() => {});

  sendSuccess(res, {
    message: `${uploaded} photo(s) uploaded, ${skipped} skipped, ${failed.length} failed`,
    data: { total: assignments.length, uploaded, skipped, failed },
  });
});

export default { matchBulkPhotos, commitBulkPhotos };
