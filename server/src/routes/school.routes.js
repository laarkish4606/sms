import { Router } from 'express';
import * as schoolController from '../controllers/school.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createSchoolValidator } from '../validators/school.validator.js';

const router = Router();

router.use(protect, authorize('super_admin'));

router.route('/').get(schoolController.listSchools).post(createSchoolValidator, validate, schoolController.createSchool);

router
  .route('/:id')
  .get(schoolController.getSchool)
  .patch(schoolController.updateSchool)
  .delete(schoolController.deactivateSchool);

router.patch('/:id/reactivate', schoolController.reactivateSchool);
router.delete('/:id/permanent', schoolController.deleteSchoolPermanently);

export default router;
