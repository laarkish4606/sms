import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Plus, Ban, CheckCircle2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useListUsersQuery, useCreateUserMutation, useSetUserActiveMutation } from '../../api/usersApi.js';

const TABS = [
  { label: 'Accountants', role: 'accountant' },
  { label: 'School Admins', role: 'school_admin' },
];

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', phone: '' };

// Accountant and additional School Admin accounts don't have their own profile
// module (unlike Student/Teacher/Parent) — they're plain User records, managed
// here via the generic /users endpoint.
export default function StaffPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_FORM);

  const { data, isLoading, isError } = useListUsersQuery({ role: tab.role, limit: 50 });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [setUserActive] = useSetUserActiveMutation();

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone', render: (r) => r.phone || '-' },
      {
        key: 'isActive',
        header: 'Status',
        render: (r) => (
          <span className={r.isActive ? 'badge-success' : 'badge-neutral'}>
            {r.isActive ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <button
            className="flex items-center gap-1 text-gray-400 hover:text-primary-600"
            title={r.isActive ? 'Deactivate' : 'Activate'}
            onClick={async () => {
              await setUserActive({ id: r._id, isActive: !r.isActive }).unwrap();
              toast.success(r.isActive ? 'Account deactivated' : 'Account activated');
            }}
          >
            {r.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
          </button>
        ),
      },
    ],
    [setUserActive]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser({ ...values, role: tab.role }).unwrap();
      toast.success('Account created');
      setFormOpen(false);
      setValues(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create account');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staff Accounts</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setValues(EMPTY_FORM);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Add {tab.label.slice(0, -1)}
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.role}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab.role === t.role ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={`Add ${tab.label.slice(0, -1)}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First name</label>
              <input className="input" required value={values.firstName} onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" required value={values.lastName} onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" required value={values.password} onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? <Spinner size={16} className="text-white" /> : 'Create account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
