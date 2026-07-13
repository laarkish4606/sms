import { body } from 'express-validator';

export const createStudentValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters with upper/lowercase and a number'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('class').isMongoId().withMessage('Valid class is required'),
  body('section').isMongoId().withMessage('Valid section is required'),
];

export const updateStudentValidator = [
  body('dob').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('class').optional().isMongoId(),
  body('section').optional().isMongoId(),
];

export const promoteStudentsValidator = [
  body('studentIds').isArray({ min: 1 }).withMessage('studentIds must be a non-empty array'),
  body('toClass').isMongoId().withMessage('Target class is required'),
  body('toSection').isMongoId().withMessage('Target section is required'),
  body('toAcademicYear').isMongoId().withMessage('Target academic year is required'),
];
