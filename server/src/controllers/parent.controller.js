import mongoose from 'mongoose';
import Parent from '../models/Parent.model.js';
import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import StudentAttendance from '../models/StudentAttendance.model.js';
import Invoice from '../models/Invoice.model.js';
import Mark from '../models/Mark.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { computeReportCard } from '../services/grading.service.js';

const POPULATE_CHILDREN = { path: 'children', populate: ['class', 'section'] };

async function assertOwnsChild(req, studentId) {
  if (req.user.role !== 'parent') return;
  const parent = await Parent.findOne({ user: req.user._id, children: studentId });
  if (!parent) throw ApiError.forbidden('You may only view your own children');
}

export const createParent = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, occupation, address, children = [] } = req.body;

  const emailTaken = await User.findOne({ email: email.toLowerCase() });
  if (emailTaken) throw ApiError.conflict('A user with this email already exists');

  if (children.length) {
    const count = await Student.countDocuments({ _id: { $in: children }, school: req.schoolId });
    if (count !== children.length) throw ApiError.badRequest('One or more children are invalid');
  }

  const session = await mongoose.startSession();
  let parent;
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [{ school: req.schoolId, role: 'parent', firstName, lastName, email, password, phone }],
        { session }
      );
      [parent] = await Parent.create(
        [{ school: req.schoolId, user: user._id, occupation, address, children }],
        { session }
      );
      if (children.length) {
        await Student.updateMany({ _id: { $in: children } }, { $addToSet: { parents: parent._id } }, { session });
      }
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { statusCode: 201, message: 'Parent registered', data: parent });
});

export const listParents = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    Parent.find(filter)
      .populate(POPULATE_CHILDREN)
      .populate({ path: 'user', select: 'firstName lastName email phone avatar isActive' }),
    req.query,
    []
  )
    .filter()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getParent = asyncHandler(async (req, res) => {
  const parent = await Parent.findOne({ _id: req.params.id, school: req.schoolId })
    .populate(POPULATE_CHILDREN)
    .populate({ path: 'user', select: 'firstName lastName email phone avatar isActive' });
  if (!parent) throw ApiError.notFound('Parent not found');

  if (req.user.role === 'parent' && parent.user._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You may only view your own profile');
  }

  sendSuccess(res, { data: parent });
});

export const getMyChildren = asyncHandler(async (req, res) => {
  const parent = await Parent.findOne({ user: req.user._id }).populate(POPULATE_CHILDREN);
  if (!parent) throw ApiError.notFound('Parent profile not found');
  sendSuccess(res, { data: parent.children });
});

export const updateParent = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, occupation, address } = req.body;

  const parent = await Parent.findOne({ _id: req.params.id, school: req.schoolId });
  if (!parent) throw ApiError.notFound('Parent not found');

  const userUpdate = {};
  if (firstName !== undefined) userUpdate.firstName = firstName;
  if (lastName !== undefined) userUpdate.lastName = lastName;
  if (phone !== undefined) userUpdate.phone = phone;

  const parentUpdate = {};
  if (occupation !== undefined) parentUpdate.occupation = occupation;
  if (address !== undefined) parentUpdate.address = address;

  const tasks = [];
  if (Object.keys(userUpdate).length) {
    tasks.push(User.findByIdAndUpdate(parent.user, userUpdate, { runValidators: true }));
  }
  if (Object.keys(parentUpdate).length) {
    tasks.push(Parent.updateOne({ _id: parent._id }, parentUpdate, { runValidators: true }));
  }
  await Promise.all(tasks);

  const updated = await Parent.findById(parent._id)
    .populate(POPULATE_CHILDREN)
    .populate({ path: 'user', select: 'firstName lastName email phone avatar isActive' });

  sendSuccess(res, { message: 'Parent updated', data: updated });
});

export const linkChild = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const student = await Student.findOne({ _id: studentId, school: req.schoolId });
  if (!student) throw ApiError.notFound('Student not found');

  const parent = await Parent.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { $addToSet: { children: studentId } },
    { new: true }
  ).populate(POPULATE_CHILDREN);
  if (!parent) throw ApiError.notFound('Parent not found');

  await Student.updateOne({ _id: studentId }, { $addToSet: { parents: parent._id } });
  sendSuccess(res, { message: 'Child linked', data: parent });
});

export const unlinkChild = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const parent = await Parent.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { $pull: { children: studentId } },
    { new: true }
  ).populate(POPULATE_CHILDREN);
  if (!parent) throw ApiError.notFound('Parent not found');

  await Student.updateOne({ _id: studentId }, { $pull: { parents: parent._id } });
  sendSuccess(res, { message: 'Child unlinked', data: parent });
});

export const deleteParent = asyncHandler(async (req, res) => {
  const parent = await Parent.findOne({ _id: req.params.id, school: req.schoolId });
  if (!parent) throw ApiError.notFound('Parent not found');

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Student.updateMany({ parents: parent._id }, { $pull: { parents: parent._id } }, { session });
      await Parent.deleteOne({ _id: parent._id }, { session });
      await User.deleteOne({ _id: parent.user }, { session });
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { message: 'Parent removed' });
});

export const getChildAttendance = asyncHandler(async (req, res) => {
  await assertOwnsChild(req, req.params.studentId);
  const records = await StudentAttendance.find({ student: req.params.studentId, school: req.schoolId }).sort('-date').limit(90);
  sendSuccess(res, { data: records });
});

export const getChildGrades = asyncHandler(async (req, res) => {
  await assertOwnsChild(req, req.params.studentId);
  const marks = await Mark.find({ student: req.params.studentId, school: req.schoolId }).populate('subject exam');

  const byExam = marks.reduce((acc, mark) => {
    const examId = mark.exam._id.toString();
    if (!acc[examId]) acc[examId] = { exam: mark.exam, marks: [] };
    acc[examId].marks.push({ subject: mark.subject.name, obtained: mark.obtainedMarks, total: mark.maxMarks });
    return acc;
  }, {});

  const reportCards = Object.values(byExam).map(({ exam, marks: examMarks }) => ({
    exam,
    ...computeReportCard(examMarks),
  }));

  sendSuccess(res, { data: reportCards });
});

export const getChildFeeStatus = asyncHandler(async (req, res) => {
  await assertOwnsChild(req, req.params.studentId);
  const invoices = await Invoice.find({ student: req.params.studentId, school: req.schoolId }).sort('-dueDate');
  sendSuccess(res, { data: invoices });
});
