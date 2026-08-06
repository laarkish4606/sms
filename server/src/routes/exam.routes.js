import { Router } from 'express';
import * as controller from '../controllers/exam.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createExamValidator, enterMarksValidator } from '../validators/exam.validator.js';

const router = Router();
router.use(protect);

router
  .route('/')
  .get(controller.listExams)
  .post(authorize('school_admin'), createExamValidator, validate, controller.createExam);

router.get(
  '/term-report',
  authorize('school_admin', 'teacher', 'student', 'parent'),
  controller.getTermReportCard
);
router.get('/term-ranking', authorize('school_admin', 'teacher'), controller.getTermRanking);

router
  .route('/:id')
  .get(controller.getExam)
  .patch(authorize('school_admin'), controller.updateExam)
  .delete(authorize('school_admin'), controller.deleteExam);

router.patch('/:id/submit', authorize('school_admin', 'teacher'), controller.submitExam);
router.patch('/:id/publish', authorize('school_admin'), controller.publishExam);

router.post(
  '/:examId/marks',
  authorize('school_admin', 'teacher'),
  enterMarksValidator,
  validate,
  controller.enterMarks
);
router.get('/:examId/marks', authorize('school_admin', 'teacher'), controller.getExamMarks);
router.get('/:examId/results-summary', authorize('school_admin', 'teacher'), controller.getClassResultsSummary);
router.get(
  '/:examId/report-card/:studentId',
  authorize('school_admin', 'teacher', 'student', 'parent'),
  controller.getStudentReportCard
);

export default router;
