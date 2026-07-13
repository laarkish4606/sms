import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/timetable.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const timetableValidator = [
  body('class').isMongoId().withMessage('Valid class is required'),
  body('section').isMongoId().withMessage('Valid section is required'),
  body('academicYear').isMongoId().withMessage('Valid academic year is required'),
  body('periods').isArray().withMessage('periods must be an array'),
];

router.get('/section/:sectionId', controller.getTimetableForSection);
router.get('/teacher/:teacherId', controller.getTeacherTimetable);
router.put('/', authorize('school_admin'), timetableValidator, validate, controller.upsertTimetable);

export default router;
