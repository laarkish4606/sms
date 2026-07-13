import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sunday
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "09:45"
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    room: { type: String, trim: true },
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    periods: [periodSchema],
  },
  { timestamps: true }
);

timetableSchema.index({ section: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('Timetable', timetableSchema);
