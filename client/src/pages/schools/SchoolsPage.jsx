import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Ban, RotateCcw, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Spinner from '../../components/Spinner.jsx';
import {
  useListSchoolsQuery,
  useCreateSchoolMutation,
  useDeactivateSchoolMutation,
  useReactivateSchoolMutation,
  useDeleteSchoolPermanentlyMutation,
} from '../../api/usersApi.js';

const EMPTY_FORM = {
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function SchoolsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);

  const { data, isLoading, isError } = useListSchoolsQuery({ limit: 50 });
  const [createSchool, { isLoading: creating }] = useCreateSchoolMutation();
  const [deactivateSchool] = useDeactivateSchoolMutation();
  const [reactivateSchool] = useReactivateSchoolMutation();
  const [deleteSchoolPermanently, { isLoading: deletingSchool }] = useDeleteSchoolPermanentlyMutation();

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    { key: 'email', header: 'Email', render: (r) => r.email || '-' },
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
        <div className="flex items-center gap-3">
          {r.isActive ? (
            <button className="text-gray-400 hover:text-amber-600" onClick={() => setDeactivating(r)} title="Deactivate">
              <Ban size={16} />
            </button>
          ) : (
            <button
              className="text-gray-400 hover:text-green-600"
              title="Reactivate"
              onClick={async () => {
                try {
                  await reactivateSchool(r._id).unwrap();
                  toast.success('School reactivated');
                } catch (err) {
                  toast.error(err?.data?.message || 'Failed to reactivate');
                }
              }}
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleting(r)} title="Delete permanently">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSchool(values).unwrap();
      toast.success('School created');
      setFormOpen(false);
      setValues(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create school');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schools</h1>
        <button className="btn-primary shrink-0 sm:self-auto" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add School
        </button>
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add School" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">School Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">School Name</label>
              <input className="input" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">School Code</label>
              <input className="input" required value={values.code} onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} />
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">School Admin Account</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First Name</label>
              <input className="input" required value={values.adminFirstName} onChange={(e) => setValues((v) => ({ ...v, adminFirstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" required value={values.adminLastName} onChange={(e) => setValues((v) => ({ ...v, adminLastName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Admin Email</label>
              <input type="email" className="input" required value={values.adminEmail} onChange={(e) => setValues((v) => ({ ...v, adminEmail: e.target.value }))} />
            </div>
            <div>
              <label className="label">Admin Password</label>
              <input type="password" className="input" required value={values.adminPassword} onChange={(e) => setValues((v) => ({ ...v, adminPassword: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? <Spinner size={16} className="text-white" /> : 'Create school'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivating)}
        onClose={() => setDeactivating(null)}
        title="Deactivate school"
        description="This will deactivate the school and all its user accounts."
        onConfirm={async () => {
          try {
            await deactivateSchool(deactivating._id).unwrap();
            toast.success('School deactivated');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to deactivate');
          }
        }}
      />

      <DeleteSchoolModal
        school={deleting}
        isDeleting={deletingSchool}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await deleteSchoolPermanently(deleting._id).unwrap();
            toast.success('School permanently deleted');
            setDeleting(null);
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete school');
          }
        }}
      />
    </div>
  );
}

// Hard delete is irreversible and cascades to every record scoped to the
// school (users, students, invoices, attendance, ...), so it requires typing
// the school's code back rather than a single confirm click.
function DeleteSchoolModal({ school, isDeleting, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');

  if (!school) return null;
  const matches = confirmText.trim().toUpperCase() === school.code.toUpperCase();

  return (
    <Modal
      open={Boolean(school)}
      onClose={() => {
        setConfirmText('');
        onClose();
      }}
      title="Permanently delete school"
      size="sm"
    >
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        This permanently deletes <strong>{school.name}</strong> and every record tied to it — users, students,
        classes, attendance, invoices, payments, everything. This cannot be undone.
      </p>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Type <strong>{school.code}</strong> to confirm.
      </p>
      <input
        className="input mb-4"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={school.code}
      />
      <div className="flex justify-end gap-3">
        <button
          className="btn-secondary"
          onClick={() => {
            setConfirmText('');
            onClose();
          }}
        >
          Cancel
        </button>
        <button className="btn-danger" disabled={!matches || isDeleting} onClick={onConfirm}>
          {isDeleting ? <Spinner size={16} className="text-white" /> : 'Delete permanently'}
        </button>
      </div>
    </Modal>
  );
}
