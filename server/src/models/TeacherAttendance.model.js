import mongoose from 'mongoose';

const teacherAttendanceSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'on_leave'], required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    remarks: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

export default mongoose.model('TeacherAttendance', teacherAttendanceSchema);
