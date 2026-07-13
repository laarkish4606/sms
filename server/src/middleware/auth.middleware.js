import { verifyAccessToken } from '../utils/tokens.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.model.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) throw ApiError.unauthorized('Authentication token missing');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer exists or is inactive');

  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password changed recently, please log in again');
  }

  req.user = user;
  req.schoolId = user.role === 'super_admin' ? req.headers['x-school-id'] || user.school : user.school;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`));
  }
  next();
};
