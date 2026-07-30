import Student from '../models/Student.model.js';
import Class from '../models/Class.model.js';
import Section from '../models/Section.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';

const RESULT_BY_ACTION = {
  promote: 'PROMOTED',
  repeat: 'RETAINED',
  transfer: 'TRANSFERRED',
  graduate: 'GRADUATED',
  withdraw: 'WITHDRAWN',
};

const STATUS_BY_ACTION = {
  transfer: 'transferred',
  graduate: 'graduated',
  withdraw: 'inactive',
};

// Groups active students currently in fromAcademicYear's classes, and for
// each one suggests where they land in toAcademicYear: the class one grade
// up (matched by numericOrder + 1), same-named section if one exists there,
// or "graduate" when no higher grade exists in the new year (e.g. final grade).
export const getPromotionPreview = asyncHandler(async (req, res) => {
  const { fromAcademicYear, toAcademicYear } = req.query;
  if (!fromAcademicYear || !toAcademicYear) {
    throw ApiError.badRequest('fromAcademicYear and toAcademicYear are required');
  }
  if (fromAcademicYear === toAcademicYear) {
    throw ApiError.badRequest('fromAcademicYear and toAcademicYear must differ');
  }

  const [fromClasses, toClasses] = await Promise.all([
    Class.find({ school: req.schoolId, academicYear: fromAcademicYear }).sort('numericOrder').lean(),
    Class.find({ school: req.schoolId, academicYear: toAcademicYear }).sort('numericOrder').lean(),
  ]);
  if (!fromClasses.length) throw ApiError.badRequest('The source academic year has no classes');

  const toClassByOrder = new Map(toClasses.map((c) => [c.numericOrder, c]));
  const toSections = await Section.find({ class: { $in: toClasses.map((c) => c._id) } }).lean();
  const toSectionsByClass = new Map();
  toSections.forEach((s) => {
    const key = s.class.toString();
    if (!toSectionsByClass.has(key)) toSectionsByClass.set(key, []);
    toSectionsByClass.get(key).push(s);
  });

  const students = await Student.find({
    school: req.schoolId,
    status: 'active',
    class: { $in: fromClasses.map((c) => c._id) },
  })
    .populate('class', 'name numericOrder')
    .populate('section', 'name')
    .sort('rollNumber firstName')
    .lean();

  const fromSections = await Section.find({ class: { $in: fromClasses.map((c) => c._id) } }).lean();
  const sectionNameById = new Map(fromSections.map((s) => [s._id.toString(), s.name]));

  const classGroups = new Map();
  let alreadyProcessed = 0;

  students.forEach((student) => {
    const nextClass = toClassByOrder.get(student.class.numericOrder + 1) || null;
    let suggestedAction = 'graduate';
    let suggestedNextClassId = null;
    let suggestedNextSectionId = null;

    if (nextClass) {
      suggestedAction = 'promote';
      suggestedNextClassId = nextClass._id;
      const candidateSections = toSectionsByClass.get(nextClass._id.toString()) || [];
      const sameName = candidateSections.find(
        (s) => s.name.trim().toLowerCase() === (student.section?.name || '').trim().toLowerCase()
      );
      suggestedNextSectionId = (sameName || candidateSections[0])?._id || null;
    }

    const isProcessed = student.lastPromotedAcademicYear?.toString() === fromAcademicYear;
    if (isProcessed) alreadyProcessed += 1;

    const classKey = student.class._id.toString();
    if (!classGroups.has(classKey)) {
      classGroups.set(classKey, { classId: student.class._id, className: student.class.name, sections: new Map() });
    }
    const group = classGroups.get(classKey);
    const sectionKey = student.section?._id.toString() || 'none';
    if (!group.sections.has(sectionKey)) {
      group.sections.set(sectionKey, {
        sectionId: student.section?._id || null,
        sectionName: student.section?.name || sectionNameById.get(sectionKey) || 'Unassigned',
        students: [],
      });
    }
    group.sections.get(sectionKey).students.push({
      _id: student._id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      currentClass: student.class,
      currentSection: student.section,
      suggestedAction,
      suggestedNextClassId,
      suggestedNextSectionId,
      alreadyProcessed: isProcessed,
    });
  });

  const classes = Array.from(classGroups.values()).map((g) => ({
    classId: g.classId,
    className: g.className,
    sections: Array.from(g.sections.values()),
  }));

  sendSuccess(res, {
    data: {
      classes,
      toClasses: toClasses.map((c) => ({ _id: c._id, name: c.name, numericOrder: c.numericOrder })),
      toSections: toSections.map((s) => ({ _id: s._id, class: s.class, name: s.name })),
      summary: { totalStudents: students.length, alreadyProcessed },
    },
  });
});

export const commitPromotion = asyncHandler(async (req, res) => {
  const { fromAcademicYear, toAcademicYear, decisions } = req.body;
  if (!fromAcademicYear || !toAcademicYear) {
    throw ApiError.badRequest('fromAcademicYear and toAcademicYear are required');
  }
  if (!Array.isArray(decisions) || !decisions.length) throw ApiError.badRequest('No decisions to apply');

  const studentIds = decisions.map((d) => d.studentId);
  const students = await Student.find({ _id: { $in: studentIds }, school: req.schoolId }).select(
    'class section lastPromotedAcademicYear'
  );
  const studentById = new Map(students.map((s) => [s._id.toString(), s]));

  const summary = { promoted: 0, repeating: 0, transferred: 0, graduated: 0, withdrawn: 0, skippedDuplicate: 0, failed: 0 };
  const ops = [];

  for (const decision of decisions) {
    const student = studentById.get(decision.studentId);
    if (!student) {
      summary.failed += 1;
      continue;
    }
    if (student.lastPromotedAcademicYear?.toString() === fromAcademicYear) {
      summary.skippedDuplicate += 1;
      continue;
    }

    const action = decision.action;
    if (!RESULT_BY_ACTION[action]) {
      summary.failed += 1;
      continue;
    }
    if ((action === 'promote' || action === 'repeat') && (!decision.toClass || !decision.toSection)) {
      summary.failed += 1;
      continue;
    }

    const historyEntry = {
      academicYear: fromAcademicYear,
      class: student.class,
      section: student.section,
      result: RESULT_BY_ACTION[action],
    };

    const set = { lastPromotedAcademicYear: fromAcademicYear };
    if (action === 'promote' || action === 'repeat') {
      set.class = decision.toClass;
      set.section = decision.toSection;
    }
    if (STATUS_BY_ACTION[action]) set.status = STATUS_BY_ACTION[action];

    ops.push({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: set, $push: { academicHistory: historyEntry } },
      },
    });

    if (action === 'promote') summary.promoted += 1;
    else if (action === 'repeat') summary.repeating += 1;
    else if (action === 'transfer') summary.transferred += 1;
    else if (action === 'graduate') summary.graduated += 1;
    else if (action === 'withdraw') summary.withdrawn += 1;
  }

  if (ops.length) await Student.bulkWrite(ops);

  sendSuccess(res, {
    message: `Promotion applied — ${summary.promoted} promoted, ${summary.repeating} repeating, ${summary.transferred} transferred, ${summary.graduated} graduated, ${summary.withdrawn} withdrawn`,
    data: { total: decisions.length, ...summary },
  });
});

export default { getPromotionPreview, commitPromotion };
