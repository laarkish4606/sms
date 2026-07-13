import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/hostel.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect, authorize('school_admin'));

const hostelValidator = [body('name').trim().notEmpty().withMessage('Hostel name is required')];
const roomValidator = [
  body('hostel').isMongoId().withMessage('Valid hostel is required'),
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];
const allocateValidator = [body('studentId').isMongoId().withMessage('Valid studentId is required')];

router.route('/hostels').get(controller.listHostels).post(hostelValidator, validate, controller.createHostel);
router
  .route('/hostels/:id')
  .get(controller.getHostel)
  .patch(controller.updateHostel)
  .delete(controller.deleteHostel);

router.route('/rooms').get(controller.listRooms).post(roomValidator, validate, controller.createRoom);
router.route('/rooms/:id').get(controller.getRoom).patch(controller.updateRoom).delete(controller.deleteRoom);

router.post('/rooms/:roomId/allocate', allocateValidator, validate, controller.allocateBed);
router.patch('/rooms/:roomId/beds/:bedId/vacate', controller.vacateBed);

export default router;
