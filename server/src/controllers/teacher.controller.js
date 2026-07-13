import mongoose from 'mongoose';
import Teacher from '../models/Teacher.model.js';
import User from '../models/User.model.js';
import Section from '../models/Section.model.js';
import TeacherAttendance from '../models/TeacherAttendance.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { generateTeacherId } from '../services/idGenerator.service.js';

const POPULATE = [
  { path: 'subjects', select: 'name code' },
  { path: 'sections', select: 'name class' },
  { path: 'isClassTeacherOf', select: 'name class' },
];

export const createTeacher = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    designation,
    department,
    qualification,
    experienceYears,
    subjects,
    sections,
    dob,
    gender,
    address,
    salary,
  } = req.body;

  const emailTaken = await User.findOne({ email: email.toLowerCase() });
  if (emailTaken) throw ApiError.conflict('A user with this email already exists');

  const employeeId = await generateTeacherId(req.schoolId);

  const session = await mongoose.startSession();
  let teacher;
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [{ school: req.schoolId, role: 'teacher', firstName, lastName, email, password, phone }],
        { session }
      );

      [teacher] = await Teacher.create(
        [
          {
            school: req.schoolId,
            user: user._id,
            firstName,
            lastName,
            email,
            employeeId,
            designation,
            department,
            qualification,
            experienceYears,
            subjects,
            sections,
            dob,
            gender,
            address,
            salary,
          },
        ],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { statusCode: 201, message: 'Teacher registered', data: teacher });
});

export const listTeachers = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    Teacher.find(filter).populate(POPULATE),
    req.query,
    ['firstName', 'lastName', 'employeeId', 'department']
  )
    .filter()
    .search()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.schoolId })
    .populate(POPULATE)
    .populate({ path: 'user', select: 'firstName lastName email phone avatar isActive lastLogin' });
  if (!teacher) throw ApiError.notFound('Teacher not found');

  if (req.user.role === 'teacher' && teacher.user._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You may only view your own profile');
  }

  sendSuccess(res, { data: teacher });
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const disallowed = ['user', 'school', 'employeeId'];
  disallowed.forEach((key) => delete req.body[key]);

  const teacher = await Teacher.findOneAndUpdate({ _id: req.params.id, school: req.schoolId }, req.body, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!teacher) throw ApiError.notFound('Teacher not found');

  if (req.body.firstName || req.body.lastName) {
    await User.findByIdAndUpdate(teacher.user, {
      ...(req.body.firstName ? { firstName: req.body.firstName } : {}),
      ...(req.body.lastName ? { lastName: req.body.lastName } : {}),
    });
  }

  sendSuccess(res, { message: 'Teacher updated', data: teacher });
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.schoolId });
  if (!teacher) throw ApiError.notFound('Teacher not found');

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Teacher.deleteOne({ _id: teacher._id }, { session });
      await User.deleteOne({ _id: teacher.user }, { session });
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { message: 'Teacher removed' });
});

export const uploadTeacherPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const photoPath = `/uploads/teachers/${req.file.filename}`;
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { photo: photoPath },
    { new: true }
  );
  if (!teacher) throw ApiError.notFound('Teacher not found');
  sendSuccess(res, { message: 'Photo uploaded', data: { photo: teacher.photo } });
});

// Assigns subjects/sections/class-teacher role. Keeps Section.classTeacher in sync.
export const assignTeacher = asyncHandler(async (req, res) => {
  const { subjects, sections, isClassTeacherOf } = req.body;
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.schoolId });
  if (!teacher) throw ApiError.notFound('Teacher not found');

  if (subjects) teacher.subjects = subjects;
  if (sections) teacher.sections = sections;

  if (isClassTeacherOf) {
    const section = await Section.findOne({ _id: isClassTeacherOf, school: req.schoolId });
    if (!section) throw ApiError.badRequest('Invalid section');
    teacher.isClassTeacherOf = isClassTeacherOf;
    section.classTeacher = teacher._id;
    await section.save();
  }

  await teacher.save();
  const populated = await teacher.populate(POPULATE);
  sendSuccess(res, { message: 'Teacher assignments updated', data: populated });
});

export const getTeacherAttendanceSummary = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, school: req.schoolId });
  if (!teacher) throw ApiError.notFound('Teacher not found');

  const summary = await TeacherAttendance.aggregate([
    { $match: { teacher: teacher._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  sendSuccess(res, { data: summary });
});
