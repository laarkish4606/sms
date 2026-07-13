import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/class.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const classValidator = [
  body('name').trim().notEmpty().withMessage('Class name is required'),
  body('academicYear').isMongoId().withMessage('Valid academic year is required'),
  body('numericOrder').isInt({ min: 0 }).withMessage('numericOrder must be a non-negative integer'),
];

const assignValidator = [
  body('subject').isMongoId().withMessage('Valid subject is required'),
  body('teacher').isMongoId().withMessage('Valid teacher is required'),
];

router
  .route('/')
  .get(controller.listClasses)
  .post(authorize('school_admin'), classValidator, validate, controller.createClass);
router
  .route('/:id')
  .get(controller.getClass)
  .patch(authorize('school_admin'), controller.updateClass)
  .delete(authorize('school_admin'), controller.deleteClass);
router.patch('/:id/assign-subject', authorize('school_admin'), assignValidator, validate, controller.assignSubjectTeacher);

export default router;
