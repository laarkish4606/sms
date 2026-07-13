import { body } from 'express-validator';

export const markStudentAttendanceValidator = [
  body('class').isMongoId().withMessage('Valid class is required'),
  body('section').isMongoId().withMessage('Valid section is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('records must be a non-empty array'),
  body('records.*.student').isMongoId().withMessage('Each record needs a valid student id'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'half_day', 'excused'])
    .withMessage('Invalid attendance status'),
];

export const markTeacherAttendanceValidator = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('records must be a non-empty array'),
  body('records.*.teacher').isMongoId().withMessage('Each record needs a valid teacher id'),
  body('records.*.status')
    .isIn(['present', 'absent', 'late', 'half_day', 'on_leave'])
    .withMessage('Invalid attendance status'),
];
