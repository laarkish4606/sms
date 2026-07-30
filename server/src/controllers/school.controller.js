import mongoose from 'mongoose';
import {
  School,
  User,
  AcademicYear,
  Class,
  Section,
  Subject,
  Timetable,
  Student,
  Teacher,
  Parent,
  StudentAttendance,
  TeacherAttendance,
  Exam,
  Mark,
  FeeStructure,
  Invoice,
  Payment,
  Book,
  BookIssue,
  TransportRoute,
  Vehicle,
  Hostel,
  Room,
  Notice,
  Message,
  Counter,
} from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';

// Only super_admin reaches these controllers (enforced in routes).

export const createSchool = asyncHandler(async (req, res) => {
  const { name, code, email, phone, address, website, adminFirstName, adminLastName, adminEmail, adminPassword } =
    req.body;

  const existing = await School.findOne({ code: code.toUpperCase() });
  if (existing) throw ApiError.conflict('A school with this code already exists');

  const emailTaken = await User.findOne({ email: adminEmail.toLowerCase() });
  if (emailTaken) throw ApiError.conflict('This admin email is already in use');

  const session = await mongoose.startSession();
  let school;
  try {
    await session.withTransaction(async () => {
      const [createdSchool] = await School.create([{ name, code, email, phone, address, website }], { session });
      school = createdSchool;
      await User.create(
        [
          {
            school: school._id,
            role: 'school_admin',
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail,
            password: adminPassword,
          },
        ],
        { session }
      );
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { statusCode: 201, message: 'School and admin account created', data: school });
});

export const listSchools = asyncHandler(async (req, res) => {
  const { data, meta } = await new ApiFeatures(School.find(), req.query, ['name', 'code', 'email'])
    .filter()
    .search()
    .sort()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { data: school });
});

export const updateSchool = asyncHandler(async (req, res) => {
  const disallowed = ['code'];
  disallowed.forEach((key) => delete req.body[key]);

  const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!school) throw ApiError.notFound('School not found');
  sendSuccess(res, { message: 'School updated', data: school });
});

export const deactivateSchool = asyncHandler(async (req, res) => {
  const school = await School.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!school) throw ApiError.notFound('School not found');
  await User.updateMany({ school: school._id }, { isActive: false });
  sendSuccess(res, { message: 'School deactivated', data: school });
});

export const reactivateSchool = asyncHandler(async (req, res) => {
  const school = await School.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!school) throw ApiError.notFound('School not found');
  await User.updateMany({ school: school._id }, { isActive: true });
  sendSuccess(res, { message: 'School reactivated', data: school });
});

// Permanently removes a school and every record scoped to it. Irreversible —
// the UI requires typing the school's code back to confirm before calling this.
export const deleteSchoolPermanently = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) throw ApiError.notFound('School not found');

  const schoolId = school._id;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        User.deleteMany({ school: schoolId }, { session }),
        AcademicYear.deleteMany({ school: schoolId }, { session }),
        Class.deleteMany({ school: schoolId }, { session }),
        Section.deleteMany({ school: schoolId }, { session }),
        Subject.deleteMany({ school: schoolId }, { session }),
        Timetable.deleteMany({ school: schoolId }, { session }),
        Student.deleteMany({ school: schoolId }, { session }),
        Teacher.deleteMany({ school: schoolId }, { session }),
        Parent.deleteMany({ school: schoolId }, { session }),
        StudentAttendance.deleteMany({ school: schoolId }, { session }),
        TeacherAttendance.deleteMany({ school: schoolId }, { session }),
        Exam.deleteMany({ school: schoolId }, { session }),
        Mark.deleteMany({ school: schoolId }, { session }),
        FeeStructure.deleteMany({ school: schoolId }, { session }),
        Invoice.deleteMany({ school: schoolId }, { session }),
        Payment.deleteMany({ school: schoolId }, { session }),
        Book.deleteMany({ school: schoolId }, { session }),
        BookIssue.deleteMany({ school: schoolId }, { session }),
        TransportRoute.deleteMany({ school: schoolId }, { session }),
        Vehicle.deleteMany({ school: schoolId }, { session }),
        Hostel.deleteMany({ school: schoolId }, { session }),
        Room.deleteMany({ school: schoolId }, { session }),
        Notice.deleteMany({ school: schoolId }, { session }),
        Message.deleteMany({ school: schoolId }, { session }),
        Counter.deleteMany({ key: { $regex: `:${schoolId}$` } }, { session }),
      ]);
      await School.deleteOne({ _id: schoolId }, { session });
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { message: 'School permanently deleted' });
});
