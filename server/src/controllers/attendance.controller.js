import mongoose from 'mongoose';
import StudentAttendance from '../models/StudentAttendance.model.js';
import TeacherAttendance from '../models/TeacherAttendance.model.js';
import Student from '../models/Student.model.js';
import Parent from '../models/Parent.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';

// ---- Student attendance ----

// Bulk marks attendance for every student in a section on a given date.
export const markStudentAttendance = asyncHandler(async (req, res) => {
  const { class: classId, section, date, records } = req.body;
  // records: [{ student, status, remarks }]

  const ops = records.map((r) => ({
    updateOne: {
      filter: { student: r.student, date: new Date(date) },
      update: {
        $set: {
          school: req.schoolId,
          class: classId,
          section,
          date: new Date(date),
          status: r.status,
          remarks: r.remarks,
          markedBy: req.user._id,
        },
      },
      upsert: true,
    },
  }));

  const result = await StudentAttendance.bulkWrite(ops);
  sendSuccess(res, { message: 'Attendance recorded', data: { matched: result.matchedCount, upserted: result.upsertedCount } });
});

export const listStudentAttendance = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) throw ApiError.notFound('Student profile not found');
    filter.student = student._id.toString();
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id });
    if (!parent || !req.query.student || !parent.children.map(String).includes(req.query.student)) {
      throw ApiError.forbidden('You may only view your own children');
    }
  }

  const { data, meta } = await new ApiFeatures(
    StudentAttendance.find(filter).populate('student', 'firstName lastName admissionNumber').sort('-date').lean(),
    { ...req.query, ...(filter.student ? { student: filter.student } : {}) },
    []
  )
    .filter()
    .sort()
    .paginate()
    .exec();

  sendSuccess(res, { data, meta });
});

export const studentAttendanceReport = asyncHandler(async (req, res) => {
  const { section, from, to } = req.query;
  if (!section) throw ApiError.badRequest('section is required');

  const match = { school: req.schoolId, section: new mongoose.Types.ObjectId(section) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const summary = await StudentAttendance.aggregate([
    { $match: match },
    { $group: { _id: { student: '$student', status: '$status' }, count: { $sum: 1 } } },
    {
      $group: {
        _id: '$_id.student',
        stats: { $push: { status: '$_id.status', count: '$count' } },
      },
    },
    {
      $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' },
    },
    { $unwind: '$student' },
    {
      $project: {
        student: { _id: 1, firstName: 1, lastName: 1, admissionNumber: 1 },
        stats: 1,
      },
    },
  ]);

  sendSuccess(res, { data: summary });
});

// ---- Teacher attendance ----

export const markTeacherAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body; // records: [{ teacher, status, checkIn, checkOut, remarks }]

  const ops = records.map((r) => ({
    updateOne: {
      filter: { teacher: r.teacher, date: new Date(date) },
      update: {
        $set: {
          school: req.schoolId,
          date: new Date(date),
          status: r.status,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          remarks: r.remarks,
          markedBy: req.user._id,
        },
      },
      upsert: true,
    },
  }));

  const result = await TeacherAttendance.bulkWrite(ops);
  sendSuccess(res, { message: 'Attendance recorded', data: { matched: result.matchedCount, upserted: result.upsertedCount } });
});

export const listTeacherAttendance = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    TeacherAttendance.find(filter).populate('teacher', 'firstName lastName employeeId').sort('-date').lean(),
    req.query,
    []
  )
    .filter()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});
