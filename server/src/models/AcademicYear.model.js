import mongoose from 'mongoose';

const termSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: true }
);

const academicYearSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "2025-2026"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    terms: [termSchema], // semesters
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

academicYearSchema.index({ school: 1, name: 1 }, { unique: true });

export default mongoose.model('AcademicYear', academicYearSchema);
