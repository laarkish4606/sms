import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/section.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const sectionValidator = [
  body('name').trim().notEmpty().withMessage('Section name is required'),
  body('class').isMongoId().withMessage('Valid class is required'),
];

router
  .route('/')
  .get(controller.listSections)
  .post(authorize('school_admin'), sectionValidator, validate, controller.createSection);
router
  .route('/:id')
  .get(controller.getSection)
  .patch(authorize('school_admin'), controller.updateSection)
  .delete(authorize('school_admin'), controller.deleteSection);

export default router;
