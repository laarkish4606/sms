import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createStudentValidator, updateStudentValidator, promoteStudentsValidator } from '../validators/student.validator.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(authorize('school_admin', 'teacher', 'accountant'), studentController.listStudents)
  .post(authorize('school_admin'), createStudentValidator, validate, studentController.createStudent);

router.post('/promote', authorize('school_admin'), promoteStudentsValidator, validate, studentController.promoteStudents);

router.get('/me', authorize('student'), studentController.getMyStudentProfile);

router
  .route('/:id')
  .get(authorize('school_admin', 'teacher', 'accountant', 'student', 'parent'), studentController.getStudent)
  .patch(authorize('school_admin'), updateStudentValidator, validate, studentController.updateStudent)
  .delete(authorize('school_admin'), studentController.deleteStudent);

router.post(
  '/:id/photo',
  authorize('school_admin'),
  uploadImage('students').single('photo'),
  studentController.uploadStudentPhoto
);

export default router;
