import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    items: [invoiceItemSchema],
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

invoiceSchema.virtual('balance').get(function () {
  return Math.max(this.totalAmount - this.amountPaid, 0);
});

invoiceSchema.methods.refreshStatus = function refreshStatus() {
  if (this.amountPaid <= 0) {
    this.status = this.dueDate < new Date() ? 'overdue' : 'pending';
  } else if (this.amountPaid < this.totalAmount) {
    this.status = 'partial';
  } else {
    this.status = 'paid';
  }
};

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.index({ school: 1, student: 1, academicYear: 1 });

export default mongoose.model('Invoice', invoiceSchema);
