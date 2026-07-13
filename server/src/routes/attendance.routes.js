import { Router } from 'express';
import * as controller from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { markStudentAttendanceValidator, markTeacherAttendanceValidator } from '../validators/attendance.validator.js';

const router = Router();
router.use(protect);

router.post(
  '/students',
  authorize('school_admin', 'teacher'),
  markStudentAttendanceValidator,
  validate,
  controller.markStudentAttendance
);
router.get('/students', authorize('school_admin', 'teacher', 'student', 'parent'), controller.listStudentAttendance);
router.get('/students/report', authorize('school_admin', 'teacher'), controller.studentAttendanceReport);

router.post(
  '/teachers',
  authorize('school_admin'),
  markTeacherAttendanceValidator,
  validate,
  controller.markTeacherAttendance
);
router.get('/teachers', authorize('school_admin'), controller.listTeacherAttendance);

export default router;
