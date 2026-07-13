import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Spinner from '../../components/Spinner.jsx';

const FREQUENCIES = ['one_time', 'monthly', 'quarterly', 'term', 'annual'];

export default function FeeStructureForm({ onSubmit, isSubmitting, academicYears, classes }) {
  const [academicYear, setAcademicYear] = useState('');
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState([{ name: '', amount: 0, frequency: 'term' }]);

  const addItem = () => setItems((i) => [...i, { name: '', amount: 0, frequency: 'term' }]);
  const updateItem = (idx, field, value) => setItems((i) => i.map((it, ix) => (ix === idx ? { ...it, [field]: value } : it)));
  const removeItem = (idx) => setItems((i) => i.filter((_, ix) => ix !== idx));

  const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      academicYear,
      class: classId,
      items: items.map((i) => ({ ...i, amount: Number(i.amount) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Academic Year</label>
          <select className="input" required value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
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
          <select className="input" required value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select...</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label mb-0">Fee items</label>
          <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={addItem}>
            <Plus size={14} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className="input"
                placeholder="e.g. Tuition"
                required
                value={item.name}
                onChange={(e) => updateItem(idx, 'name', e.target.value)}
              />
              <input
                type="number"
                min="0"
                className="input w-32"
                placeholder="Amount"
                required
                value={item.amount}
                onChange={(e) => updateItem(idx, 'amount', e.target.value)}
              />
              <select className="input w-36" value={item.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <button type="button" className="text-gray-400 hover:text-red-600" onClick={() => removeItem(idx)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Total: {total.toFixed(2)}</p>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size={16} className="text-white" /> : 'Save fee structure'}
        </button>
      </div>
    </form>
  );
}
