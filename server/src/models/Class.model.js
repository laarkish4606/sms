import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    name: { type: String, required: true, trim: true }, // e.g. "Grade 10"
    numericOrder: { type: Number, required: true }, // for sorting/promotion (10, 11, ...)
    subjects: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
      },
    ],
  },
  { timestamps: true }
);

classSchema.index({ school: 1, academicYear: 1, name: 1 }, { unique: true });

export default mongoose.model('Class', classSchema);
