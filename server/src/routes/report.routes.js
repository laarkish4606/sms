import { Router } from 'express';
import * as controller from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, authorize('school_admin', 'teacher', 'accountant'));

router.get('/attendance', controller.attendanceReport);
router.get('/attendance/export/excel', controller.exportAttendanceReportExcel);
router.get('/attendance/export/pdf', controller.exportAttendanceReportPdf);

router.get('/academic', controller.academicReport);
router.get('/academic/export/excel', controller.exportAcademicReportExcel);
router.get('/academic/export/pdf', controller.exportAcademicReportPdf);

router.get('/students', controller.studentReport);
router.get('/students/export/excel', controller.exportStudentReportExcel);
router.get('/students/export/pdf', controller.exportStudentReportPdf);

router.get('/financial', authorize('school_admin', 'accountant'), controller.financialReport);
router.get('/financial/export/excel', authorize('school_admin', 'accountant'), controller.exportFinancialReportExcel);
router.get('/financial/export/pdf', authorize('school_admin', 'accountant'), controller.exportFinancialReportPdf);

router.get('/outstanding-fees', authorize('school_admin', 'accountant'), controller.outstandingFeeReport);
router.get(
  '/outstanding-fees/export/excel',
  authorize('school_admin', 'accountant'),
  controller.exportOutstandingFeeReportExcel
);
router.get(
  '/outstanding-fees/export/pdf',
  authorize('school_admin', 'accountant'),
  controller.exportOutstandingFeeReportPdf
);

export default router;
