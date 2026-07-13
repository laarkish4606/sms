import StudentAttendance from '../models/StudentAttendance.model.js';
import Invoice from '../models/Invoice.model.js';
import Payment from '../models/Payment.model.js';
import Mark from '../models/Mark.model.js';
import Exam from '../models/Exam.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { streamExcel } from '../services/excel.service.js';
import { streamPdf } from '../services/pdf.service.js';
import { computeReportCard } from '../services/grading.service.js';

function dateRangeFilter(from, to) {
  if (!from && !to) return undefined;
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);
  return range;
}

// ---- Attendance report ----

async function buildAttendanceReport(schoolId, { section, from, to }) {
  const match = { school: schoolId };
  if (section) match.section = section;
  const dateRange = dateRangeFilter(from, to);
  if (dateRange) match.date = dateRange;

  return StudentAttendance.aggregate([
    { $match: match },
    { $group: { _id: { student: '$student', status: '$status' }, count: { $sum: 1 } } },
    { $group: { _id: '$_id.student', stats: { $push: { status: '$_id.status', count: '$count' } } } },
    { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $project: { student: { firstName: 1, lastName: 1, admissionNumber: 1 }, stats: 1 } },
  ]);
}

export const attendanceReport = asyncHandler(async (req, res) => {
  const data = await buildAttendanceReport(req.schoolId, req.query);
  sendSuccess(res, { data });
});

export const exportAttendanceReportExcel = asyncHandler(async (req, res) => {
  const data = await buildAttendanceReport(req.schoolId, req.query);
  const rows = data.map((d) => {
    const statCount = (status) => d.stats.find((s) => s.status === status)?.count || 0;
    return {
      admissionNumber: d.student.admissionNumber,
      name: `${d.student.firstName} ${d.student.lastName}`,
      present: statCount('present'),
      absent: statCount('absent'),
      late: statCount('late'),
      excused: statCount('excused'),
    };
  });

  await streamExcel(
    res,
    'attendance-report.xlsx',
    'Attendance',
    [
      { header: 'Admission No', key: 'admissionNumber', width: 18 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Present', key: 'present', width: 12 },
      { header: 'Absent', key: 'absent', width: 12 },
      { header: 'Late', key: 'late', width: 12 },
      { header: 'Excused', key: 'excused', width: 12 },
    ],
    rows
  );
});

// ---- Academic report ----

async function buildAcademicReport(schoolId, examId) {
  const exam = await Exam.findOne({ _id: examId, school: schoolId });
  if (!exam) throw ApiError.notFound('Exam not found');

  const marks = await Mark.find({ exam: examId }).populate('student', 'firstName lastName admissionNumber').populate(
    'subject',
    'name'
  );

  const byStudent = marks.reduce((acc, m) => {
    const key = m.student._id.toString();
    if (!acc[key]) acc[key] = { student: m.student, subjects: [] };
    acc[key].subjects.push({ subject: m.subject.name, obtained: m.obtainedMarks, total: m.maxMarks });
    return acc;
  }, {});

  return Object.values(byStudent).map(({ student, subjects }) => ({ student, ...computeReportCard(subjects) }));
}

export const academicReport = asyncHandler(async (req, res) => {
  const data = await buildAcademicReport(req.schoolId, req.query.exam);
  sendSuccess(res, { data });
});

export const exportAcademicReportExcel = asyncHandler(async (req, res) => {
  const data = await buildAcademicReport(req.schoolId, req.query.exam);
  const rows = data.map((d) => ({
    admissionNumber: d.student.admissionNumber,
    name: `${d.student.firstName} ${d.student.lastName}`,
    totalObtained: d.totalObtained,
    totalMax: d.totalMax,
    percentage: d.percentage,
    grade: d.grade,
    gpa: d.gpa,
    result: d.result,
  }));

  await streamExcel(
    res,
    'academic-report.xlsx',
    'Academic',
    [
      { header: 'Admission No', key: 'admissionNumber', width: 18 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Obtained', key: 'totalObtained', width: 12 },
      { header: 'Max', key: 'totalMax', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'GPA', key: 'gpa', width: 10 },
      { header: 'Result', key: 'result', width: 12 },
    ],
    rows
  );
});

// ---- Financial report ----

async function buildFinancialReport(schoolId, { from, to }) {
  const match = { school: schoolId };
  const dateRange = dateRangeFilter(from, to);
  if (dateRange) match.paidAt = dateRange;

  const [payments, invoiceSummary] = await Promise.all([
    Payment.find(match).populate('student', 'firstName lastName admissionNumber').sort('-paidAt'),
    Invoice.aggregate([
      { $match: { school: schoolId } },
      { $group: { _id: '$status', total: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
    ]),
  ]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  return { payments, invoiceSummary, totalCollected };
}

export const financialReport = asyncHandler(async (req, res) => {
  const data = await buildFinancialReport(req.schoolId, req.query);
  sendSuccess(res, { data });
});

export const exportFinancialReportExcel = asyncHandler(async (req, res) => {
  const { payments } = await buildFinancialReport(req.schoolId, req.query);
  const rows = payments.map((p) => ({
    receiptNumber: p.receiptNumber,
    student: `${p.student.firstName} ${p.student.lastName}`,
    admissionNumber: p.student.admissionNumber,
    amount: p.amount,
    method: p.method,
    paidAt: p.paidAt.toISOString().slice(0, 10),
  }));

  await streamExcel(
    res,
    'financial-report.xlsx',
    'Payments',
    [
      { header: 'Receipt No', key: 'receiptNumber', width: 18 },
      { header: 'Student', key: 'student', width: 24 },
      { header: 'Admission No', key: 'admissionNumber', width: 18 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Method', key: 'method', width: 16 },
      { header: 'Date', key: 'paidAt', width: 14 },
    ],
    rows
  );
});

export const exportFinancialReportPdf = asyncHandler(async (req, res) => {
  const { payments, totalCollected } = await buildFinancialReport(req.schoolId, req.query);

  streamPdf(res, 'financial-report.pdf', (doc) => {
    doc.fontSize(16).text('Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Total Collected: ${totalCollected.toFixed(2)}`);
    doc.moveDown();

    payments.forEach((p) => {
      doc.text(
        `${p.paidAt.toISOString().slice(0, 10)}  |  ${p.receiptNumber}  |  ${p.student.firstName} ${p.student.lastName}  |  ${p.amount.toFixed(2)}  |  ${p.method}`
      );
    });
  });
});
