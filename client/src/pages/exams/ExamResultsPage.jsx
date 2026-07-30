import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetClassResultsSummaryQuery, useGetExamQuery } from '../../api/examsApi.js';
import DataTable from '../../components/DataTable.jsx';

export default function ExamResultsPage() {
  const { examId } = useParams();
  const { data: examData } = useGetExamQuery(examId);
  const { data, isLoading, isError } = useGetClassResultsSummaryQuery(examId);

  const columns = [
    { key: 'rank', header: 'Rank' },
    { key: 'name', header: 'Student', render: (r) => `${r.student?.firstName} ${r.student?.lastName}` },
    { key: 'totalObtained', header: 'Obtained', render: (r) => `${r.totalObtained}/${r.totalMax}` },
    { key: 'percentage', header: '%', render: (r) => `${r.percentage}%` },
    { key: 'grade', header: 'Grade' },
    { key: 'gpa', header: 'GPA' },
    {
      key: 'result',
      header: 'Result',
      render: (r) => (
        <span className={r.result === 'PASS' ? 'badge-success' : 'badge-danger'}>
          {r.result}
        </span>
      ),
    },
    {
      key: 'view',
      header: '',
      render: (r) => (
        <Link to={`/exams/${examId}/report-card/${r.student?._id}`} className="text-primary-600 hover:underline">
          View report card
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Link to="/exams" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to exams
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{examData?.data?.name} — Results</h1>
      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />
    </div>
  );
}
