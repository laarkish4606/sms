import { Router } from 'express';
import * as controller from '../controllers/academicYear.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.route('/').get(controller.listAcademicYears).post(authorize('school_admin'), controller.createAcademicYear);
router
  .route('/:id')
  .get(controller.getAcademicYear)
  .patch(authorize('school_admin'), controller.updateAcademicYear)
  .delete(authorize('school_admin'), controller.deleteAcademicYear);
router.patch('/:id/set-current', authorize('school_admin'), controller.setCurrentAcademicYear);

export default router;
