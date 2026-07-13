import mongoose from 'mongoose';
import School from '../models/School.model.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';

// Only super_admin reaches these controllers (enforced in routes).

export const createSchool = asyncHandler(async (req, res) => {
  const { name, code, email, phone, address, website, adminFirstName, adminLastName, adminEmail, adminPassword } =
    req.body;

  const existing = await School.findOne({ code: code.toUpperCase() });
  if (existing) throw ApiError.conflict('A school with this code already exists');

  const emailTaken = await User.findOne({ email: adminEmail.toLowerCase() });
  if (emailTaken) throw ApiError.conflict('This admin email is already in use');

  const session = await mongoose.startSession();
  let school;
  try {
    await session.withTransaction(async () => {
      const [createdSchool] = await School.create([{ name, code, email, phone, address, website }], { session });
      school = createdSchool;
      await User.create(
        [
          {
            school: school._id,
            role: 'school_admin',
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail,
            password: adminPassword,
          },
        ],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { statusCode: 201, message: 'School and admin account created', data: school });
});

export const listSchools = asyncHandler(async (req, res) => {
  const { data, meta } = await new ApiFeatures(School.find(), req.query, ['name', 'code', 'email'])
    .filter()
    .search()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { data: school });
});

export const updateSchool = asyncHandler(async (req, res) => {
  const disallowed = ['code'];
  disallowed.forEach((key) => delete req.body[key]);

  const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { message: 'School updated', data: school });
});

export const deactivateSchool = asyncHandler(async (req, res) => {
  const school = await School.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!school) throw ApiError.notFound('School not found');
  await User.updateMany({ school: school._id }, { isActive: false });
  sendSuccess(res, { message: 'School deactivated', data: school });
});
