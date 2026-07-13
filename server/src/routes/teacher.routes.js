import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createTeacherValidator, assignTeacherValidator } from '../validators/teacher.validator.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(authorize('school_admin', 'accountant'), teacherController.listTeachers)
  .post(authorize('school_admin'), createTeacherValidator, validate, teacherController.createTeacher);

router
  .route('/:id')
  .get(authorize('school_admin', 'teacher', 'accountant'), teacherController.getTeacher)
  .patch(authorize('school_admin'), teacherController.updateTeacher)
  .delete(authorize('school_admin'), teacherController.deleteTeacher);

router.post(
  '/:id/photo',
  authorize('school_admin'),
  uploadImage('teachers').single('photo'),
  teacherController.uploadTeacherPhoto
);

router.patch(
  '/:id/assign',
  authorize('school_admin'),
  assignTeacherValidator,
  validate,
  teacherController.assignTeacher
);

router.get('/:id/attendance-summary', authorize('school_admin', 'teacher'), teacherController.getTeacherAttendanceSummary);

export default router;
