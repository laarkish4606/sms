import School from '../models/School.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';

export const getSettings = asyncHandler(async (req, res) => {
  const school = await School.findById(req.schoolId).populate('currentAcademicYear', 'name terms');
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { data: school });
});

export const updateSchoolInfo = asyncHandler(async (req, res) => {
  const disallowed = ['code', 'settings', 'currentAcademicYear', 'isActive'];
  disallowed.forEach((key) => delete req.body[key]);

  const school = await School.findByIdAndUpdate(req.schoolId, req.body, { new: true, runValidators: true });
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { message: 'School information updated', data: school });
});

export const updateSystemConfig = asyncHandler(async (req, res) => {
  const { currency, timezone, dateFormat, gradingScale } = req.body;

  const school = await School.findByIdAndUpdate(
    req.schoolId,
    {
      $set: {
        ...(currency && { 'settings.currency': currency }),
        ...(timezone && { 'settings.timezone': timezone }),
        ...(dateFormat && { 'settings.dateFormat': dateFormat }),
        ...(gradingScale && { 'settings.gradingScale': gradingScale }),
      },
    },
    { new: true, runValidators: true }
  );
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { message: 'System configuration updated', data: school.settings });
});

export const uploadSchoolLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const logoPath = `/uploads/schools/${req.file.filename}`;
  const school = await School.findByIdAndUpdate(req.schoolId, { logo: logoPath }, { new: true });
  sendSuccess(res, { message: 'Logo updated', data: { logo: school.logo } });
});
