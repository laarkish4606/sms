import Counter from '../models/Counter.model.js';

/**
 * Atomically increments a per-school, per-scope counter and returns
 * a zero-padded sequence number. Used for human-readable IDs like
 * admission numbers, employee IDs, invoice/receipt numbers.
 */
async function nextSequence(scope, schoolId) {
  const key = `${scope}:${schoolId}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

function pad(num, size = 4) {
  return String(num).padStart(size, '0');
}

export async function generateStudentId(schoolId, year = new Date().getFullYear()) {
  const seq = await nextSequence(`student:${year}`, schoolId);
  return `STU-${year}-${pad(seq)}`;
}

export async function generateTeacherId(schoolId, year = new Date().getFullYear()) {
  const seq = await nextSequence(`teacher:${year}`, schoolId);
  return `EMP-${year}-${pad(seq)}`;
}

export async function generateInvoiceNumber(schoolId, year = new Date().getFullYear()) {
  const seq = await nextSequence(`invoice:${year}`, schoolId);
  return `INV-${year}-${pad(seq, 5)}`;
}

export async function generateReceiptNumber(schoolId, year = new Date().getFullYear()) {
  const seq = await nextSequence(`receipt:${year}`, schoolId);
  return `RCPT-${year}-${pad(seq, 5)}`;
}

export default {
  generateStudentId,
  generateTeacherId,
  generateInvoiceNumber,
  generateReceiptNumber,
};
