import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  useListParentsQuery,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeleteParentMutation,
  useLinkChildMutation,
  useUnlinkChildMutation,
} from '../../api/parentsApi.js';
import { useListStudentsQuery } from '../../api/studentsApi.js';
import ParentForm from './ParentForm.jsx';

export default function ParentsPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [linking, setLinking] = useState(null);
  const [studentToLink, setStudentToLink] = useState('');

  const { data, isLoading, isError } = useListParentsQuery({ page, limit: 10 });
  const { data: studentsData } = useListStudentsQuery({ limit: 100 });
  const [createParent, { isLoading: creating }] = useCreateParentMutation();
  const [updateParent, { isLoading: updating }] = useUpdateParentMutation();
  const [deleteParent] = useDeleteParentMutation();
  const [linkChild] = useLinkChildMutation();
  const [unlinkChild] = useUnlinkChildMutation();

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (row) => `${row.user?.firstName || row.firstName} ${row.user?.lastName || row.lastName || ''}` },
      { key: 'email', header: 'Email', render: (row) => row.user?.email || '-' },
      {
        key: 'children',
        header: 'Children',
        render: (row) => (row.children?.length ? row.children.map((c) => `${c.firstName} ${c.lastName}`).join(', ') : '-'),
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-primary-600" onClick={() => setLinking(row)} title="Link child">
              <Link2 size={16} />
            </button>
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
    ],
    []
  );

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateParent({ id: editing._id, ...values }).unwrap();
        toast.success('Parent updated');
      } else {
        await createParent(values).unwrap();
        toast.success('Parent registered');
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parents</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Add Parent
        </button>
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} meta={data?.meta} onPageChange={setPage} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Parent' : 'Add Parent'}>
        <ParentForm initialValues={editing} onSubmit={handleSubmit} isSubmitting={creating || updating} />
      </Modal>

      <Modal open={Boolean(linking)} onClose={() => setLinking(null)} title="Link Child" size="sm">
        <div className="space-y-4">
          <div className="space-y-2">
            {linking?.children?.map((c) => (
              <div key={c._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                <span>
                  {c.firstName} {c.lastName}
                </span>
                <button
                  className="text-xs text-red-500 hover:underline"
                  onClick={async () => {
                    await unlinkChild({ id: linking._id, studentId: c._id }).unwrap();
                    toast.success('Child unlinked');
                  }}
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <select className="input" value={studentToLink} onChange={(e) => setStudentToLink(e.target.value)}>
              <option value="">Select student</option>
              {(studentsData?.data || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
            <button
              className="btn-primary shrink-0"
              disabled={!studentToLink}
              onClick={async () => {
                try {
                  await linkChild({ id: linking._id, studentId: studentToLink }).unwrap();
                  toast.success('Child linked');
                  setStudentToLink('');
                } catch (err) {
                  toast.error(err?.data?.message || 'Failed to link child');
                }
              }}
            >
              Link
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove parent"
        description="This will permanently remove this parent and their account."
        onConfirm={async () => {
          try {
            await deleteParent(deleting._id).unwrap();
            toast.success('Parent removed');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to remove parent');
          }
        }}
      />
    </div>
  );
}
