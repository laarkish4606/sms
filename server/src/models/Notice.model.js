import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    audience: {
      type: String,
      enum: ['all', 'teachers', 'students', 'parents', 'accountants', 'class'],
      default: 'all',
    },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // when audience === 'class'
    attachments: [{ type: String }],
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    sendEmail: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

noticeSchema.index({ school: 1, audience: 1, publishDate: -1 });

export default mongoose.model('Notice', noticeSchema);
