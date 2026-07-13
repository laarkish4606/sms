import Subject from '../models/Subject.model.js';
import crudFactory from '../utils/crudFactory.js';

const base = crudFactory(Subject, { resourceName: 'Subject', searchFields: ['name', 'code'] });

export const createSubject = base.createOne;
export const listSubjects = base.getAll;
export const getSubject = base.getOne;
export const updateSubject = base.updateOne;
export const deleteSubject = base.deleteOne;
