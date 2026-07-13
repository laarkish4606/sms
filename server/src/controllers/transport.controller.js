import TransportRoute from '../models/TransportRoute.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Student from '../models/Student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import crudFactory from '../utils/crudFactory.js';

const vehicleBase = crudFactory(Vehicle, { resourceName: 'Vehicle', searchFields: ['vehicleNumber', 'model'] });
export const createVehicle = vehicleBase.createOne;
export const listVehicles = vehicleBase.getAll;
export const getVehicle = vehicleBase.getOne;
export const updateVehicle = vehicleBase.updateOne;
export const deleteVehicle = vehicleBase.deleteOne;

const routeBase = crudFactory(TransportRoute, {
  resourceName: 'Transport route',
  populate: [{ path: 'vehicle', select: 'vehicleNumber model capacity' }],
  searchFields: ['name'],
});
export const createRoute = routeBase.createOne;
export const listRoutes = routeBase.getAll;
export const getRoute = routeBase.getOne;
export const updateRoute = routeBase.updateOne;
export const deleteRoute = routeBase.deleteOne;

export const allocateStudentToRoute = asyncHandler(async (req, res) => {
  const { routeId, pickupPoint } = req.body;

  const route = await TransportRoute.findOne({ _id: routeId, school: req.schoolId });
  if (!route) throw ApiError.notFound('Transport route not found');

  const student = await Student.findOneAndUpdate(
    { _id: req.params.studentId, school: req.schoolId },
    { transport: { route: routeId, pickupPoint } },
    { new: true }
  ).populate('transport.route', 'name');
  if (!student) throw ApiError.notFound('Student not found');

  sendSuccess(res, { message: 'Student allocated to route', data: student.transport });
});

export const removeStudentFromRoute = asyncHandler(async (req, res) => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.studentId, school: req.schoolId },
    { transport: { route: null, pickupPoint: null } },
    { new: true }
  );
  if (!student) throw ApiError.notFound('Student not found');
  sendSuccess(res, { message: 'Student removed from route' });
});

export const listStudentsOnRoute = asyncHandler(async (req, res) => {
  const students = await Student.find({ 'transport.route': req.params.routeId, school: req.schoolId }).select(
    'firstName lastName admissionNumber transport.pickupPoint'
  );
  sendSuccess(res, { data: students });
});
