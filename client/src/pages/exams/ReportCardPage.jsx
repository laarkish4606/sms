import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useGetStudentReportCardQuery } from '../../api/examsApi.js';
import Spinner from '../../components/Spinner.jsx';

export default function ReportCardPage() {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetStudentReportCardQuery({ examId, studentId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (isError || !data?.data) return <p className="text-sm text-gray-500">Report card not available yet.</p>;

  const { exam, student, subjects, totalObtained, totalMax, percentage, grade, gpa, result } = data.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => window.print()} className="btn-secondary">
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="card mx-auto max-w-2xl p-8">
        <h1 className="text-center text-xl font-bold text-gray-900 dark:text-gray-100">Student Report Card</h1>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">{exam.name}</p>

        <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-gray-500">Student:</span> {student.firstName} {student.lastName}
          </p>
          <p>
            <span className="text-gray-500">Admission No:</span> {student.admissionNumber}
          </p>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-800">
              <th className="py-2">Subject</th>
              <th className="py-2">Obtained</th>
              <th className="py-2">Max</th>
              <th className="py-2">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {subjects.map((s, i) => (
              <tr key={i}>
                <td className="py-2">{s.subject}</td>
                <td className="py-2">{s.obtained}</td>
                <td className="py-2">{s.total}</td>
                <td className="py-2">{s.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-2 gap-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
          <p>
            <span className="text-gray-500">Total:</span> {totalObtained}/{totalMax}
          </p>
          <p>
            <span className="text-gray-500">Percentage:</span> {percentage}%
          </p>
          <p>
            <span className="text-gray-500">Grade:</span> {grade}
          </p>
          <p>
            <span className="text-gray-500">GPA:</span> {gpa}
          </p>
          <p className="col-span-2">
            <span className="text-gray-500">Result:</span>{' '}
            <span className={result === 'PASS' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{result}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
