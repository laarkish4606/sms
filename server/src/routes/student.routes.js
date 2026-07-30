import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import * as importController from '../controllers/studentImport.controller.js';
import * as photoController from '../controllers/studentPhoto.controller.js';
import * as promotionController from '../controllers/studentPromotion.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createStudentValidator, updateStudentValidator, promoteStudentsValidator } from '../validators/student.validator.js';
import { uploadImage, uploadSpreadsheet, uploadPhotoBatch } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(authorize('school_admin', 'teacher', 'accountant'), studentController.listStudents)
  .post(authorize('school_admin'), createStudentValidator, validate, studentController.createStudent);

router.get('/export/excel', authorize('school_admin', 'teacher', 'accountant'), studentController.exportStudents);

router.get('/import/template', authorize('school_admin'), importController.downloadImportTemplate);
router.post(
  '/import/preview',
  authorize('school_admin'),
  uploadSpreadsheet().single('file'),
  importController.previewImport
);
router.post('/import/commit', authorize('school_admin'), importController.commitImport);

router.post(
  '/photos/bulk/match',
  authorize('school_admin'),
  uploadPhotoBatch().array('photos'),
  photoController.matchBulkPhotos
);
router.post('/photos/bulk/commit', authorize('school_admin'), photoController.commitBulkPhotos);

router.get('/promotion/preview', authorize('school_admin'), promotionController.getPromotionPreview);
router.post('/promotion/commit', authorize('school_admin'), promotionController.commitPromotion);

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
