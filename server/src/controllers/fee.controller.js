import mongoose from 'mongoose';
import FeeStructure from '../models/FeeStructure.model.js';
import Invoice from '../models/Invoice.model.js';
import Payment from '../models/Payment.model.js';
import Student from '../models/Student.model.js';
import School from '../models/School.model.js';
import Parent from '../models/Parent.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import crudFactory from '../utils/crudFactory.js';
import { generateInvoiceNumber, generateReceiptNumber } from '../services/idGenerator.service.js';
import { streamPdf, drawReceipt } from '../services/pdf.service.js';

// ---- Fee structures ----

const feeStructureBase = crudFactory(FeeStructure, {
  resourceName: 'Fee structure',
  populate: [{ path: 'class', select: 'name' }, { path: 'academicYear', select: 'name' }],
});

export const createFeeStructure = feeStructureBase.createOne;
export const listFeeStructures = feeStructureBase.getAll;
export const getFeeStructure = feeStructureBase.getOne;
export const updateFeeStructure = feeStructureBase.updateOne;
export const deleteFeeStructure = feeStructureBase.deleteOne;

// ---- Invoices ----

// Generates one invoice per active student in a class, based on that class's fee structure.
export const generateInvoicesForClass = asyncHandler(async (req, res) => {
  const { class: classId, academicYear, dueDate } = req.body;

  const structure = await FeeStructure.findOne({ class: classId, academicYear, school: req.schoolId });
  if (!structure) throw ApiError.notFound('No fee structure defined for this class/academic year');

  const students = await Student.find({ class: classId, school: req.schoolId, status: 'active' });
  if (!students.length) throw ApiError.badRequest('No active students found in this class');

  const items = structure.items.map((i) => ({ name: i.name, amount: i.amount }));

  const invoices = [];
  for (const student of students) {
    const exists = await Invoice.findOne({ student: student._id, academicYear, school: req.schoolId });
    if (exists) continue;

    const invoiceNumber = await generateInvoiceNumber(req.schoolId);
    invoices.push({
      school: req.schoolId,
      student: student._id,
      academicYear,
      invoiceNumber,
      items,
      totalAmount: structure.totalAmount,
      dueDate,
    });
  }

  const created = invoices.length ? await Invoice.insertMany(invoices) : [];
  sendSuccess(res, {
    statusCode: 201,
    message: `${created.length} invoice(s) generated (${students.length - created.length} already existed)`,
    data: created,
  });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId };

  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) throw ApiError.notFound('Student profile not found');
    filter.student = student._id;
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id });
    filter.student = { $in: parent?.children || [] };
  }

  const { data, meta } = await new ApiFeatures(
    Invoice.find(filter).populate('student', 'firstName lastName admissionNumber'),
    req.query,
    ['invoiceNumber']
  )
    .filter()
    .search()
    .sort()
    .paginate()
    .exec();

  sendSuccess(res, { data, meta });
});

export const listOverdueInvoices = asyncHandler(async (req, res) => {
  await Invoice.updateMany(
    { school: req.schoolId, dueDate: { $lt: new Date() }, status: { $in: ['pending', 'partial'] } },
    { status: 'overdue' }
  );
  const invoices = await Invoice.find({ school: req.schoolId, status: 'overdue' }).populate(
    'student',
    'firstName lastName admissionNumber'
  );
  sendSuccess(res, { data: invoices });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, school: req.schoolId }).populate(
    'student',
    'firstName lastName admissionNumber'
  );
  if (!invoice) throw ApiError.notFound('Invoice not found');
  sendSuccess(res, { data: invoice });
});

// ---- Payments ----

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, transactionRef, notes } = req.body;

  const invoice = await Invoice.findOne({ _id: req.params.invoiceId, school: req.schoolId });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  const balance = invoice.totalAmount - invoice.amountPaid;
  if (amount > balance) throw ApiError.badRequest(`Amount exceeds outstanding balance of ${balance.toFixed(2)}`);

  const receiptNumber = await generateReceiptNumber(req.schoolId);

  const session = await mongoose.startSession();
  let payment;
  try {
    await session.withTransaction(async () => {
      [payment] = await Payment.create(
        [
          {
            school: req.schoolId,
            invoice: invoice._id,
            student: invoice.student,
            receiptNumber,
            amount,
            method,
            transactionRef,
            notes,
            receivedBy: req.user._id,
          },
        ],
        { session }
      );

      invoice.amountPaid += amount;
      invoice.refreshStatus();
      await invoice.save({ session });
    });
  } finally {
    session.endSession();
  }

  sendSuccess(res, { statusCode: 201, message: 'Payment recorded', data: { payment, invoice } });
});

export const listPaymentsForInvoice = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ invoice: req.params.invoiceId, school: req.schoolId }).sort('-paidAt');
  sendSuccess(res, { data: payments });
});

export const downloadReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, school: req.schoolId });
  if (!payment) throw ApiError.notFound('Payment not found');

  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || student._id.toString() !== payment.student.toString()) {
      throw ApiError.forbidden('You may only view your own receipts');
    }
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id, children: payment.student });
    if (!parent) throw ApiError.forbidden('You may only view your own children\'s receipts');
  }

  const [invoice, student, school] = await Promise.all([
    Invoice.findById(payment.invoice),
    Student.findById(payment.student),
    School.findById(req.schoolId),
  ]);

  streamPdf(res, `${payment.receiptNumber}.pdf`, (doc) => drawReceipt(doc, { school, payment, invoice, student }));
});
