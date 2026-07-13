import { body } from 'express-validator';

export const createSchoolValidator = [
  body('name').trim().notEmpty().withMessage('School name is required'),
  body('code').trim().notEmpty().withMessage('School code is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('adminFirstName').trim().notEmpty().withMessage('Admin first name is required'),
  body('adminLastName').trim().notEmpty().withMessage('Admin last name is required'),
  body('adminEmail').isEmail().withMessage('Valid admin email is required'),
  body('adminPassword')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Admin password must be at least 8 characters with upper/lowercase and a number'),
];
