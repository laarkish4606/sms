import { Router } from 'express';
import * as controller from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();
router.use(protect, authorize('school_admin'));

router.get('/', controller.getSettings);
router.patch('/school-info', controller.updateSchoolInfo);
router.patch('/system-config', controller.updateSystemConfig);
router.post('/logo', uploadImage('schools').single('logo'), controller.uploadSchoolLogo);

export default router;
