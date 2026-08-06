import Student from '../models/Student.model.js';
import Teacher from '../models/Teacher.model.js';
import Parent from '../models/Parent.model.js';
import User from '../models/User.model.js';
import Class from '../models/Class.model.js';
import Invoice from '../models/Invoice.model.js';
import Payment from '../models/Payment.model.js';
import StudentAttendance from '../models/StudentAttendance.model.js';
import Notice from '../models/Notice.model.js';
import Exam from '../models/Exam.model.js';
import Mark from '../models/Mark.model.js';
import Timetable from '../models/Timetable.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// High-level counts + a couple of charts for the admin/accountant landing dashboard.
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const sevenDaysAgo = new Date(startOfToday());
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalStaff,
    totalClasses,
    activeStudents,
    pendingInvoices,
    overdueInvoices,
    collectedThisMonth,
    todayAttendance,
    recentNotices,
    monthlyCollections,
    recentStudents,
    recentTeachers,
    pendingApprovals,
    weeklyAttendanceTrend,
  ] = await Promise.all([
    Student.countDocuments({ school: schoolId }),
    Teacher.countDocuments({ school: schoolId }),
    Parent.countDocuments({ school: schoolId }),
    User.countDocuments({ school: schoolId, role: { $in: ['accountant', 'school_admin'] } }),
    Class.countDocuments({ school: schoolId }),
    Student.countDocuments({ school: schoolId, status: 'active' }),
    Invoice.countDocuments({ school: schoolId, status: 'pending' }),
    Invoice.countDocuments({ school: schoolId, status: 'overdue' }),
    Payment.aggregate([
      { $match: { school: schoolId, paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    StudentAttendance.aggregate([
      { $match: { school: schoolId, date: { $gte: startOfToday() } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Notice.find({ school: schoolId }).sort('-createdAt').limit(5).lean(),
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
    Student.find({ school: schoolId }).sort('-createdAt').limit(5).select('firstName lastName admissionNumber createdAt').lean(),
    Teacher.find({ school: schoolId }).sort('-createdAt').limit(5).select('firstName lastName employeeId createdAt').lean(),
    Exam.countDocuments({ school: schoolId, status: 'submitted' }),
    StudentAttendance.aggregate([
      { $match: { school: schoolId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
  ]);

  sendSuccess(res, {
    data: {
      counts: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalStaff,
        totalClasses,
        activeStudents,
        pendingInvoices,
        overdueInvoices,
        pendingApprovals,
      },
      feesCollectedThisMonth: collectedThisMonth[0]?.total || 0,
      todayAttendance,
      recentNotices,
      monthlyCollections,
      weeklyAttendanceTrend,
      recentRegistrations: {
        students: recentStudents,
        teachers: recentTeachers,
      },
    },
  });
});

export const getAccountantDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const unpaidStatuses = ['pending', 'partial', 'overdue'];

  const [
    collectedThisMonth,
    outstandingAgg,
    studentsWithUnpaid,
    recentTransactions,
    feeCollectionTrend,
    invoiceSummary,
    recentNotices,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: { school: schoolId, paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.aggregate([
      { $match: { school: schoolId, status: { $in: unpaidStatuses } } },
      { $group: { _id: null, outstanding: { $sum: { $subtract: ['$totalAmount', '$amountPaid'] } } } },
    ]),
    Invoice.distinct('student', { school: schoolId, status: { $in: unpaidStatuses } }),
    Payment.find({ school: schoolId })
      .populate('student', 'firstName lastName admissionNumber')
      .sort('-paidAt')
      .limit(10)
      .lean(),
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
    Invoice.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: '$status', total: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
    ]),
    Notice.find({ school: schoolId, $or: [{ audience: 'all' }, { audience: 'accountants' }] })
      .sort('-createdAt')
      .limit(5)
      .lean(),
  ]);

  sendSuccess(res, {
    data: {
      monthlyRevenue: collectedThisMonth[0]?.total || 0,
      outstandingPayments: outstandingAgg[0]?.outstanding || 0,
      studentsWithUnpaidFeesCount: studentsWithUnpaid.length,
      recentTransactions,
      feeCollectionTrend,
      invoiceSummary,
      recentNotices,
    },
  });
});

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const teacher = await Teacher.findOne({ user: req.user._id }).populate('sections', 'name').populate('subjects', 'name');
  const sectionIds = teacher?.sections?.map((s) => s._id) || [];
  const today = startOfToday();
  const dayOfWeek = new Date().getDay();

  const [attendanceToday, recentNotices, studentCount, sectionsMarkedToday, todaysTimetable] = await Promise.all([
    StudentAttendance.aggregate([
      { $match: { school: schoolId, section: { $in: sectionIds }, date: { $gte: today } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Notice.find({ school: schoolId, $or: [{ audience: 'all' }, { audience: 'teachers' }] })
      .sort('-createdAt')
      .limit(5)
      .lean(),
    Student.countDocuments({ school: schoolId, section: { $in: sectionIds }, status: 'active' }),
    StudentAttendance.distinct('section', { school: schoolId, section: { $in: sectionIds }, date: { $gte: today } }),
    Timetable.aggregate([
      { $match: { school: schoolId, section: { $in: sectionIds } } },
      { $unwind: '$periods' },
      { $match: { 'periods.dayOfWeek': dayOfWeek, 'periods.teacher': teacher?._id } },
      { $lookup: { from: 'subjects', localField: 'periods.subject', foreignField: '_id', as: 'subject' } },
      { $unwind: '$subject' },
      { $lookup: { from: 'sections', localField: 'section', foreignField: '_id', as: 'sectionInfo' } },
      { $unwind: '$sectionInfo' },
      {
        $project: {
          _id: 0,
          startTime: '$periods.startTime',
          endTime: '$periods.endTime',
          room: '$periods.room',
          subject: '$subject.name',
          section: '$sectionInfo.name',
        },
      },
      { $sort: { startTime: 1 } },
    ]),
  ]);

  const attendancePendingCount = Math.max(sectionIds.length - sectionsMarkedToday.length, 0);

  sendSuccess(res, {
    data: {
      teacher,
      attendanceToday,
      recentNotices,
      classesAssigned: sectionIds.length,
      coursesTaught: teacher?.subjects?.length || 0,
      studentCount,
      attendancePendingCount,
      todaysTimetable,
    },
  });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  let student;
  if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id }).populate({ path: 'children', populate: ['class', 'section'] });
    const children = parent?.children || [];
    student = req.query.student ? children.find((c) => c._id.toString() === req.query.student) : children[0];
  } else {
    student = await Student.findOne({ user: req.user._id }).populate('class section');
  }

  if (!student) {
    return sendSuccess(res, { data: { student: null, attendanceSummary: [], invoices: [], recentNotices: [] } });
  }

  const dayOfWeek = new Date().getDay();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [
    attendanceSummary,
    recentAbsences,
    invoices,
    recentNotices,
    upcomingExams,
    latestMarks,
    todaysTimetable,
  ] = await Promise.all([
    StudentAttendance.aggregate([
      { $match: { school: schoolId, student: student._id, date: { $gte: oneMonthAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    StudentAttendance.find({ school: schoolId, student: student._id, status: { $in: ['absent', 'late'] } })
      .sort('-date')
      .limit(5)
      .lean(),
    Invoice.find({ school: schoolId, student: student._id }).sort('-dueDate').limit(5).lean(),
    Notice.find({ school: schoolId, $or: [{ audience: 'all' }, { audience: 'students' }] })
      .sort('-createdAt')
      .limit(5)
      .lean(),
    Exam.find({ school: schoolId, class: student.class?._id, startDate: { $gte: startOfToday() } })
      .sort('startDate')
      .limit(5)
      .select('name category startDate')
      .lean(),
    Mark.find({ school: schoolId, student: student._id })
      .sort('-createdAt')
      .limit(5)
      .populate('subject', 'name')
      .populate('exam', 'name category')
      .lean(),
    student.section
      ? Timetable.aggregate([
          { $match: { school: schoolId, section: student.section._id } },
          { $unwind: '$periods' },
          { $match: { 'periods.dayOfWeek': dayOfWeek } },
          { $lookup: { from: 'subjects', localField: 'periods.subject', foreignField: '_id', as: 'subject' } },
          { $unwind: '$subject' },
          { $project: { _id: 0, startTime: '$periods.startTime', endTime: '$periods.endTime', room: '$periods.room', subject: '$subject.name' } },
          { $sort: { startTime: 1 } },
        ])
      : [],
  ]);

  sendSuccess(res, {
    data: {
      student,
      attendanceSummary,
      recentAbsences,
      invoices,
      recentNotices,
      upcomingExams,
      latestMarks,
      todaysTimetable,
    },
  });
});

// Parent's own landing overview — one row per linked child, before drilling
// into a specific child via getStudentDashboard.
export const getParentDashboard = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const parent = await Parent.findOne({ user: req.user._id }).populate({ path: 'children', populate: ['class', 'section'] });
  const children = parent?.children || [];

  if (!children.length) {
    return sendSuccess(res, { data: { children: [], recentNotices: [] } });
  }

  const childIds = children.map((c) => c._id);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [attendanceByChild, invoicesByChild, recentNotices] = await Promise.all([
    StudentAttendance.aggregate([
      { $match: { school: schoolId, student: { $in: childIds }, date: { $gte: oneMonthAgo } } },
      { $group: { _id: { student: '$student', status: '$status' }, count: { $sum: 1 } } },
    ]),
    Invoice.find({ school: schoolId, student: { $in: childIds } }).sort('-dueDate').lean(),
    Notice.find({ school: schoolId, $or: [{ audience: 'all' }, { audience: 'parents' }] })
      .sort('-createdAt')
      .limit(5)
      .lean(),
  ]);

  const summary = children.map((child) => {
    const stats = attendanceByChild.filter((a) => a._id.student.toString() === child._id.toString());
    const present = stats.find((s) => s._id.status === 'present')?.count || 0;
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const attendancePct = total ? Math.round((present / total) * 100) : null;

    const childInvoices = invoicesByChild.filter((inv) => inv.student.toString() === child._id.toString());
    const outstanding = childInvoices.reduce((sum, inv) => sum + Math.max(inv.totalAmount - inv.amountPaid, 0), 0);
    const unpaidCount = childInvoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled').length;

    return {
      student: child,
      attendancePct,
      outstandingBalance: outstanding,
      unpaidInvoiceCount: unpaidCount,
      recentPayments: childInvoices.filter((inv) => inv.amountPaid > 0).slice(0, 3),
    };
  });

  sendSuccess(res, { data: { children: summary, recentNotices } });
});
