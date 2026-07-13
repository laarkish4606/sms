import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    vehicleNumber: { type: String, required: true, unique: true, trim: true },
    model: { type: String, trim: true },
    capacity: { type: Number, required: true },
    insuranceExpiry: { type: Date },
    fitnessExpiry: { type: Date },
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
