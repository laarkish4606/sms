import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
      error = ApiError.badRequest('Validation failed', errors);
    } else if (err.name === 'CastError') {
      error = ApiError.badRequest(`Invalid value for ${err.path}: ${err.value}`);
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      error = ApiError.conflict(`Duplicate value for field '${field}'`);
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Invalid or expired token');
    } else {
      error = new ApiError(err.statusCode || 500, err.message || 'Internal server error');
    }
  }

  if (env.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    errors: error.errors || [],
    ...(env.nodeEnv !== 'production' ? { stack: err.stack } : {}),
  });
}
