import Hostel from '../models/Hostel.model.js';
import Room from '../models/Room.model.js';
import Student from '../models/Student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import crudFactory from '../utils/crudFactory.js';

const hostelBase = crudFactory(Hostel, {
  resourceName: 'Hostel',
  populate: [{ path: 'warden', select: 'firstName lastName' }],
  searchFields: ['name'],
});
export const createHostel = hostelBase.createOne;
export const listHostels = hostelBase.getAll;
export const getHostel = hostelBase.getOne;
export const updateHostel = hostelBase.updateOne;
export const deleteHostel = hostelBase.deleteOne;

const roomBase = crudFactory(Room, {
  resourceName: 'Room',
  populate: [{ path: 'hostel', select: 'name type' }, { path: 'beds.student', select: 'firstName lastName admissionNumber' }],
});

export const createRoom = asyncHandler(async (req, res) => {
  const { capacity } = req.body;
  req.body.beds = Array.from({ length: capacity }, (_, i) => ({ bedNumber: String(i + 1) }));
  return roomBase.createOne(req, res);
});
export const listRooms = roomBase.getAll;
export const getRoom = roomBase.getOne;
export const updateRoom = roomBase.updateOne;
export const deleteRoom = roomBase.deleteOne;

export const allocateBed = asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  const room = await Room.findOne({ _id: req.params.roomId, school: req.schoolId });
  if (!room) throw ApiError.notFound('Room not found');

  const freeBed = room.beds.find((b) => !b.student);
  if (!freeBed) throw ApiError.badRequest('No free beds in this room');

  const student = await Student.findOne({ _id: studentId, school: req.schoolId });
  if (!student) throw ApiError.notFound('Student not found');

  freeBed.student = studentId;
  freeBed.allocatedAt = new Date();
  await room.save();

  student.hostel = { room: room._id, allocatedAt: new Date() };
  await student.save();

  sendSuccess(res, { message: 'Bed allocated', data: room });
});

export const vacateBed = asyncHandler(async (req, res) => {
  const { bedId } = req.params;
  const room = await Room.findOne({ _id: req.params.roomId, school: req.schoolId });
  if (!room) throw ApiError.notFound('Room not found');

  const bed = room.beds.id(bedId);
  if (!bed) throw ApiError.notFound('Bed not found');

  if (bed.student) {
    await Student.findByIdAndUpdate(bed.student, { hostel: { room: null, allocatedAt: null } });
  }
  bed.student = null;
  bed.allocatedAt = null;
  await room.save();

  sendSuccess(res, { message: 'Bed vacated', data: room });
});
