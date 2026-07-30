import { useState } from 'react';
import clsx from 'clsx';
import { Download } from 'lucide-react';
import { useListSectionsQuery, useListClassesQuery } from '../../api/academicApi.js';
import { useListExamsQuery } from '../../api/examsApi.js';
import {
  useAttendanceReportQuery,
  useAcademicReportQuery,
  useFinancialReportQuery,
  useStudentReportQuery,
  useOutstandingFeeReportQuery,
  reportExportUrl,
} from '../../api/reportsApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import Spinner from '../../components/Spinner.jsx';
import downloadAuthenticatedFile from '../../utils/downloadFile.js';

const ROLE_TABS = {
  school_admin: ['Attendance', 'Academic', 'Students', 'Financial', 'Outstanding Fees'],
  teacher: ['Attendance', 'Academic', 'Students'],
  accountant: ['Students', 'Financial', 'Outstanding Fees'],
};

function ExportButtons({ kind, params, filenameBase }) {
  return (
    <div className="flex gap-2">
      <button
        className="btn-secondary"
        onClick={() => downloadAuthenticatedFile(reportExportUrl(kind, 'excel', params), `${filenameBase}.xlsx`)}
      >
        <Download size={16} /> Excel
      </button>
      <button
        className="btn-secondary"
        onClick={() => downloadAuthenticatedFile(reportExportUrl(kind, 'pdf', params), `${filenameBase}.pdf`)}
      >
        <Download size={16} /> PDF
      </button>
    </div>
  );
}

function ClassSectionFilter({ classId, setClassId, sectionId, setSectionId }) {
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const { data: sectionsData } = useListSectionsQuery({ class: classId, limit: 100 }, { skip: !classId });

  return (
    <>
      <div>
        <label className="label">Class</label>
        <select
          className="input"
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSectionId('');
          }}
        >
          <option value="">All classes</option>
          {(classesData?.data || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Section</label>
        <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
          <option value="">All sections</option>
          {(sectionsData?.data || []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default function ReportsPage() {
  const user = useAppSelector(selectCurrentUser);
  const tabs = ROLE_TABS[user?.role] || ROLE_TABS.teacher;
  const [tab, setTab] = useState(tabs[0]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>

      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800">
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
      {tab === 'Students' && <StudentsReport />}
      {tab === 'Financial' && <FinancialReport />}
      {tab === 'Outstanding Fees' && <OutstandingFeesReport />}
    </div>
  );
}

function AttendanceReport() {
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const params = { class: classId || undefined, section: section || undefined, from, to };
  const { data, isLoading } = useAttendanceReportQuery(params, { skip: !classId && !section });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ClassSectionFilter classId={classId} setClassId={setClassId} sectionId={section} setSectionId={setSection} />
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(classId || section) && <ExportButtons kind="attendance" params={params} filenameBase="attendance-report" />}
      </div>

      {isLoading && <Spinner />}
      {!classId && !section && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a class or section to view the report.</p>
      )}
      {data?.data && (
        <div className="card overflow-x-auto p-4">
          {!data.data.length ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No attendance records found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="py-2">Student</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Excused</th>
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
                      <td>{count('excused')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
        {examId && <ExportButtons kind="academic" params={{ exam: examId }} filenameBase="academic-report" />}
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card overflow-x-auto p-4">
          {!data.data.length ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No results found for this exam.</p>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}

function StudentsReport() {
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState('');
  const params = { class: classId || undefined, section: section || undefined, status: status || undefined };
  const { data, isLoading } = useStudentReportQuery(params);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ClassSectionFilter classId={classId} setClassId={setClassId} sectionId={section} setSectionId={setSection} />
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
            <option value="expelled">Expelled</option>
          </select>
        </div>
        <ExportButtons kind="students" params={params} filenameBase="student-report" />
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card overflow-x-auto p-4">
          {!data.data.length ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No students found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="py-2">Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Gender</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.data.map((s) => (
                  <tr key={s._id}>
                    <td className="py-2">{s.admissionNumber}</td>
                    <td>
                      {s.firstName} {s.lastName}
                    </td>
                    <td>{s.class?.name || '-'}</td>
                    <td>{s.section?.name || '-'}</td>
                    <td className="capitalize">{s.gender}</td>
                    <td className="capitalize">{s.status}</td>
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
        <ExportButtons kind="financial" params={{ from, to }} filenameBase="financial-report" />
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card p-4">
          <p className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Total Collected: {data.data.totalCollected.toFixed(2)}
          </p>
          {!data.data.payments.length ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No payments found for this period.</p>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}

function OutstandingFeesReport() {
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const params = { class: classId || undefined, section: section || undefined };
  const { data, isLoading } = useOutstandingFeeReportQuery(params);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ClassSectionFilter classId={classId} setClassId={setClassId} sectionId={section} setSectionId={setSection} />
        <ExportButtons kind="outstanding-fees" params={params} filenameBase="outstanding-fees-report" />
      </div>

      {isLoading && <Spinner />}
      {data?.data && (
        <div className="card p-4">
          <p className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Total Outstanding: {data.data.totalOutstanding.toFixed(2)}
          </p>
          {!data.data.invoices.length ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No outstanding invoices. Everyone's paid up.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="py-2">Invoice No</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.data.invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="py-2">{inv.invoiceNumber}</td>
                      <td>
                        {inv.student?.firstName} {inv.student?.lastName}
                      </td>
                      <td>
                        {inv.student?.class?.name || '-'} {inv.student?.section?.name || ''}
                      </td>
                      <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td>{inv.totalAmount.toFixed(2)}</td>
                      <td>{inv.amountPaid.toFixed(2)}</td>
                      <td className="font-medium text-red-600">{(inv.totalAmount - inv.amountPaid).toFixed(2)}</td>
                      <td className="capitalize">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
