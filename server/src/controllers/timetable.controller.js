import Timetable from '../models/Timetable.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';

const POPULATE = [
  { path: 'periods.subject', select: 'name code' },
  { path: 'periods.teacher', select: 'firstName lastName' },
  { path: 'class', select: 'name' },
  { path: 'section', select: 'name' },
];

export const getTimetableForSection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const { academicYear } = req.query;

  const filter = { section: sectionId, school: req.schoolId };
  if (academicYear) filter.academicYear = academicYear;

  const timetable = await Timetable.findOne(filter).sort('-createdAt').populate(POPULATE);
  if (!timetable) throw ApiError.notFound('No timetable found for this section');
  sendSuccess(res, { data: timetable });
});

// Upserts the whole timetable (periods array) for a section/academic year.
export const upsertTimetable = asyncHandler(async (req, res) => {
  const { class: classId, section, academicYear, periods } = req.body;

  const timetable = await Timetable.findOneAndUpdate(
    { section, academicYear, school: req.schoolId },
    { school: req.schoolId, class: classId, section, academicYear, periods },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate(POPULATE);

  sendSuccess(res, { message: 'Timetable saved', data: timetable });
});

export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const timetables = await Timetable.find({ school: req.schoolId, 'periods.teacher': teacherId }).populate(POPULATE);

  const periods = timetables.flatMap((tt) =>
    tt.periods
      .filter((p) => p.teacher._id?.toString() === teacherId || p.teacher.toString() === teacherId)
      .map((p) => ({ ...p.toObject(), class: tt.class, section: tt.section }))
  );

  sendSuccess(res, { data: periods });
});
