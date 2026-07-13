import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true },
    isAbsent: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

markSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });

export default mongoose.model('Mark', markSchema);
