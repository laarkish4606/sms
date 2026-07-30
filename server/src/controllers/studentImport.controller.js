import mongoose from 'mongoose';
import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import Section from '../models/Section.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { generateStudentId } from '../services/idGenerator.service.js';
import { generatePassword } from '../utils/password.js';
import { buildImportTemplate, parseAndValidateImport } from '../services/studentImport.service.js';

export const downloadImportTemplate = asyncHandler(async (req, res) => {
  const workbook = await buildImportTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="student-import-template.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

const MAX_IMPORT_ROWS = 2000;

export const previewImport = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const { academicYear } = req.body;
  if (!academicYear) throw ApiError.badRequest('academicYear is required');

  let result;
  try {
    result = await parseAndValidateImport(req.file.buffer, { schoolId: req.schoolId, academicYearId: academicYear });
  } catch (err) {
    throw ApiError.badRequest(`Could not read the file: ${err.message}`);
  }

  if (result.rows.length > MAX_IMPORT_ROWS) {
    throw ApiError.badRequest(
      `This file has ${result.rows.length} rows — please split imports into batches of ${MAX_IMPORT_ROWS} or fewer`
    );
  }

  sendSuccess(res, { data: result });
});

export const commitImport = asyncHandler(async (req, res) => {
  const { academicYear, rows } = req.body;
  if (!academicYear) throw ApiError.badRequest('academicYear is required');
  if (!Array.isArray(rows) || !rows.length) throw ApiError.badRequest('No rows to import');
  if (rows.length > MAX_IMPORT_ROWS) throw ApiError.badRequest(`Cannot import more than ${MAX_IMPORT_ROWS} rows at once`);

  const results = { created: [], updated: [], failed: [] };

  for (const row of rows) {
    // Never trust client-reported status for anything but which action to
    // attempt — real validation (class/section existence, email uniqueness)
    // happens again per-row below via the normal create/update paths.
    if (row.status !== 'new' && row.status !== 'update') continue;

    try {
      const section = await Section.findOne({
        _id: row.resolvedSectionId,
        class: row.resolvedClassId,
        school: req.schoolId,
      });
      if (!section) throw new Error('Class/section is no longer valid');

      if (row.status === 'update') {
        const student = await Student.findOne({ admissionNumber: row.data.admissionNumber, school: req.schoolId });
        if (!student) throw new Error('Student not found for update');

        const updateFields = {
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          dob: row.data.dob,
          gender: row.data.gender,
          class: row.resolvedClassId,
          section: row.resolvedSectionId,
          rollNumber: row.data.rollNumber || undefined,
          phone: row.data.phone || undefined,
          bloodGroup: row.data.bloodGroup || undefined,
          religion: row.data.religion || undefined,
          nationality: row.data.nationality || undefined,
          address: row.data.address || undefined,
        };
        Object.keys(updateFields).forEach((k) => updateFields[k] === undefined && delete updateFields[k]);

        await Student.updateOne({ _id: student._id }, updateFields, { runValidators: true });
        if (row.data.firstName || row.data.lastName) {
          await User.findByIdAndUpdate(student.user, { firstName: row.data.firstName, lastName: row.data.lastName });
        }
        results.updated.push({ rowNumber: row.rowNumber, admissionNumber: student.admissionNumber });
      } else {
        const admissionNumber = row.data.admissionNumber || (await generateStudentId(req.schoolId));
        const password = generatePassword();
        const guardians = row.data.guardianName
          ? [
              {
                name: row.data.guardianName,
                relation: row.data.guardianRelation || undefined,
                phone: row.data.guardianPhone || undefined,
                email: row.data.guardianEmail || undefined,
              },
            ]
          : [];

        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            const [user] = await User.create(
              [
                {
                  school: req.schoolId,
                  role: 'student',
                  firstName: row.data.firstName,
                  lastName: row.data.lastName,
                  email: row.data.email,
                  password,
                  phone: row.data.phone || undefined,
                },
              ],
              { session }
            );

            await Student.create(
              [
                {
                  school: req.schoolId,
                  user: user._id,
                  firstName: row.data.firstName,
                  lastName: row.data.lastName,
                  email: row.data.email,
                  admissionNumber,
                  class: row.resolvedClassId,
                  section: row.resolvedSectionId,
                  rollNumber: row.data.rollNumber || undefined,
                  dob: row.data.dob,
                  gender: row.data.gender,
                  bloodGroup: row.data.bloodGroup || undefined,
                  religion: row.data.religion || undefined,
                  nationality: row.data.nationality || undefined,
                  address: row.data.address || undefined,
                  guardians,
                },
              ],
              { session }
            );
          });
        } finally {
          session.endSession();
        }

        results.created.push({ rowNumber: row.rowNumber, admissionNumber, email: row.data.email, password });
      }
    } catch (err) {
      results.failed.push({ rowNumber: row.rowNumber, error: err.message });
    }
  }

  sendSuccess(res, {
    message: `Import complete — ${results.created.length} created, ${results.updated.length} updated, ${results.failed.length} failed`,
    data: {
      summary: {
        created: results.created.length,
        updated: results.updated.length,
        failed: results.failed.length,
      },
      results,
    },
  });
});

export default { downloadImportTemplate, previewImport, commitImport };
