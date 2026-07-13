import mongoose from 'mongoose';
import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import Section from '../models/Section.model.js';
import Parent from '../models/Parent.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { generateStudentId } from '../services/idGenerator.service.js';

const POPULATE = [
  { path: 'class', select: 'name numericOrder' },
  { path: 'section', select: 'name' },
  { path: 'parents', select: 'occupation' },
];

export const createStudent = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    dob,
    gender,
    bloodGroup,
    religion,
    nationality,
    address,
    class: classId,
    section: sectionId,
    rollNumber,
    guardians,
    emergencyContact,
  } = req.body;

  const emailTaken = await User.findOne({ email: email.toLowerCase() });
  if (emailTaken) throw ApiError.conflict('A user with this email already exists');

  const section = await Section.findOne({ _id: sectionId, class: classId, school: req.schoolId });
  if (!section) throw ApiError.badRequest('Invalid class/section for this school');

  const admissionNumber = await generateStudentId(req.schoolId);

  const session = await mongoose.startSession();
  let student;
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [{ school: req.schoolId, role: 'student', firstName, lastName, email, password, phone }],
        { session }
      );

      [student] = await Student.create(
        [
          {
            school: req.schoolId,
            user: user._id,
            firstName,
            lastName,
            email,
            admissionNumber,
            class: classId,
            section: sectionId,
            rollNumber,
            dob,
            gender,
            bloodGroup,
            religion,
            nationality,
            address,
            guardians,
            emergencyContact,
          },
        ],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { statusCode: 201, message: 'Student registered', data: student });
});

export const getMyStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate(POPULATE);
  if (!student) throw ApiError.notFound('Student profile not found');
  sendSuccess(res, { data: student });
});

export const listStudents = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };
  const { data, meta } = await new ApiFeatures(
    Student.find(filter).populate(POPULATE),
    req.query,
    ['firstName', 'lastName', 'admissionNumber']
  )
    .filter()
    .search()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, school: req.schoolId })
    .populate(POPULATE)
    .populate({ path: 'user', select: 'firstName lastName email phone avatar isActive lastLogin' })
    .populate({ path: 'academicHistory.class academicHistory.section academicHistory.academicYear' });
  if (!student) throw ApiError.notFound('Student not found');

  if (req.user.role === 'student' && student.user._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You may only view your own profile');
  }
  if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id, children: student._id });
    if (!parent) throw ApiError.forbidden('You may only view your own children');
  }

  sendSuccess(res, { data: student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const disallowed = ['user', 'school', 'admissionNumber'];
  disallowed.forEach((key) => delete req.body[key]);

  const student = await Student.findOneAndUpdate({ _id: req.params.id, school: req.schoolId }, req.body, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);
  if (!student) throw ApiError.notFound('Student not found');

  if (req.body.firstName || req.body.lastName) {
    await User.findByIdAndUpdate(student.user, {
      ...(req.body.firstName ? { firstName: req.body.firstName } : {}),
      ...(req.body.lastName ? { lastName: req.body.lastName } : {}),
    });
  }

  sendSuccess(res, { message: 'Student updated', data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, school: req.schoolId });
  if (!student) throw ApiError.notFound('Student not found');

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Student.deleteOne({ _id: student._id }, { session });
      await User.deleteOne({ _id: student.user }, { session });
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { message: 'Student removed' });
});

export const uploadStudentPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const photoPath = `/uploads/students/${req.file.filename}`;
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, school: req.schoolId },
    { photo: photoPath },
    { new: true }
  );
  if (!student) throw ApiError.notFound('Student not found');
  sendSuccess(res, { message: 'Photo uploaded', data: { photo: student.photo } });
});

export const promoteStudents = asyncHandler(async (req, res) => {
  const { studentIds, toClass, toSection, toAcademicYear, result = 'PROMOTED' } = req.body;

  const students = await Student.find({ _id: { $in: studentIds }, school: req.schoolId });
  if (students.length !== studentIds.length) throw ApiError.badRequest('Some students were not found');

  const bulkOps = students.map((student) => ({
    updateOne: {
      filter: { _id: student._id },
      update: {
        $push: {
          academicHistory: {
            academicYear: toAcademicYear,
            class: student.class,
            section: student.section,
            result,
          },
        },
        $set: { class: toClass, section: toSection },
      },
    },
  }));

  await Student.bulkWrite(bulkOps);
  sendSuccess(res, { message: `${students.length} student(s) promoted` });
});
