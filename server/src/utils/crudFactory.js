import asyncHandler from './asyncHandler.js';
import ApiError from './ApiError.js';
import { sendSuccess } from './ApiResponse.js';
import ApiFeatures from './apiFeatures.js';

/**
 * Generates standard school-scoped CRUD handlers for simple resources
 * (AcademicYear, Subject, Class, Vehicle, Hostel, TransportRoute, Book, Notice, ...).
 * Resources with cross-document side effects (Student, Teacher, Invoice, ...) use
 * hand-written controllers instead of this factory.
 */
export function crudFactory(Model, options = {}) {
  const {
    populate = [],
    searchFields = [],
    disallowedFields = [],
    resourceName = Model.modelName,
    beforeCreate,
  } = options;

  const createOne = asyncHandler(async (req, res) => {
    disallowedFields.forEach((key) => delete req.body[key]);
    const payload = { ...req.body, school: req.schoolId };
    if (beforeCreate) await beforeCreate(payload, req);

    const doc = await Model.create(payload);
    sendSuccess(res, { statusCode: 201, message: `${resourceName} created`, data: doc });
  });

  const getAll = asyncHandler(async (req, res) => {
    const filter = { school: req.schoolId };
    const { data, meta } = await new ApiFeatures(Model.find(filter).populate(populate), req.query, searchFields)
      .filter()
      .search()
      .sort()
      .paginate()
      .exec();
    sendSuccess(res, { data, meta });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, school: req.schoolId }).populate(populate);
    if (!doc) throw ApiError.notFound(`${resourceName} not found`);
    sendSuccess(res, { data: doc });
  });

  const updateOne = asyncHandler(async (req, res) => {
    disallowedFields.forEach((key) => delete req.body[key]);
    delete req.body.school;

    const doc = await Model.findOneAndUpdate({ _id: req.params.id, school: req.schoolId }, req.body, {
      new: true,
      runValidators: true,
    }).populate(populate);
    if (!doc) throw ApiError.notFound(`${resourceName} not found`);
    sendSuccess(res, { message: `${resourceName} updated`, data: doc });
  });

  const deleteOne = asyncHandler(async (req, res) => {
    const doc = await Model.findOneAndDelete({ _id: req.params.id, school: req.schoolId });
    if (!doc) throw ApiError.notFound(`${resourceName} not found`);
    sendSuccess(res, { message: `${resourceName} deleted` });
  });

  return { createOne, getAll, getOne, updateOne, deleteOne };
}

export default crudFactory;
