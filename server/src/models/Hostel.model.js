import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['boys', 'girls', 'mixed'], default: 'mixed' },
    warden: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Hostel', hostelSchema);
