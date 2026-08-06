import { GraduationCap, Users, UserRound, AlertCircle, Wallet, Building2, School, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useGetAdminDashboardQuery } from '../../api/dashboardApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import StatCard from '../../components/StatCard.jsx';
import Spinner from '../../components/Spinner.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildWeeklyAttendanceChart(trend) {
  const byDate = new Map();
  (trend || []).forEach((row) => {
    const date = row._id.date;
    if (!byDate.has(date)) byDate.set(date, { date: date.slice(5), present: 0, absent: 0 });
    if (row._id.status === 'present') byDate.get(date).present += row.count;
    if (row._id.status === 'absent') byDate.get(date).absent += row.count;
  });
  return Array.from(byDate.values());
}

export default function AdminDashboard() {
  const user = useAppSelector(selectCurrentUser);
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
  const attendanceChartData = buildWeeklyAttendanceChart(stats?.weeklyAttendanceTrend);

  const todayPresent = stats?.todayAttendance?.find((s) => s._id === 'present')?.count || 0;
  const todayAbsent = stats?.todayAttendance?.find((s) => s._id === 'absent')?.count || 0;

  return (
    <div className="space-y-6">
      <DashboardHeader greeting={`Hello ${user?.firstName || ''}, here's today's overview.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={counts.totalStudents ?? 0} icon={GraduationCap} accent="primary" />
        <StatCard label="Total Teachers" value={counts.totalTeachers ?? 0} icon={Users} accent="green" />
        <StatCard label="Total Parents" value={counts.totalParents ?? 0} icon={UserRound} accent="amber" />
        <StatCard label="Total Staff" value={counts.totalStaff ?? 0} icon={Building2} accent="primary" />
        <StatCard label="Total Classes" value={counts.totalClasses ?? 0} icon={School} accent="green" />
        <StatCard label="Overdue Invoices" value={counts.overdueInvoices ?? 0} icon={AlertCircle} accent="red" />
        <StatCard label="Pending Approvals" value={counts.pendingApprovals ?? 0} icon={ClipboardCheck} accent="amber" />
        <StatCard label="Present Today" value={`${todayPresent} / ${todayPresent + todayAbsent || 0}`} icon={Users} accent="green" />
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
              <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Attendance Trend (last 7 days)</h2>
          {attendanceChartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#059669" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="#e11d48" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No attendance recorded yet.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Registrations</h2>
          <div className="space-y-3">
            {(stats?.recentRegistrations?.students || []).slice(0, 3).map((s) => (
              <div key={s._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800 dark:text-gray-200">
                  {s.firstName} {s.lastName} <span className="text-gray-400">({s.admissionNumber})</span>
                </span>
                <span className="badge-info">Student</span>
              </div>
            ))}
            {(stats?.recentRegistrations?.teachers || []).slice(0, 3).map((t) => (
              <div key={t._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800 dark:text-gray-200">
                  {t.firstName} {t.lastName} <span className="text-gray-400">({t.employeeId})</span>
                </span>
                <span className="badge-success">Teacher</span>
              </div>
            ))}
            {!stats?.recentRegistrations?.students?.length && !stats?.recentRegistrations?.teachers?.length && (
              <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No recent registrations.</p>
            )}
          </div>
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
