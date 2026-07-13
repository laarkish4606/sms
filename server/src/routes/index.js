import { Router } from 'express';

import authRoutes from './auth.routes.js';
import schoolRoutes from './school.routes.js';
import userRoutes from './user.routes.js';
import studentRoutes from './student.routes.js';
import teacherRoutes from './teacher.routes.js';
import parentRoutes from './parent.routes.js';
import academicYearRoutes from './academicYear.routes.js';
import classRoutes from './class.routes.js';
import sectionRoutes from './section.routes.js';
import subjectRoutes from './subject.routes.js';
import timetableRoutes from './timetable.routes.js';
import attendanceRoutes from './attendance.routes.js';
import examRoutes from './exam.routes.js';
import feeRoutes from './fee.routes.js';
import libraryRoutes from './library.routes.js';
import transportRoutes from './transport.routes.js';
import hostelRoutes from './hostel.routes.js';
import communicationRoutes from './communication.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/parents', parentRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/subjects', subjectRoutes);
router.use('/timetables', timetableRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/fees', feeRoutes);
router.use('/library', libraryRoutes);
router.use('/transport', transportRoutes);
router.use('/hostel', hostelRoutes);
router.use('/communication', communicationRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
