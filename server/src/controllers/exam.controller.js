import Exam from '../models/Exam.model.js';
import Mark from '../models/Mark.model.js';
import Student from '../models/Student.model.js';
import Parent from '../models/Parent.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import crudFactory from '../utils/crudFactory.js';
import { computeReportCard, computeTermReportCard, rankByPercentage } from '../services/grading.service.js';

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

// Deleting an exam must also clear out its marks — otherwise Mark documents
// are left pointing at a nonexistent exam, which then shows up as a blank
// "(unknown exam)" entry anywhere marks are surfaced (report cards, recent
// grades on dashboards, term reports).
export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndDelete({ _id: req.params.id, school: req.schoolId });
  if (!exam) throw ApiError.notFound('Exam not found');
  await Mark.deleteMany({ exam: exam._id });
  sendSuccess(res, { message: 'Exam deleted' });
});

// Teacher-side step of the grading workflow: marks the exam ready for admin
// review. Only meaningful from 'draft' — an already submitted/approved exam
// should go through re-approval rather than silently resetting.
export const submitExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId, status: 'draft' },
    { status: 'submitted', submittedAt: new Date() },
    { new: true }
  );
  if (!exam) throw ApiError.notFound('Exam not found, or it has already been submitted/approved');
  sendSuccess(res, { message: 'Submitted for approval', data: exam });
});

// Admin-side approval — publishes results to students/parents. Admins can
// approve directly even skipping a formal submission, since they already
// have full authority over the exam.
export const publishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { isPublished: true, publishedAt: new Date(), status: 'approved' },
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

// ---- Term-level grading: combines every approved exam (assignment, quiz,
// midterm, final, practical, ...) in a class/academic year per subject,
// weighted by each exam's configured weight. ----

async function loadApprovedExams(schoolId, academicYear, classId) {
  const exams = await Exam.find({ school: schoolId, academicYear, class: classId, status: 'approved' });
  return { exams, examById: new Map(exams.map((e) => [e._id.toString(), e])) };
}

function marksToSubjectEntries(marks, examById) {
  const bySubject = new Map();
  marks.forEach((m) => {
    const key = m.subject._id.toString();
    if (!bySubject.has(key)) bySubject.set(key, { subject: m.subject.name, entries: [] });
    const exam = examById.get(m.exam.toString());
    bySubject.get(key).entries.push({
      obtained: m.obtainedMarks,
      total: m.maxMarks,
      weight: exam?.weight,
      category: exam?.category,
    });
  });
  return bySubject;
}

export const getTermReportCard = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, student: studentId } = req.query;
  if (!academicYear || !classId || !studentId) {
    throw ApiError.badRequest('academicYear, class, and student are required');
  }
  await assertCanViewStudentReport(req, studentId);

  const { exams, examById } = await loadApprovedExams(req.schoolId, academicYear, classId);
  if (!exams.length) throw ApiError.notFound('No approved exams found for this class/academic year');

  const marks = await Mark.find({ exam: { $in: exams.map((e) => e._id) }, student: studentId }).populate('subject', 'name');
  if (!marks.length) throw ApiError.notFound('No marks recorded for this student yet');

  const student = await Student.findById(studentId).select('firstName lastName admissionNumber');
  const report = computeTermReportCard(Array.from(marksToSubjectEntries(marks, examById).values()));

  sendSuccess(res, { data: { student, academicYear, examsIncluded: exams.length, ...report } });
});

// Ranks every active student in a class (optionally narrowed to one section)
// by their term-weighted overall percentage — ties share the same rank.
export const getTermRanking = asyncHandler(async (req, res) => {
  const { academicYear, class: classId, section } = req.query;
  if (!academicYear || !classId) throw ApiError.badRequest('academicYear and class are required');

  const { exams, examById } = await loadApprovedExams(req.schoolId, academicYear, classId);
  if (!exams.length) throw ApiError.notFound('No approved exams found for this class/academic year');

  const studentFilter = { school: req.schoolId, class: classId, status: 'active' };
  if (section) studentFilter.section = section;
  const students = await Student.find(studentFilter).select('firstName lastName admissionNumber');
  if (!students.length) throw ApiError.notFound('No active students found');

  const marks = await Mark.find({
    exam: { $in: exams.map((e) => e._id) },
    student: { $in: students.map((s) => s._id) },
  }).populate('subject', 'name');

  const byStudent = new Map();
  marks.forEach((m) => {
    const sid = m.student.toString();
    if (!byStudent.has(sid)) byStudent.set(sid, []);
  });
  marks.forEach((m) => {
    const sid = m.student.toString();
    const key = m.subject._id.toString();
    let entry = byStudent.get(sid).find((e) => e.key === key);
    if (!entry) {
      entry = { key, subject: m.subject.name, entries: [] };
      byStudent.get(sid).push(entry);
    }
    const exam = examById.get(m.exam.toString());
    entry.entries.push({ obtained: m.obtainedMarks, total: m.maxMarks, weight: exam?.weight, category: exam?.category });
  });

  const studentById = new Map(students.map((s) => [s._id.toString(), s]));
  const rows = Array.from(byStudent.entries())
    .filter(([, subjectEntries]) => subjectEntries.length)
    .map(([sid, subjectEntries]) => {
      const report = computeTermReportCard(subjectEntries);
      return { student: studentById.get(sid), percentage: report.percentage, gpa: report.gpa, grade: report.grade, result: report.result };
    });

  sendSuccess(res, { data: rankByPercentage(rows) });
});
