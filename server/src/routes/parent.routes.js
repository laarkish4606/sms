import { Router } from 'express';
import * as parentController from '../controllers/parent.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createParentValidator, linkChildValidator } from '../validators/parent.validator.js';

const router = Router();

router.use(protect);

router.get('/me/children', authorize('parent'), parentController.getMyChildren);

router
  .route('/')
  .get(authorize('school_admin'), parentController.listParents)
  .post(authorize('school_admin'), createParentValidator, validate, parentController.createParent);

router
  .route('/:id')
  .get(authorize('school_admin', 'parent'), parentController.getParent)
  .patch(authorize('school_admin'), parentController.updateParent)
  .delete(authorize('school_admin'), parentController.deleteParent);

router.post('/:id/children', authorize('school_admin'), linkChildValidator, validate, parentController.linkChild);
router.delete('/:id/children/:studentId', authorize('school_admin'), parentController.unlinkChild);

router.get(
  '/children/:studentId/attendance',
  authorize('parent', 'school_admin'),
  parentController.getChildAttendance
);
router.get('/children/:studentId/grades', authorize('parent', 'school_admin'), parentController.getChildGrades);
router.get('/children/:studentId/fees', authorize('parent', 'school_admin'), parentController.getChildFeeStatus);

export default router;
