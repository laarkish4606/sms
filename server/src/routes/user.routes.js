import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createStaffUserValidator } from '../validators/user.validator.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router.post('/me/avatar', uploadImage('avatars').single('avatar'), userController.uploadAvatar);
router.get('/directory', userController.listDirectory);

router.use(authorize('school_admin'));

router.route('/').get(userController.listUsers).post(createStaffUserValidator, validate, userController.createStaffUser);

router.route('/:id').get(userController.getUser).patch(userController.updateUser);
router.patch('/:id/status', userController.setUserActive);

export default router;
