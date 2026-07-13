import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Ban } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useListSchoolsQuery, useCreateSchoolMutation, useDeactivateSchoolMutation } from '../../api/usersApi.js';

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
  const [values, setValues] = useState(EMPTY_FORM);

  const { data, isLoading, isError } = useListSchoolsQuery({ limit: 50 });
  const [createSchool, { isLoading: creating }] = useCreateSchoolMutation();
  const [deactivateSchool] = useDeactivateSchoolMutation();

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    { key: 'email', header: 'Email', render: (r) => r.email || '-' },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span className={`badge ${r.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.isActive && (
          <button className="text-gray-400 hover:text-red-600" onClick={() => setDeactivating(r)} title="Deactivate">
            <Ban size={16} />
          </button>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schools</h1>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
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
    </div>
  );
}
