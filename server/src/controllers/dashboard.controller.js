import Student from '../models/Student.model.js';
import Teacher from '../models/Teacher.model.js';
import Parent from '../models/Parent.model.js';
import Invoice from '../models/Invoice.model.js';
import Payment from '../models/Payment.model.js';
import StudentAttendance from '../models/StudentAttendance.model.js';
import Notice from '../models/Notice.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';

// High-level counts + a couple of charts for the admin/accountant landing dashboard.
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    totalStudents,
    totalTeachers,
    totalParents,
    activeStudents,
    pendingInvoices,
    overdueInvoices,
    collectedThisMonth,
    todayAttendance,
    recentNotices,
    monthlyCollections,
  ] = await Promise.all([
    Student.countDocuments({ school: schoolId }),
    Teacher.countDocuments({ school: schoolId }),
    Parent.countDocuments({ school: schoolId }),
    Student.countDocuments({ school: schoolId, status: 'active' }),
    Invoice.countDocuments({ school: schoolId, status: 'pending' }),
    Invoice.countDocuments({ school: schoolId, status: 'overdue' }),
    Payment.aggregate([
      { $match: { school: schoolId, paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    StudentAttendance.aggregate([
      {
        $match: {
          school: schoolId,
          date: { $gte: new Date(new Date().toDateString()) },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Notice.find({ school: schoolId }).sort('-createdAt').limit(5),
    Payment.aggregate([
      { $match: { school: schoolId, paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  sendSuccess(res, {
    data: {
      counts: {
        totalStudents,
        totalTeachers,
        totalParents,
        activeStudents,
        pendingInvoices,
        overdueInvoices,
      },
      feesCollectedThisMonth: collectedThisMonth[0]?.total || 0,
      todayAttendance,
      recentNotices,
      monthlyCollections,
    },
  });
});

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const teacher = await Teacher.findOne({ user: req.user._id });

  const [attendanceToday, recentNotices] = await Promise.all([
    StudentAttendance.aggregate([
      {
        $match: {
          school: schoolId,
          section: { $in: teacher?.sections || [] },
          date: { $gte: new Date(new Date().toDateString()) },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Notice.find({ school: schoolId, $or: [{ audience: 'all' }, { audience: 'teachers' }] })
      .sort('-createdAt')
      .limit(5),
  ]);

  sendSuccess(res, {
    data: {
      teacher,
      attendanceToday,
      recentNotices,
    },
  });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const student = await Student.findOne({ user: req.user._id }).populate('class section');

  const [attendanceSummary, invoices, recentNotices] = await Promise.all([
    StudentAttendance.aggregate([
      { $match: { school: schoolId, student: student?._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.find({ school: schoolId, student: student?._id }).sort('-dueDate').limit(5),
    Notice.find({ school: schoolId, $or: [{ audience: 'all' }, { audience: 'students' }] })
      .sort('-createdAt')
      .limit(5),
  ]);

  sendSuccess(res, { data: { student, attendanceSummary, invoices, recentNotices } });
});
