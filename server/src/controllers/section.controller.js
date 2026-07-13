import Section from '../models/Section.model.js';
import crudFactory from '../utils/crudFactory.js';

const POPULATE = [
  { path: 'class', select: 'name numericOrder' },
  { path: 'classTeacher', select: 'firstName lastName employeeId' },
];

const base = crudFactory(Section, { resourceName: 'Section', populate: POPULATE });

export const createSection = base.createOne;
export const listSections = base.getAll;
export const getSection = base.getOne;
export const updateSection = base.updateOne;
export const deleteSection = base.deleteOne;
