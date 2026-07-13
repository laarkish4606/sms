import Exam from '../models/Exam.model.js';
import Mark from '../models/Mark.model.js';
import Student from '../models/Student.model.js';
import Parent from '../models/Parent.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import crudFactory from '../utils/crudFactory.js';
import { computeReportCard } from '../services/grading.service.js';

const POPULATE = [
  { path: 'class', select: 'name' },
  { path: 'academicYear', select: 'name' },
  { path: 'subjects.subject', select: 'name code' },
];

const base = crudFactory(Exam, { resourceName: 'Exam', populate: POPULATE, searchFields: ['name'] });

export const createExam = base.createOne;
export const listExams = base.getAll;
export const getExam = base.getOne;
export const updateExam = base.updateOne;
export const deleteExam = base.deleteOne;

export const publishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { isPublished: true, publishedAt: new Date() },
    { new: true }
  );
  if (!exam) throw ApiError.notFound('Exam not found');
  sendSuccess(res, { message: 'Results published', data: exam });
});

// Bulk upsert marks for an exam (teacher enters marks per subject for their class).
export const enterMarks = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.examId, school: req.schoolId });
  if (!exam) throw ApiError.notFound('Exam not found');

  const { records } = req.body;

  const ops = records.map((r) => {
    const subjectDef = exam.subjects.find((s) => s.subject.toString() === r.subject);
    if (!subjectDef) throw ApiError.badRequest(`Subject ${r.subject} is not part of this exam`);

    return {
      updateOne: {
        filter: { exam: exam._id, student: r.student, subject: r.subject },
        update: {
          $set: {
            school: req.schoolId,
            exam: exam._id,
            student: r.student,
            subject: r.subject,
            obtainedMarks: r.isAbsent ? 0 : r.obtainedMarks,
            maxMarks: subjectDef.maxMarks,
            isAbsent: Boolean(r.isAbsent),
            remarks: r.remarks,
            enteredBy: req.user._id,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Mark.bulkWrite(ops);
  sendSuccess(res, { message: 'Marks recorded', data: { matched: result.matchedCount, upserted: result.upsertedCount } });
});

export const getExamMarks = asyncHandler(async (req, res) => {
  const filter = { exam: req.params.examId, school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    Mark.find(filter).populate('student', 'firstName lastName admissionNumber').populate('subject', 'name code'),
    req.query,
    []
  )
    .filter()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

async function assertCanViewStudentReport(req, studentId) {
  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || student._id.toString() !== studentId) throw ApiError.forbidden('You may only view your own report card');
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id, children: studentId });
    if (!parent) throw ApiError.forbidden('You may only view your own children');
  }
}

export const getStudentReportCard = asyncHandler(async (req, res) => {
  const { examId, studentId } = req.params;
  await assertCanViewStudentReport(req, studentId);

  const exam = await Exam.findOne({ _id: examId, school: req.schoolId }).populate('class academicYear');
  if (!exam) throw ApiError.notFound('Exam not found');

  if (!exam.isPublished && !['school_admin', 'teacher'].includes(req.user.role)) {
    throw ApiError.forbidden('Results have not been published yet');
  }

  const marks = await Mark.find({ exam: examId, student: studentId }).populate('subject', 'name code');
  if (!marks.length) throw ApiError.notFound('No marks recorded for this student in this exam');

  const student = await Student.findById(studentId).select('firstName lastName admissionNumber');

  const reportCard = computeReportCard(
    marks.map((m) => ({ subject: m.subject.name, obtained: m.obtainedMarks, total: m.maxMarks }))
  );

  sendSuccess(res, { data: { exam, student, ...reportCard } });
});

export const getClassResultsSummary = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = await Exam.findOne({ _id: examId, school: req.schoolId });
  if (!exam) throw ApiError.notFound('Exam not found');

  const marks = await Mark.find({ exam: examId }).populate('subject', 'name');
  const byStudent = marks.reduce((acc, m) => {
    const key = m.student.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push({ subject: m.subject.name, obtained: m.obtainedMarks, total: m.maxMarks });
    return acc;
  }, {});

  const students = await Student.find({ _id: { $in: Object.keys(byStudent) } }).select('firstName lastName admissionNumber');
  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  const results = Object.entries(byStudent).map(([studentId, subjectMarks]) => ({
    student: studentMap.get(studentId),
    ...computeReportCard(subjectMarks),
  }));

  results.sort((a, b) => b.percentage - a.percentage);
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  sendSuccess(res, { data: results });
});
