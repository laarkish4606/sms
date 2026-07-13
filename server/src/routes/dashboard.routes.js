import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/admin', authorize('school_admin', 'accountant'), controller.getAdminDashboard);
router.get('/teacher', authorize('teacher'), controller.getTeacherDashboard);
router.get('/student', authorize('student', 'parent'), controller.getStudentDashboard);

export default router;
