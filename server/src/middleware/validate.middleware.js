import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(ApiError.badRequest('Validation failed', errors));
}

export default validate;
