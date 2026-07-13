import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useListNoticesQuery, useCreateNoticeMutation } from '../../api/communicationApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';

const AUDIENCES = ['all', 'teachers', 'students', 'parents', 'accountants'];

export default function NoticesTab() {
  const user = useAppSelector(selectCurrentUser);
  const canCreate = user?.role === 'school_admin' || user?.role === 'teacher';
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState({ title: '', content: '', audience: 'all', sendEmail: false });

  const { data, isLoading } = useListNoticesQuery({ limit: 50 });
  const [createNotice, { isLoading: creating }] = useCreateNoticeMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createNotice(values).unwrap();
      toast.success('Notice published');
      setFormOpen(false);
      setValues({ title: '', content: '', audience: 'all', sendEmail: false });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to publish notice');
    }
  };

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> New Notice
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size={24} />
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data || []).map((n) => (
            <div key={n._id} className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{n.title}</h3>
                <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">{n.audience}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{n.content}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(n.publishDate).toLocaleString()}</p>
            </div>
          ))}
          {!data?.data?.length && <p className="text-sm text-gray-500 dark:text-gray-400">No notices yet.</p>}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Notice">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input" rows={4} required value={values.content} onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))} />
          </div>
          <div>
            <label className="label">Audience</label>
            <select className="input" value={values.audience} onChange={(e) => setValues((v) => ({ ...v, audience: e.target.value }))}>
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={values.sendEmail} onChange={(e) => setValues((v) => ({ ...v, sendEmail: e.target.checked }))} />
            Also notify by email
          </label>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? <Spinner size={16} className="text-white" /> : 'Publish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
