import { useState } from 'react';
import { useGetStudentDashboardQuery } from '../../api/dashboardApi.js';
import { useGetMyChildrenQuery } from '../../api/parentsApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import Spinner from '../../components/Spinner.jsx';
import StatCard from '../../components/StatCard.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { CalendarCheck, Wallet } from 'lucide-react';

export default function StudentDashboard() {
  const user = useAppSelector(selectCurrentUser);
  const isParent = user?.role === 'parent';

  const { data: childrenData } = useGetMyChildrenQuery(undefined, { skip: !isParent });
  const [selectedChild, setSelectedChild] = useState('');
  const children = childrenData?.data || [];
  const activeChild = selectedChild || children[0]?._id;

  const { data, isLoading } = useGetStudentDashboardQuery(
    isParent ? { student: activeChild } : undefined,
    { skip: isParent && !activeChild }
  );

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

  if (isParent && !children.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No children linked to your account yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardHeader
          greeting={`Hi ${stats?.student?.firstName || (isParent ? '' : user?.firstName) || ''}, welcome back.`}
        />
        {isParent && children.length > 1 && (
          <select className="input max-w-xs" value={activeChild} onChange={(e) => setSelectedChild(e.target.value)}>
            {children.map((c) => (
              <option key={c._id} value={c._id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        )}
      </div>

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
