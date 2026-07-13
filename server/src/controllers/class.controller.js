import Class from '../models/Class.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import crudFactory from '../utils/crudFactory.js';

const POPULATE = [
  { path: 'academicYear', select: 'name isCurrent' },
  { path: 'subjects.subject', select: 'name code' },
  { path: 'subjects.teacher', select: 'firstName lastName employeeId' },
];

const base = crudFactory(Class, { resourceName: 'Class', populate: POPULATE });

export const createClass = base.createOne;
export const listClasses = base.getAll;
export const getClass = base.getOne;
export const updateClass = base.updateOne;
export const deleteClass = base.deleteOne;

export const assignSubjectTeacher = asyncHandler(async (req, res) => {
  const { subject, teacher } = req.body;
  const klass = await Class.findOne({ _id: req.params.id, school: req.schoolId });
  if (!klass) throw ApiError.notFound('Class not found');

  const existing = klass.subjects.find((s) => s.subject.toString() === subject);
  if (existing) {
    existing.teacher = teacher;
  } else {
    klass.subjects.push({ subject, teacher });
  }

  await klass.save();
  const populated = await klass.populate(POPULATE);
  sendSuccess(res, { message: 'Subject-teacher assignment updated', data: populated });
});
