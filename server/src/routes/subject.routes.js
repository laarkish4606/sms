import { Router } from 'express';
import * as controller from '../controllers/subject.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const subjectValidator = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
];

router
  .route('/')
  .get(controller.listSubjects)
  .post(authorize('school_admin'), subjectValidator, validate, controller.createSubject);
router
  .route('/:id')
  .get(controller.getSubject)
  .patch(authorize('school_admin'), controller.updateSubject)
  .delete(authorize('school_admin'), controller.deleteSubject);

export default router;
