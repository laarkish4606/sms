import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ['theory', 'practical', 'both'], default: 'theory' },
    isElective: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subjectSchema.index({ school: 1, code: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
