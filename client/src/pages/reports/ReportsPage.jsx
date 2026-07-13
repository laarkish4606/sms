import { useState } from 'react';
import clsx from 'clsx';
import { Download } from 'lucide-react';
import { useListSectionsQuery, useListClassesQuery } from '../../api/academicApi.js';
import { useListExamsQuery } from '../../api/examsApi.js';
import { useAttendanceReportQuery, useAcademicReportQuery, useFinancialReportQuery, reportExportUrl } from '../../api/reportsApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import Spinner from '../../components/Spinner.jsx';
import downloadAuthenticatedFile from '../../utils/downloadFile.js';

const TABS = ['Attendance', 'Academic', 'Financial'];

export default function ReportsPage() {
  const user = useAppSelector(selectCurrentUser);
  const tabs = user?.role === 'accountant' ? ['Financial'] : TABS;
  const [tab, setTab] = useState(tabs[0]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Attendance' && <AttendanceReport />}
      {tab === 'Academic' && <AcademicReport />}
      {tab === 'Financial' && <FinancialReport />}
    </div>
  );
}

function AttendanceReport() {
  const [section, setSection] = useState('');
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const [classId, setClassId] = useState('');
  const { data: sectionsData } = useListSectionsQuery({ class: classId, limit: 100 }, { skip: !classId });
  const { data, isLoading } = useAttendanceReportQuery({ section }, { skip: !section });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Class</label>
          <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setSection(''); }}>
            <option value="">Select class</option>
            {(classesData?.data || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Section</label>
          <select className="input" value={section} onChange={(e) => setSection(e.target.value)} disabled={!classId}>
            <option value="">Select section</option>
            {(sectionsData?.data || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {section && (
          <button
            className="btn-secondary"
            onClick={() => downloadAuthenticatedFile(reportExportUrl('attendance', 'excel', { section }), 'attendance-report.xlsx')}
          >
            <Download size={16} /> Export Excel
          </button>
        )}
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card overflow-x-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="py-2">Student</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.data.map((d) => {
                const count = (status) => d.stats.find((s) => s.status === status)?.count || 0;
                return (
                  <tr key={d.student._id}>
                    <td className="py-2">
                      {d.student.firstName} {d.student.lastName}
                    </td>
                    <td>{count('present')}</td>
                    <td>{count('absent')}</td>
                    <td>{count('late')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AcademicReport() {
  const [examId, setExamId] = useState('');
  const { data: examsData } = useListExamsQuery({ limit: 100 });
  const { data, isLoading } = useAcademicReportQuery({ exam: examId }, { skip: !examId });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Exam</label>
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Select exam</option>
            {(examsData?.data || []).map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        {examId && (
          <button
            className="btn-secondary"
            onClick={() => downloadAuthenticatedFile(reportExportUrl('academic', 'excel', { exam: examId }), 'academic-report.xlsx')}
          >
            <Download size={16} /> Export Excel
          </button>
        )}
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card overflow-x-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="py-2">Student</th>
                <th>%</th>
                <th>Grade</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.data.map((d) => (
                <tr key={d.student._id}>
                  <td className="py-2">
                    {d.student.firstName} {d.student.lastName}
                  </td>
                  <td>{d.percentage}%</td>
                  <td>{d.grade}</td>
                  <td>{d.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinancialReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading } = useFinancialReportQuery({ from, to });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn-secondary" onClick={() => downloadAuthenticatedFile(reportExportUrl('financial', 'excel', { from, to }), 'financial-report.xlsx')}>
          <Download size={16} /> Excel
        </button>
        <button className="btn-secondary" onClick={() => downloadAuthenticatedFile(reportExportUrl('financial', 'pdf', { from, to }), 'financial-report.pdf')}>
          <Download size={16} /> PDF
        </button>
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card p-4">
          <p className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Total Collected: {data.data.totalCollected.toFixed(2)}
          </p>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="py-2">Receipt</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.data.payments.map((p) => (
                <tr key={p._id}>
                  <td className="py-2">{p.receiptNumber}</td>
                  <td>
                    {p.student?.firstName} {p.student?.lastName}
                  </td>
                  <td>{p.amount.toFixed(2)}</td>
                  <td>{p.method}</td>
                  <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
