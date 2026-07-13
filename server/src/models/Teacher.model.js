import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema(
  {
    basic: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Denormalized from User for fast search/sort without a $lookup per request.
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    employeeId: { type: String, required: true, unique: true },
    joiningDate: { type: Date, default: Date.now },

    designation: { type: String, trim: true }, // e.g. "Senior Teacher"
    department: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },

    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
    isClassTeacherOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },

    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: { type: String, trim: true },
    photo: { type: String },

    salary: salarySchema,

    status: { type: String, enum: ['active', 'inactive', 'on_leave', 'terminated'], default: 'active' },
  },
  { timestamps: true }
);

teacherSchema.index({ school: 1, department: 1 });
teacherSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text' });

export default mongoose.model('Teacher', teacherSchema);
