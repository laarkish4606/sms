import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, CheckCircle2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import { useListExamsQuery, useCreateExamMutation, usePublishExamMutation } from '../../api/examsApi.js';
import { useListAcademicYearsQuery, useListClassesQuery, useListSubjectsQuery } from '../../api/academicApi.js';
import { useGetMyStudentProfileQuery } from '../../api/studentsApi.js';
import { useGetMyChildrenQuery } from '../../api/parentsApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import ExamForm from './ExamForm.jsx';

export default function ExamsPage() {
  const user = useAppSelector(selectCurrentUser);
  const canManage = user?.role === 'school_admin';
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading, isError } = useListExamsQuery({ limit: 50 });
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const { data: subjectsData } = useListSubjectsQuery({ limit: 100 });
  const [createExam, { isLoading: creating }] = useCreateExamMutation();
  const [publishExam] = usePublishExamMutation();

  const { data: myProfile } = useGetMyStudentProfileQuery(undefined, { skip: user?.role !== 'student' });
  const { data: myChildren } = useGetMyChildrenQuery(undefined, { skip: user?.role !== 'parent' });
  const children = myChildren?.data || [];
  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || children[0]?._id;
  const reportCardStudentId =
    user?.role === 'student' ? myProfile?.data?._id : user?.role === 'parent' ? activeChildId : null;

  const columns = [
    { key: 'name', header: 'Exam' },
    { key: 'class', header: 'Class', render: (r) => r.class?.name },
    { key: 'academicYear', header: 'Academic Year', render: (r) => r.academicYear?.name },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={r.isPublished ? 'badge-success' : 'badge-neutral'}>
          {r.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-3 text-sm">
          {(user?.role === 'school_admin' || user?.role === 'teacher') && (
            <Link to={`/exams/${r._id}/marks`} className="text-primary-600 hover:underline">
              Enter marks
            </Link>
          )}
          {(user?.role === 'school_admin' || user?.role === 'teacher') && (
            <Link to={`/exams/${r._id}/results`} className="text-primary-600 hover:underline">
              Results
            </Link>
          )}
          {canManage && !r.isPublished && (
            <button
              className="flex items-center gap-1 text-gray-400 hover:text-green-600"
              title="Publish results"
              onClick={async () => {
                await publishExam(r._id).unwrap();
                toast.success('Results published');
              }}
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          {(user?.role === 'student' || user?.role === 'parent') && r.isPublished && reportCardStudentId && (
            <Link to={`/exams/${r._id}/report-card/${reportCardStudentId}`} className="text-primary-600 hover:underline">
              View report card
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Examinations</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Create Exam
          </button>
        )}
        {user?.role === 'parent' && children.length > 1 && (
          <select className="input max-w-xs" value={activeChildId} onChange={(e) => setSelectedChild(e.target.value)}>
            {children.map((c) => (
              <option key={c._id} value={c._id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        )}
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create Exam" size="lg">
        <ExamForm
          isSubmitting={creating}
          academicYears={yearsData?.data || []}
          classes={classesData?.data || []}
          subjects={subjectsData?.data || []}
          onSubmit={async (values) => {
            try {
              await createExam(values).unwrap();
              toast.success('Exam created');
              setFormOpen(false);
            } catch (err) {
              toast.error(err?.data?.message || 'Failed to create exam');
            }
          }}
        />
      </Modal>
    </div>
  );
}
