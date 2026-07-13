import { body } from 'express-validator';

export const createExamValidator = [
  body('name').trim().notEmpty().withMessage('Exam name is required'),
  body('academicYear').isMongoId().withMessage('Valid academic year is required'),
  body('class').isMongoId().withMessage('Valid class is required'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
  body('subjects.*.subject').isMongoId().withMessage('Each subject entry needs a valid subject id'),
  body('subjects.*.maxMarks').isFloat({ min: 1 }).withMessage('maxMarks must be a positive number'),
];

export const enterMarksValidator = [
  body('records').isArray({ min: 1 }).withMessage('records must be a non-empty array'),
  body('records.*.student').isMongoId().withMessage('Each record needs a valid student id'),
  body('records.*.subject').isMongoId().withMessage('Each record needs a valid subject id'),
  body('records.*.obtainedMarks').isFloat({ min: 0 }).withMessage('obtainedMarks must be a non-negative number'),
];
