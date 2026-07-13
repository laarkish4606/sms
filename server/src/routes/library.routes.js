import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/library.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();
router.use(protect);

const bookValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('totalCopies must be a positive integer'),
];

const issueValidator = [
  body('bookId').isMongoId().withMessage('Valid bookId is required'),
  body('borrowerType').isIn(['Student', 'Teacher']).withMessage('borrowerType must be Student or Teacher'),
  body('borrowerId').isMongoId().withMessage('Valid borrowerId is required'),
];

router
  .route('/books')
  .get(controller.listBooks)
  .post(authorize('school_admin'), bookValidator, validate, controller.createBook);
router
  .route('/books/:id')
  .get(controller.getBook)
  .patch(authorize('school_admin'), controller.updateBook)
  .delete(authorize('school_admin'), controller.deleteBook);

router.post('/issues', authorize('school_admin'), issueValidator, validate, controller.issueBook);
router.patch('/issues/:id/return', authorize('school_admin'), controller.returnBook);
router.get('/issues', authorize('school_admin', 'teacher'), controller.listIssues);

export default router;
