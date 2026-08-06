import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useListAcademicYearsQuery, useListClassesQuery, useListSectionsQuery } from '../../api/academicApi.js';
import { useGetTermRankingQuery } from '../../api/examsApi.js';
import Spinner from '../../components/Spinner.jsx';

export default function ClassRankingPage() {
  const navigate = useNavigate();
  const [academicYear, setAcademicYear] = useState('');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');

  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const { data: sectionsData } = useListSectionsQuery({ class: classId, limit: 100 }, { skip: !classId });

  const canLoad = Boolean(academicYear && classId);
  const { data, isFetching, isError } = useGetTermRankingQuery(
    { academicYear, class: classId, section: section || undefined },
    { skip: !canLoad }
  );

  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => navigate('/exams')}
      >
        <ArrowLeft size={14} /> Back to Exams
      </button>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        <Trophy size={22} /> Class Ranking
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ranks students by their weighted term grade across every approved exam (assignments, quizzes, midterm, final,
        practical) for the selected class and academic year.
      </p>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Academic Year</label>
          <select className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="">Select...</option>
            {(yearsData?.data || []).map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Class</label>
          <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setSection(''); }}>
            <option value="">Select...</option>
            {(classesData?.data || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Section (optional)</label>
          <select className="input" value={section} onChange={(e) => setSection(e.target.value)} disabled={!classId}>
            <option value="">All sections</option>
            {(sectionsData?.data || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canLoad && (
        <div className="card overflow-x-auto p-4">
          {isFetching ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No approved exams found for this selection yet.
            </p>
          ) : !rows.length ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No ranked students found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="py-2">Rank</th>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Percentage</th>
                  <th>GPA</th>
                  <th>Grade</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r) => (
                  <tr key={r.student._id}>
                    <td className="py-2 font-semibold">{r.rank}</td>
                    <td>
                      {r.student.firstName} {r.student.lastName}
                    </td>
                    <td>{r.student.admissionNumber}</td>
                    <td>{r.percentage}%</td>
                    <td>{r.gpa}</td>
                    <td>{r.grade}</td>
                    <td>
                      <span className={r.result === 'PASS' ? 'badge-success' : 'badge-danger'}>{r.result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
