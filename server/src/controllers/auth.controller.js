import crypto from 'crypto';
import User from '../models/User.model.js';
import School from '../models/School.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { issueTokens, verifyRefreshToken, REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/tokens.js';
import { sendEmail } from '../config/mailer.js';
import env from '../config/env.js';

// `user.school` on the Mongoose document stays a raw ObjectId everywhere
// (req.schoolId depends on that) — this only shapes the API response, adding
// the school's name/code alongside it for display purposes (e.g. the
// dashboard welcome message).
function publicUser(user, schoolDoc) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    school: schoolDoc ? { id: schoolDoc._id, name: schoolDoc.name, code: schoolDoc.code, logo: schoolDoc.logo } : user.school,
    avatar: user.avatar,
  };
}

async function loadSchool(schoolId) {
  if (!schoolId) return null;
  return School.findById(schoolId).select('name code logo');
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const { accessToken, refreshToken } = issueTokens(user);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const schoolDoc = await loadSchool(user.school);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  sendSuccess(res, { message: 'Login successful', data: { user: publicUser(user, schoolDoc), accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer exists or is inactive');

  const { accessToken, refreshToken } = issueTokens(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  sendSuccess(res, { message: 'Token refreshed', data: { accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: 0 });
  sendSuccess(res, { message: 'Logged out' });
});

export const getMe = asyncHandler(async (req, res) => {
  const schoolDoc = await loadSchool(req.user.school);
  sendSuccess(res, { data: publicUser(req.user, schoolDoc) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid leaking which emails are registered.
  const genericMessage = 'If an account with that email exists, a reset link has been sent.';
  if (!user) return sendSuccess(res, { message: genericMessage });

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + env.resetPasswordExpiresMin * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Hello ${user.firstName},</p>
             <p>You requested a password reset. This link expires in ${env.resetPasswordExpiresMin} minutes.</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you did not request this, please ignore this email.</p>`,
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.badRequest('Could not send reset email, please try again later');
  }

  sendSuccess(res, { message: genericMessage });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendSuccess(res, { message: 'Password reset successful. You can now log in.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendSuccess(res, { message: 'Password changed successfully' });
});
