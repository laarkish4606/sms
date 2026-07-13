import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/transport.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const vehicleValidator = [
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];
const routeValidator = [body('name').trim().notEmpty().withMessage('Route name is required')];
const allocateValidator = [body('routeId').isMongoId().withMessage('Valid routeId is required')];

router
  .route('/vehicles')
  .get(authorize('school_admin'), controller.listVehicles)
  .post(authorize('school_admin'), vehicleValidator, validate, controller.createVehicle);
router
  .route('/vehicles/:id')
  .get(authorize('school_admin'), controller.getVehicle)
  .patch(authorize('school_admin'), controller.updateVehicle)
  .delete(authorize('school_admin'), controller.deleteVehicle);

router
  .route('/routes')
  .get(controller.listRoutes)
  .post(authorize('school_admin'), routeValidator, validate, controller.createRoute);
router
  .route('/routes/:id')
  .get(controller.getRoute)
  .patch(authorize('school_admin'), controller.updateRoute)
  .delete(authorize('school_admin'), controller.deleteRoute);
router.get('/routes/:routeId/students', authorize('school_admin'), controller.listStudentsOnRoute);

router.put(
  '/students/:studentId/allocation',
  authorize('school_admin'),
  allocateValidator,
  validate,
  controller.allocateStudentToRoute
);
router.delete('/students/:studentId/allocation', authorize('school_admin'), controller.removeStudentFromRoute);

export default router;
