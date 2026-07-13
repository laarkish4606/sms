import { GraduationCap, Users, UserRound, AlertCircle, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGetAdminDashboardQuery } from '../../api/dashboardApi.js';
import StatCard from '../../components/StatCard.jsx';
import Spinner from '../../components/Spinner.jsx';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const stats = data?.data;
  const counts = stats?.counts || {};

  const chartData = (stats?.monthlyCollections || []).map((m) => ({
    name: MONTH_LABELS[m._id.month - 1],
    total: m.total,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={counts.totalStudents ?? 0} icon={GraduationCap} accent="primary" />
        <StatCard label="Total Teachers" value={counts.totalTeachers ?? 0} icon={Users} accent="green" />
        <StatCard label="Total Parents" value={counts.totalParents ?? 0} icon={UserRound} accent="amber" />
        <StatCard label="Overdue Invoices" value={counts.overdueInvoices ?? 0} icon={AlertCircle} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fee Collections (last 6 months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Wallet size={16} /> This Month
          </h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {(stats?.feesCollectedThisMonth ?? 0).toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Fees collected</p>
          <hr className="my-4 border-gray-200 dark:border-gray-800" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending invoices: {counts.pendingInvoices ?? 0}</p>
        </div>
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
