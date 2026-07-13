import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "A"
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    room: { type: String, trim: true },
    capacity: { type: Number, default: 40 },
  },
  { timestamps: true }
);

sectionSchema.index({ class: 1, name: 1 }, { unique: true });
sectionSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'section',
  count: true,
});
sectionSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Section', sectionSchema);
