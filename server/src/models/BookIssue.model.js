import mongoose from 'mongoose';

const bookIssueSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    borrowerType: { type: String, enum: ['Student', 'Teacher'], required: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'borrowerType' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: { type: String, enum: ['issued', 'returned', 'overdue', 'lost'], default: 'issued' },
    fineAmount: { type: Number, default: 0 },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

bookIssueSchema.index({ borrower: 1, status: 1 });

export default mongoose.model('BookIssue', bookIssueSchema);
