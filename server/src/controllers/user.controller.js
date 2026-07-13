import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';

// Creates non-profile staff accounts (accountant, additional school_admin) for the current school.
export const createStaffUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const user = await User.create({
    school: req.schoolId,
    role,
    firstName,
    lastName,
    email,
    password,
    phone,
  });

  sendSuccess(res, { statusCode: 201, message: 'Staff account created', data: user });
});

// Lightweight directory for picking a message recipient; available to every
// authenticated role (unlike the full listUsers admin endpoint).
export const listDirectory = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId, isActive: true, _id: { $ne: req.user._id } };
  const users = await User.find(filter).select('firstName lastName role').sort('firstName').limit(500);
  sendSuccess(res, { data: users });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    User.find(filter),
    req.query,
    ['firstName', 'lastName', 'email']
  )
    .filter()
    .search()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, school: req.schoolId });
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const disallowed = ['password', 'role', 'school', 'email'];
  disallowed.forEach((key) => delete req.body[key]);

  const user = await User.findOneAndUpdate({ _id: req.params.id, school: req.schoolId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { message: 'User updated', data: user });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { isActive: Boolean(isActive) },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { message: `User ${isActive ? 'activated' : 'deactivated'}`, data: user });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarPath }, { new: true });
  sendSuccess(res, { message: 'Avatar updated', data: { avatar: user.avatar } });
});
