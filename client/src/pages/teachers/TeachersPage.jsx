import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  useListTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} from '../../api/teachersApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';

const TEACHER_STATUS_BADGE = {
  active: 'badge-success',
  on_leave: 'badge-warning',
  inactive: 'badge-neutral',
  terminated: 'badge-danger',
};
import TeacherForm from './TeacherForm.jsx';

export default function TeachersPage() {
  const user = useAppSelector(selectCurrentUser);
  const canManage = user?.role === 'school_admin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, isError } = useListTeachersQuery({ page, limit: 10, search });
  const [createTeacher, { isLoading: creating }] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: updating }] = useUpdateTeacherMutation();
  const [deleteTeacher] = useDeleteTeacherMutation();

  const columns = useMemo(
    () => [
      { key: 'employeeId', header: 'Employee ID' },
      { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
      { key: 'designation', header: 'Designation', render: (row) => row.designation || '-' },
      { key: 'department', header: 'Department', render: (row) => row.department || '-' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <span className={TEACHER_STATUS_BADGE[row.status] || 'badge-neutral'}>{row.status}</span>,
      },
      ...(canManage
        ? [
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <button
                    className="text-gray-400 hover:text-primary-600"
                    onClick={() => {
                      setEditing(row);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleting(row)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [canManage]
  );

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateTeacher({ id: editing._id, ...values }).unwrap();
        toast.success('Teacher updated');
      } else {
        await createTeacher(values).unwrap();
        toast.success('Teacher registered');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teachers</h1>
        {canManage && (
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Add Teacher
          </button>
        )}
      </div>

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, employee ID, or department..." />

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} meta={data?.meta} onPageChange={setPage} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <TeacherForm initialValues={editing} onSubmit={handleSubmit} isSubmitting={creating || updating} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove teacher"
        description={`This will permanently remove ${deleting?.firstName} ${deleting?.lastName} and their account.`}
        onConfirm={async () => {
          try {
            await deleteTeacher(deleting._id).unwrap();
            toast.success('Teacher removed');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to remove teacher');
          }
        }}
      />
    </div>
  );
}
