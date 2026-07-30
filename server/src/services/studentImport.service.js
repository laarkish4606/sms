import ExcelJS from 'exceljs';
import Class from '../models/Class.model.js';
import Section from '../models/Section.model.js';
import Student from '../models/Student.model.js';
import User from '../models/User.model.js';

export const IMPORT_COLUMNS = [
  { header: 'Admission Number (leave blank for new)', key: 'admissionNumber', width: 30 },
  { header: 'First Name*', key: 'firstName', width: 18 },
  { header: 'Last Name*', key: 'lastName', width: 18 },
  { header: 'Email*', key: 'email', width: 26 },
  { header: 'Date of Birth* (YYYY-MM-DD)', key: 'dob', width: 22 },
  { header: 'Gender* (male/female/other)', key: 'gender', width: 22 },
  { header: 'Class*', key: 'class', width: 18 },
  { header: 'Section*', key: 'section', width: 14 },
  { header: 'Roll Number', key: 'rollNumber', width: 14 },
  { header: 'Phone', key: 'phone', width: 16 },
  { header: 'Blood Group', key: 'bloodGroup', width: 12 },
  { header: 'Religion', key: 'religion', width: 14 },
  { header: 'Nationality', key: 'nationality', width: 14 },
  { header: 'Address', key: 'address', width: 28 },
  { header: 'Guardian Name', key: 'guardianName', width: 20 },
  { header: 'Guardian Relation', key: 'guardianRelation', width: 16 },
  { header: 'Guardian Phone', key: 'guardianPhone', width: 16 },
  { header: 'Guardian Email', key: 'guardianEmail', width: 24 },
];

export async function buildImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  sheet.columns = IMPORT_COLUMNS;
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({
    admissionNumber: '',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    dob: '2012-05-14',
    gender: 'female',
    class: 'Grade 1',
    section: 'A',
    rollNumber: '12',
    phone: '',
    bloodGroup: '',
    religion: '',
    nationality: '',
    address: '',
    guardianName: 'John Doe',
    guardianRelation: 'Father',
    guardianPhone: '555-0100',
    guardianEmail: '',
  });
  return workbook;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const GENDERS = ['male', 'female', 'other'];

function cellText(cell) {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object' && cell.text !== undefined) return String(cell.text).trim();
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell).trim();
}

/**
 * Parses and validates an uploaded workbook against the given school +
 * academic year. Read-only — makes no database writes. Class/section names
 * are resolved to IDs so the commit step doesn't need to re-resolve them.
 */
export async function parseAndValidateImport(buffer, { schoolId, academicYearId }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The uploaded file has no worksheets');

  const headerRow = sheet.getRow(1);
  const keyByColumn = {};
  headerRow.eachCell((cell, colNumber) => {
    const header = cellText(cell.value);
    const match = IMPORT_COLUMNS.find((c) => header.startsWith(c.header.split(' (')[0].replace('*', '')));
    if (match) keyByColumn[colNumber] = match.key;
  });

  const classes = await Class.find({ school: schoolId, academicYear: academicYearId }).lean();
  const sections = await Section.find({ class: { $in: classes.map((c) => c._id) } }).lean();
  const classByName = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c]));

  const existingStudents = await Student.find({ school: schoolId }).select('admissionNumber').lean();
  const existingAdmissionNumbers = new Set(existingStudents.map((s) => s.admissionNumber));
  const existingUsers = await User.find({ school: schoolId }).select('email').lean();
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  const rows = [];
  const seenAdmissionNumbers = new Set();
  const seenEmails = new Set();

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0 || row.values.every((v) => v === null || v === undefined || v === '')) continue;

    const data = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = keyByColumn[colNumber];
      if (key) data[key] = cellText(cell.value);
    });

    const errors = [];
    const admissionNumber = data.admissionNumber || '';
    const isUpdate = admissionNumber && existingAdmissionNumbers.has(admissionNumber);

    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');
    if (!data.dob || Number.isNaN(Date.parse(data.dob))) errors.push('Valid date of birth is required (YYYY-MM-DD)');

    const gender = (data.gender || '').toLowerCase();
    if (!GENDERS.includes(gender)) errors.push('Gender must be male, female, or other');

    if (!isUpdate) {
      if (!data.email) errors.push('Email is required for new students');
      else if (!EMAIL_RE.test(data.email)) errors.push('Invalid email format');
    } else if (data.email && !EMAIL_RE.test(data.email)) {
      errors.push('Invalid email format');
    }

    let resolvedClass = null;
    let resolvedSection = null;
    if (!data.class) {
      errors.push('Class is required');
    } else {
      resolvedClass = classByName.get(data.class.trim().toLowerCase());
      if (!resolvedClass) errors.push(`Class "${data.class}" was not found for the selected academic year`);
    }
    if (!data.section) {
      errors.push('Section is required');
    } else if (resolvedClass) {
      resolvedSection = sections.find(
        (s) => s.class.toString() === resolvedClass._id.toString() && s.name.trim().toLowerCase() === data.section.trim().toLowerCase()
      );
      if (!resolvedSection) errors.push(`Section "${data.section}" was not found in class "${data.class}"`);
    }

    let duplicate = false;
    if (admissionNumber) {
      if (seenAdmissionNumbers.has(admissionNumber)) {
        duplicate = true;
        errors.push('Duplicate admission number within this file');
      }
      seenAdmissionNumbers.add(admissionNumber);
    }
    if (data.email) {
      const emailLower = data.email.toLowerCase();
      if (seenEmails.has(emailLower)) {
        duplicate = true;
        errors.push('Duplicate email within this file');
      }
      seenEmails.add(emailLower);
      if (!isUpdate && existingEmails.has(emailLower)) {
        duplicate = true;
        errors.push('A user with this email already exists');
      }
    }

    rows.push({
      rowNumber,
      data: { ...data, gender },
      resolvedClassId: resolvedClass?._id || null,
      resolvedSectionId: resolvedSection?._id || null,
      status: errors.length ? 'error' : duplicate ? 'duplicate' : isUpdate ? 'update' : 'new',
      errors,
    });
  }

  const summary = rows.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] += 1;
      return acc;
    },
    { total: 0, new: 0, update: 0, error: 0, duplicate: 0 }
  );

  return { rows, summary };
}

export default { IMPORT_COLUMNS, buildImportTemplate, parseAndValidateImport };
