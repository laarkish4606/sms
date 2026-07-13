import { useGetStudentDashboardQuery } from '../../api/dashboardApi.js';
import Spinner from '../../components/Spinner.jsx';
import StatCard from '../../components/StatCard.jsx';
import { CalendarCheck, Wallet } from 'lucide-react';

export default function StudentDashboard() {
  const { data, isLoading } = useGetStudentDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const stats = data?.data;
  const present = stats?.attendanceSummary?.find((s) => s._id === 'present')?.count || 0;
  const total = (stats?.attendanceSummary || []).reduce((sum, s) => sum + s.count, 0);
  const pct = total ? Math.round((present / total) * 100) : 0;
  const dueInvoices = (stats?.invoices || []).filter((i) => i.status !== 'paid');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Welcome, {stats?.student?.firstName}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Attendance Rate" value={`${pct}%`} icon={CalendarCheck} accent="green" />
        <StatCard label="Pending Invoices" value={dueInvoices.length} icon={Wallet} accent="amber" />
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Notices</h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {(stats?.recentNotices || []).map((n) => (
            <li key={n._id} className="py-2.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.publishDate).toLocaleDateString()}</p>
            </li>
          ))}
          {!stats?.recentNotices?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No recent notices.</p>}
        </ul>
      </div>
    </div>
  );
}
