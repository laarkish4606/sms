import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, FileSpreadsheet, Images, ArrowUpCircle, Download } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  useListStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  studentExportUrl,
} from '../../api/studentsApi.js';
import { useListClassesQuery, useListSectionsQuery, useListAcademicYearsQuery } from '../../api/academicApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import downloadAuthenticatedFile from '../../utils/downloadFile.js';
import StudentForm from './StudentForm.jsx';

export default function StudentsPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const canManage = user?.role === 'school_admin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data, isLoading, isError } = useListStudentsQuery({
    page,
    limit: 10,
    search,
    class: classFilter || undefined,
    section: sectionFilter || undefined,
    gender: genderFilter || undefined,
    status: statusFilter || undefined,
  });
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const { data: classesData } = useListClassesQuery({ limit: 100, academicYear: yearFilter || undefined });
  const { data: sectionsData } = useListSectionsQuery({ class: classFilter, limit: 100 }, { skip: !classFilter });
  const { data: allClassesData } = useListClassesQuery({ limit: 100 });
  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();

  const years = yearsData?.data || [];
  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];
  const rows = data?.data || [];

  const toggleRow = (id) =>
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (ids) =>
    setSelectedIds((s) => {
      const allSelected = ids.every((id) => s.has(id));
      return allSelected ? new Set() : new Set(ids);
    });

  const columns = useMemo(
    () => [
      { key: 'admissionNumber', header: 'Admission No' },
      { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
      { key: 'class', header: 'Class', render: (row) => row.class?.name || '-' },
      { key: 'section', header: 'Section', render: (row) => row.section?.name || '-' },
      { key: 'gender', header: 'Gender', render: (row) => row.gender || '-' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <span className={row.status === 'active' ? 'badge-success' : 'badge-neutral'}>{row.status}</span>
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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    let succeeded = 0;
    for (const id of ids) {
      try {
        await deleteStudent(id).unwrap();
        succeeded += 1;
      } catch {
        // continue with the rest; failures are reflected in the final count
      }
    }
    toast.success(`${succeeded} of ${ids.length} student(s) removed`);
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => navigate('/students/import')}>
              <FileSpreadsheet size={16} /> Import from Excel
            </button>
            <button className="btn-secondary" onClick={() => navigate('/students/photos/bulk')}>
              <Images size={16} /> Bulk Photo Upload
            </button>
            <button className="btn-secondary" onClick={() => navigate('/students/promote')}>
              <ArrowUpCircle size={16} /> Promote Students
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                downloadAuthenticatedFile(
                  studentExportUrl({ search, class: classFilter, section: sectionFilter, gender: genderFilter, status: statusFilter }),
                  'students.xlsx'
                )
              }
            >
              <Download size={16} /> Export Students
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> Add Student
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="flex-1 sm:min-w-[200px]">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or admission number..." />
        </div>
        <select className="input sm:w-44" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setClassFilter(''); setSectionFilter(''); setPage(1); }}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y._id} value={y._id}>
              {y.name}
            </option>
          ))}
        </select>
        <select className="input sm:w-44" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); setPage(1); }}>
          <option value="">All classes</option>
          {(yearFilter ? classes : allClassesData?.data || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input sm:w-36" value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }} disabled={!classFilter}>
          <option value="">All sections</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="input sm:w-36" value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}>
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select className="input sm:w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="transferred">Transferred</option>
          <option value="expelled">Expelled</option>
        </select>
      </div>

      {canManage && selectedIds.size > 0 && (
        <div className="card flex items-center justify-between p-3 text-sm">
          <span>{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
            <button className="btn-danger px-3 py-1.5" onClick={() => setBulkDeleting(true)}>
              <Trash2 size={14} /> Delete selected
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        meta={data?.meta}
        onPageChange={setPage}
        selectable={canManage}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg">
        <StudentForm
          initialValues={editing}
          onSubmit={handleSubmit}
          isSubmitting={creating || updating}
          classes={allClassesData?.data || []}
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

      <ConfirmDialog
        open={bulkDeleting}
        onClose={() => setBulkDeleting(false)}
        title="Remove selected students"
        description={`This will permanently remove ${selectedIds.size} student(s) and their accounts.`}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
