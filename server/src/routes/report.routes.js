import { Router } from 'express';
import * as controller from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, authorize('school_admin', 'teacher', 'accountant'));

router.get('/attendance', controller.attendanceReport);
router.get('/attendance/export/excel', controller.exportAttendanceReportExcel);

router.get('/academic', controller.academicReport);
router.get('/academic/export/excel', controller.exportAcademicReportExcel);

router.get('/financial', authorize('school_admin', 'accountant'), controller.financialReport);
router.get('/financial/export/excel', authorize('school_admin', 'accountant'), controller.exportFinancialReportExcel);
router.get('/financial/export/pdf', authorize('school_admin', 'accountant'), controller.exportFinancialReportPdf);

export default router;
