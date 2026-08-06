import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import Spinner from '../../components/Spinner.jsx';

const CATEGORIES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
  { value: 'practical', label: 'Practical' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  name: '',
  academicYear: '',
  class: '',
  startDate: '',
  endDate: '',
  category: 'final',
  weight: 100,
  subjects: [],
};

export default function ExamForm({ onSubmit, isSubmitting, academicYears, classes, subjects }) {
  const [values, setValues] = useState(EMPTY_FORM);

  useEffect(() => setValues(EMPTY_FORM), []);

  const addSubjectRow = () => setValues((v) => ({ ...v, subjects: [...v.subjects, { subject: '', maxMarks: 100, passMarks: 33 }] }));
  const updateSubjectRow = (i, field, val) =>
    setValues((v) => ({ ...v, subjects: v.subjects.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)) }));
  const removeSubjectRow = (i) => setValues((v) => ({ ...v, subjects: v.subjects.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...values,
      weight: Number(values.weight),
      subjects: values.subjects.map((s) => ({ ...s, maxMarks: Number(s.maxMarks), passMarks: Number(s.passMarks) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Exam name</label>
        <input className="input" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Academic Year</label>
          <select className="input" required value={values.academicYear} onChange={(e) => setValues((v) => ({ ...v, academicYear: e.target.value }))}>
            <option value="">Select...</option>
            {academicYears.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Class</label>
          <select className="input" required value={values.class} onChange={(e) => setValues((v) => ({ ...v, class: e.target.value }))}>
            <option value="">Select...</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Start date</label>
          <input type="date" className="input" value={values.startDate} onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))} />
        </div>
        <div>
          <label className="label">End date</label>
          <input type="date" className="input" value={values.endDate} onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Assessment category</label>
          <select className="input" value={values.category} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Weight toward term grade (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={values.weight}
            onChange={(e) => setValues((v) => ({ ...v, weight: e.target.value }))}
          />
          <p className="mt-1 text-xs text-gray-400">
            How much this exam counts toward the subject's overall term grade, relative to other exams in the same
            subject (e.g. Quiz 15%, Midterm 25%, Final 40%).
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label mb-0">Subjects</label>
          <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={addSubjectRow}>
            <Plus size={14} /> Add subject
          </button>
        </div>
        <div className="space-y-2">
          {values.subjects.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select className="input" value={row.subject} onChange={(e) => updateSubjectRow(i, 'subject', e.target.value)} required>
                <option value="">Subject...</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input w-28"
                placeholder="Max"
                value={row.maxMarks}
                onChange={(e) => updateSubjectRow(i, 'maxMarks', e.target.value)}
              />
              <input
                type="number"
                className="input w-28"
                placeholder="Pass"
                value={row.passMarks}
                onChange={(e) => updateSubjectRow(i, 'passMarks', e.target.value)}
              />
              <button type="button" className="text-gray-400 hover:text-red-600" onClick={() => removeSubjectRow(i)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!values.subjects.length && <p className="text-sm text-gray-500 dark:text-gray-400">No subjects added yet.</p>}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting || !values.subjects.length}>
          {isSubmitting ? <Spinner size={16} className="text-white" /> : 'Create exam'}
        </button>
      </div>
    </form>
  );
}
