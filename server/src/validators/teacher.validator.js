import { body } from 'express-validator';

export const createTeacherValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password must be at least 8 characters with upper/lowercase and a number'),
  body('designation').optional().trim(),
  body('subjects').optional().isArray(),
  body('sections').optional().isArray(),
];

export const assignTeacherValidator = [
  body('subjects').optional().isArray(),
  body('sections').optional().isArray(),
  body('isClassTeacherOf').optional().isMongoId(),
];
