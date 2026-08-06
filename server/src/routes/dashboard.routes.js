import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/admin', authorize('school_admin'), controller.getAdminDashboard);
router.get('/accountant', authorize('accountant'), controller.getAccountantDashboard);
router.get('/teacher', authorize('teacher'), controller.getTeacherDashboard);
router.get('/student', authorize('student', 'parent'), controller.getStudentDashboard);
router.get('/parent', authorize('parent'), controller.getParentDashboard);

export default router;
