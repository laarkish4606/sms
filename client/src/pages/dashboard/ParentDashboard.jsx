import { useState } from 'react';
import { CalendarCheck, Wallet, Users, Award, AlertCircle } from 'lucide-react';
import { useGetParentDashboardQuery, useGetStudentDashboardQuery } from '../../api/dashboardApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import Spinner from '../../components/Spinner.jsx';
import StatCard from '../../components/StatCard.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { INVOICE_STATUS_BADGE } from '../../utils/statusBadges.js';

export default function ParentDashboard() {
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading } = useGetParentDashboardQuery();
  const [selectedChild, setSelectedChild] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const children = data?.data?.children || [];
  const recentNotices = data?.data?.recentNotices || [];

  if (!children.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No children linked to your account yet.</p>;
  }

  const activeChildId = selectedChild || children[0].student._id;
  const totalOutstanding = children.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalUnpaid = children.reduce((sum, c) => sum + c.unpaidInvoiceCount, 0);
  const avgAttendance = Math.round(
    children.reduce((sum, c) => sum + (c.attendancePct ?? 0), 0) / children.length
  );

  return (
    <div className="space-y-6">
      <DashboardHeader greeting={`Hi ${user?.firstName || ''}, here's an overview of your children.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Children" value={children.length} icon={Users} accent="primary" />
        <StatCard label="Avg. Attendance" value={`${avgAttendance || 0}%`} icon={CalendarCheck} accent="green" />
        <StatCard label="Outstanding Balance" value={totalOutstanding.toFixed(2)} icon={Wallet} accent="amber" />
        <StatCard label="Unpaid Invoices" value={totalUnpaid} icon={AlertCircle} accent="red" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Your Children</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c) => (
            <button
              key={c.student._id}
              onClick={() => setSelectedChild(c.student._id)}
              className={`card p-4 text-left transition-shadow hover:shadow-md ${
                activeChildId === c.student._id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {c.student.firstName} {c.student.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {c.student.class?.name} {c.student.section?.name && `— ${c.student.section.name}`}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className={c.attendancePct >= 75 || c.attendancePct === null ? 'badge-success' : 'badge-warning'}>
                  {c.attendancePct === null ? 'No data' : `${c.attendancePct}% attendance`}
                </span>
                {c.unpaidInvoiceCount > 0 && <span className="badge-danger">{c.unpaidInvoiceCount} unpaid</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <ChildDetail studentId={activeChildId} />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">School Announcements</h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentNotices.map((n) => (
            <li key={n._id} className="py-2.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.publishDate).toLocaleDateString()}</p>
            </li>
          ))}
          {!recentNotices.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No recent notices.</p>}
        </ul>
      </div>
    </div>
  );
}

function ChildDetail({ studentId }) {
  const { data, isFetching } = useGetStudentDashboardQuery({ student: studentId }, { skip: !studentId });
  const stats = data?.data;

  if (isFetching) {
    return (
      <div className="card flex justify-center p-8">
        <Spinner />
      </div>
    );
  }
  if (!stats?.student) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <CalendarCheck size={16} /> Recent Absences — {stats.student.firstName}
        </h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {(stats.recentAbsences || []).map((r) => (
            <li key={r._id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-800 dark:text-gray-200">{new Date(r.date).toLocaleDateString()}</span>
              <span className={r.status === 'absent' ? 'badge-danger' : 'badge-warning'}>{r.status}</span>
            </li>
          ))}
          {!stats.recentAbsences?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No recent absences — great record!</p>}
        </ul>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Award size={16} /> Latest Grades — {stats.student.firstName}
        </h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {(stats.latestMarks || []).map((m) => (
            <li key={m._id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-gray-800 dark:text-gray-200">
                {m.subject?.name || 'Unknown subject'} <span className="text-gray-400">({m.exam?.name || 'exam removed'})</span>
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {m.obtainedMarks}/{m.maxMarks}
              </span>
            </li>
          ))}
          {!stats.latestMarks?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No grades recorded yet.</p>}
        </ul>
      </div>

      <div className="card p-5 lg:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Payment History — {stats.student.firstName}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="py-2">Invoice</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(stats.invoices || []).map((inv) => (
                <tr key={inv._id}>
                  <td className="py-2">{inv.invoiceNumber}</td>
                  <td>{inv.totalAmount.toFixed(2)}</td>
                  <td>{inv.amountPaid.toFixed(2)}</td>
                  <td>
                    <span className={INVOICE_STATUS_BADGE[inv.status]}>{inv.status}</span>
                  </td>
                </tr>
              ))}
              {!stats.invoices?.length && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
