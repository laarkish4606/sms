import mongoose from 'mongoose';

const feeItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Tuition", "Transport"
    amount: { type: Number, required: true, min: 0 },
    frequency: { type: String, enum: ['one_time', 'monthly', 'quarterly', 'term', 'annual'], default: 'term' },
  },
  { _id: true }
);

const feeStructureSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    items: [feeItemSchema],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

feeStructureSchema.index({ school: 1, academicYear: 1, class: 1 }, { unique: true });

feeStructureSchema.pre('save', function computeTotal(next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);
  next();
});

export default mongoose.model('FeeStructure', feeStructureSchema);
