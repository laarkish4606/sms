import Notice from '../models/Notice.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Parent from '../models/Parent.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { sendEmail } from '../config/mailer.js';

const ROLE_FOR_AUDIENCE = {
  teachers: 'teacher',
  students: 'student',
  parents: 'parent',
  accountants: 'accountant',
};

// ---- Notices ----

export const createNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.create({ ...req.body, school: req.schoolId, createdBy: req.user._id });

  if (notice.sendEmail) {
    const filter = { school: req.schoolId, isActive: true };
    if (notice.audience !== 'all') {
      const role = ROLE_FOR_AUDIENCE[notice.audience];
      if (role) filter.role = role;
    }
    const recipients = await User.find(filter).select('email firstName');
    // Fire-and-forget so notice creation doesn't block on SMTP latency.
    Promise.all(
      recipients.map((r) =>
        sendEmail({
          to: r.email,
          subject: `Notice: ${notice.title}`,
          html: `<p>Hello ${r.firstName},</p><p>${notice.content}</p>`,
        }).catch(() => null)
      )
    );
  }

  sendSuccess(res, { statusCode: 201, message: 'Notice published', data: notice });
});

export const listNotices = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId, publishDate: { $lte: new Date() } };

  const roleAudience = Object.entries(ROLE_FOR_AUDIENCE).find(([, role]) => role === req.user.role)?.[0];
  if (req.user.role !== 'school_admin') {
    filter.$or = [{ audience: 'all' }, ...(roleAudience ? [{ audience: roleAudience }] : [])];
  }

  const { data, meta } = await new ApiFeatures(
    Notice.find(filter).sort('-publishDate'),
    req.query,
    ['title']
  )
    .filter()
    .search()
    .paginate()
    .exec();

  sendSuccess(res, { data, meta });
});

export const getNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOne({ _id: req.params.id, school: req.schoolId });
  if (!notice) throw ApiError.notFound('Notice not found');
  sendSuccess(res, { data: notice });
});

export const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndUpdate({ _id: req.params.id, school: req.schoolId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!notice) throw ApiError.notFound('Notice not found');
  sendSuccess(res, { message: 'Notice updated', data: notice });
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndDelete({ _id: req.params.id, school: req.schoolId });
  if (!notice) throw ApiError.notFound('Notice not found');
  sendSuccess(res, { message: 'Notice deleted' });
});

// ---- Direct messaging ----

async function assertRecipientAllowed(req, recipientId) {
  const recipient = await User.findOne({ _id: recipientId, school: req.schoolId });
  if (!recipient) throw ApiError.badRequest('Recipient not found in your school');

  if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ user: req.user._id }).populate('children');
    const childTeacherIds = new Set();
    for (const child of parent?.children || []) {
      const student = await Student.findById(child._id).populate('section');
      if (student?.section?.classTeacher) childTeacherIds.add(student.section.classTeacher.toString());
    }
    if (recipient.role !== 'school_admin' && !childTeacherIds.has(recipientId)) {
      throw ApiError.forbidden('Parents may only message school admins or their children\'s class teachers');
    }
  }
  return recipient;
}

export const sendMessage = asyncHandler(async (req, res) => {
  const { recipient, subject, body } = req.body;
  await assertRecipientAllowed(req, recipient);

  const message = await Message.create({
    school: req.schoolId,
    sender: req.user._id,
    recipient,
    subject,
    body,
  });

  sendSuccess(res, { statusCode: 201, message: 'Message sent', data: message });
});

export const getInbox = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId, recipient: req.user._id };
  const { data, meta } = await new ApiFeatures(
    Message.find(filter).populate('sender', 'firstName lastName role').sort('-createdAt'),
    req.query,
    []
  )
    .filter()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const getSent = asyncHandler(async (req, res) => {
  const filter = { school: req.schoolId, sender: req.user._id };
  const { data, meta } = await new ApiFeatures(
    Message.find(filter).populate('recipient', 'firstName lastName role').sort('-createdAt'),
    req.query,
    []
  )
    .filter()
    .paginate()
    .exec();
  sendSuccess(res, { data, meta });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!message) throw ApiError.notFound('Message not found');
  sendSuccess(res, { data: message });
});
