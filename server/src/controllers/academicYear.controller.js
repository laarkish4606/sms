import AcademicYear from '../models/AcademicYear.model.js';
import School from '../models/School.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import crudFactory from '../utils/crudFactory.js';

const base = crudFactory(AcademicYear, { resourceName: 'Academic year' });

export const createAcademicYear = base.createOne;
export const listAcademicYears = base.getAll;
export const getAcademicYear = base.getOne;
export const updateAcademicYear = base.updateOne;
export const deleteAcademicYear = base.deleteOne;

export const setCurrentAcademicYear = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findOne({ _id: req.params.id, school: req.schoolId });
  if (!year) throw ApiError.notFound('Academic year not found');

  await AcademicYear.updateMany({ school: req.schoolId }, { isCurrent: false });
  year.isCurrent = true;
  await year.save();
  await School.findByIdAndUpdate(req.schoolId, { currentAcademicYear: year._id });

  sendSuccess(res, { message: 'Current academic year updated', data: year });
});
