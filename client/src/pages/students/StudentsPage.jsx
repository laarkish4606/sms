import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  useListStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from '../../api/studentsApi.js';
import { useListClassesQuery } from '../../api/academicApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import StudentForm from './StudentForm.jsx';

export default function StudentsPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const canManage = user?.role === 'school_admin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, isError } = useListStudentsQuery({ page, limit: 10, search, class: classFilter || undefined });
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();

  const classes = classesData?.data || [];

  const columns = useMemo(
    () => [
      { key: 'admissionNumber', header: 'Admission No' },
      { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
      { key: 'class', header: 'Class', render: (row) => row.class?.name || '-' },
      { key: 'section', header: 'Section', render: (row) => row.section?.name || '-' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <span
            className={`badge ${
              row.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-primary-600" onClick={() => navigate(`/students/${row._id}`)}>
              <Eye size={16} />
            </button>
            {canManage && (
              <>
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
              </>
            )}
          </div>
        ),
      },
    ],
    [canManage, navigate]
  );

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateStudent({ id: editing._id, ...values }).unwrap();
        toast.success('Student updated');
      } else {
        await createStudent(values).unwrap();
        toast.success('Student registered');
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
        {canManage && (
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Add Student
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or admission number..." />
        </div>
        <select className="input sm:w-56" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        isLoading={isLoading}
        isError={isError}
        meta={data?.meta}
        onPageChange={setPage}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg">
        <StudentForm
          initialValues={editing}
          onSubmit={handleSubmit}
          isSubmitting={creating || updating}
          classes={classes}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove student"
        description={`This will permanently remove ${deleting?.firstName} ${deleting?.lastName} and their account.`}
        onConfirm={async () => {
          try {
            await deleteStudent(deleting._id).unwrap();
            toast.success('Student removed');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to remove student');
          }
        }}
      />
    </div>
  );
}
