import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    logo: { type: String },
    website: { type: String },
    currentAcademicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    settings: {
      currency: { type: String, default: 'USD' },
      timezone: { type: String, default: 'UTC' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      gradingScale: { type: String, default: 'default' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('School', schoolSchema);
