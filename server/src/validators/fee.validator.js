import { body } from 'express-validator';

export const feeStructureValidator = [
  body('academicYear').isMongoId().withMessage('Valid academic year is required'),
  body('class').isMongoId().withMessage('Valid class is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one fee item is required'),
  body('items.*.name').trim().notEmpty().withMessage('Fee item name is required'),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Fee item amount must be non-negative'),
];

export const generateInvoicesValidator = [
  body('class').isMongoId().withMessage('Valid class is required'),
  body('academicYear').isMongoId().withMessage('Valid academic year is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
];

export const recordPaymentValidator = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('method').isIn(['cash', 'card', 'bank_transfer', 'online', 'cheque']).withMessage('Invalid payment method'),
];
