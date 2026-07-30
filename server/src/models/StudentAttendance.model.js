import mongoose from 'mongoose';

const studentAttendanceSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'excused'], required: true },
    remarks: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

studentAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
studentAttendanceSchema.index({ section: 1, date: 1 });
// School-wide "today's attendance" dashboard counts, and the attendance
// report's class-only (no section) filter path.
studentAttendanceSchema.index({ school: 1, date: 1 });
studentAttendanceSchema.index({ school: 1, class: 1, date: 1 });

export default mongoose.model('StudentAttendance', studentAttendanceSchema);
