import mongoose from 'mongoose';

const examSubjectSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date },
    maxMarks: { type: Number, required: true, default: 100 },
    passMarks: { type: Number, required: true, default: 33 },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    name: { type: String, required: true, trim: true }, // e.g. "Mid-Term Exam"
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjects: [examSubjectSchema],
    startDate: { type: Date },
    endDate: { type: Date },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

examSchema.index({ school: 1, academicYear: 1, class: 1 });

export default mongoose.model('Exam', examSchema);
