import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema(
  {
    bedNumber: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    allocatedAt: { type: Date },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    roomNumber: { type: String, required: true, trim: true },
    floor: { type: String, trim: true },
    capacity: { type: Number, required: true, default: 4 },
    beds: [bedSchema],
    feePerTerm: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });

roomSchema.virtual('occupied').get(function () {
  return this.beds.filter((b) => b.student).length;
});

roomSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Room', roomSchema);
