import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/communication.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const noticeValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('audience')
    .optional()
    .isIn(['all', 'teachers', 'students', 'parents', 'accountants', 'class'])
    .withMessage('Invalid audience'),
];
const messageValidator = [
  body('recipient').isMongoId().withMessage('Valid recipient is required'),
  body('body').trim().notEmpty().withMessage('Message body is required'),
];

router
  .route('/notices')
  .get(controller.listNotices)
  .post(authorize('school_admin', 'teacher'), noticeValidator, validate, controller.createNotice);
router
  .route('/notices/:id')
  .get(controller.getNotice)
  .patch(authorize('school_admin', 'teacher'), controller.updateNotice)
  .delete(authorize('school_admin'), controller.deleteNotice);

router.post('/messages', messageValidator, validate, controller.sendMessage);
router.get('/messages/inbox', controller.getInbox);
router.get('/messages/sent', controller.getSent);
router.patch('/messages/:id/read', controller.markMessageRead);

export default router;
