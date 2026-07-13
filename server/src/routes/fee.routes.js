import { Router } from 'express';
import * as controller from '../controllers/fee.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  feeStructureValidator,
  generateInvoicesValidator,
  recordPaymentValidator,
} from '../validators/fee.validator.js';

const router = Router();
router.use(protect);

router
  .route('/structures')
  .get(authorize('school_admin', 'accountant'), controller.listFeeStructures)
  .post(authorize('school_admin'), feeStructureValidator, validate, controller.createFeeStructure);
router
  .route('/structures/:id')
  .get(authorize('school_admin', 'accountant'), controller.getFeeStructure)
  .patch(authorize('school_admin'), controller.updateFeeStructure)
  .delete(authorize('school_admin'), controller.deleteFeeStructure);

router.post(
  '/invoices/generate',
  authorize('school_admin', 'accountant'),
  generateInvoicesValidator,
  validate,
  controller.generateInvoicesForClass
);
router.get('/invoices', authorize('school_admin', 'accountant', 'student', 'parent'), controller.listInvoices);
router.get('/invoices/overdue', authorize('school_admin', 'accountant'), controller.listOverdueInvoices);
router.get('/invoices/:id', authorize('school_admin', 'accountant', 'student', 'parent'), controller.getInvoice);

router.post(
  '/invoices/:invoiceId/payments',
  authorize('school_admin', 'accountant'),
  recordPaymentValidator,
  validate,
  controller.recordPayment
);
router.get(
  '/invoices/:invoiceId/payments',
  authorize('school_admin', 'accountant'),
  controller.listPaymentsForInvoice
);
router.get('/payments/:paymentId/receipt', authorize('school_admin', 'accountant', 'student', 'parent'), controller.downloadReceipt);

export default router;
