import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, trim: true },
    publisher: { type: String, trim: true },
    totalCopies: { type: Number, required: true, min: 0, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    rackNumber: { type: String, trim: true },
    coverImage: { type: String },
  },
  { timestamps: true }
);

bookSchema.index({ school: 1, isbn: 1 });
bookSchema.index({ title: 'text', author: 'text' });

export default mongoose.model('Book', bookSchema);
