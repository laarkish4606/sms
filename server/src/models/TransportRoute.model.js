import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    time: { type: String }, // "07:30"
    fare: { type: Number, default: 0 },
  },
  { _id: true }
);

const transportRouteSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    stops: [stopSchema],
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    driverLicenseNumber: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('TransportRoute', transportRouteSchema);
