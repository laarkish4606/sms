import mongoose from 'mongoose';

const guardianSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relation: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false }
);

const academicHistorySchema = new mongoose.Schema(
  {
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    result: { type: String, enum: ['PASS', 'FAIL', 'PROMOTED', 'RETAINED', 'ONGOING'], default: 'ONGOING' },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Denormalized from User so list/search/sort endpoints avoid a $lookup per request.
    // Kept in sync in the student controller whenever the underlying User name changes.
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    admissionNumber: { type: String, required: true, unique: true },
    admissionDate: { type: Date, default: Date.now },

    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    rollNumber: { type: String, trim: true },

    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bloodGroup: { type: String, trim: true },
    religion: { type: String, trim: true },
    nationality: { type: String, trim: true },
    address: { type: String, trim: true },

    photo: { type: String },

    guardians: [guardianSchema],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],

    emergencyContact: { name: String, phone: String },

    academicHistory: [academicHistorySchema],

    transport: {
      route: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
      pickupPoint: { type: String, trim: true },
    },
    hostel: {
      room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
      allocatedAt: { type: Date },
    },

    status: { type: String, enum: ['active', 'inactive', 'graduated', 'transferred', 'expelled'], default: 'active' },
  },
  { timestamps: true }
);

studentSchema.index({ school: 1, class: 1, section: 1 });
studentSchema.index({ firstName: 'text', lastName: 'text', admissionNumber: 'text' });

studentSchema.virtual('profile', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model('Student', studentSchema);
