import { useGetStudentDashboardQuery } from '../../api/dashboardApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import Spinner from '../../components/Spinner.jsx';
import StatCard from '../../components/StatCard.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { CalendarCheck, Wallet, BookOpen, Clock, Award } from 'lucide-react';
import { INVOICE_STATUS_BADGE } from '../../utils/statusBadges.js';

export default function StudentDashboard() {
  const user = useAppSelector(selectCurrentUser);
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

  if (!stats?.student) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No student profile found for this account.</p>;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader greeting={`Hi ${stats?.student?.firstName || user?.firstName || ''}, welcome back.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance (30 days)" value={`${pct}%`} icon={CalendarCheck} accent="green" />
        <StatCard label="Pending Invoices" value={dueInvoices.length} icon={Wallet} accent="amber" />
        <StatCard label="Upcoming Exams" value={stats?.upcomingExams?.length ?? 0} icon={BookOpen} accent="primary" />
        <StatCard label="Recent Grades" value={stats?.latestMarks?.length ?? 0} icon={Award} accent="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Clock size={16} /> Today's Timetable
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.todaysTimetable || []).map((p, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-800 dark:text-gray-200">{p.subject}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {p.startTime}–{p.endTime}
                </span>
              </li>
            ))}
            {!stats?.todaysTimetable?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No classes scheduled today.</p>}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <BookOpen size={16} /> Upcoming Exams
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.upcomingExams || []).map((e) => (
              <li key={e._id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-800 dark:text-gray-200 capitalize">
                  {e.name} <span className="text-gray-400">({e.category})</span>
                </span>
                <span className="text-gray-500 dark:text-gray-400">{new Date(e.startDate).toLocaleDateString()}</span>
              </li>
            ))}
            {!stats?.upcomingExams?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No upcoming exams scheduled.</p>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Award size={16} /> Recent Grades
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.latestMarks || []).map((m) => (
              <li key={m._id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-800 dark:text-gray-200">
                  {m.subject?.name || 'Unknown subject'} <span className="text-gray-400">({m.exam?.name || 'exam removed'})</span>
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {m.obtainedMarks}/{m.maxMarks}
                </span>
              </li>
            ))}
            {!stats?.latestMarks?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No grades recorded yet.</p>}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Fee Status</h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.invoices || []).slice(0, 5).map((inv) => (
              <li key={inv._id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-800 dark:text-gray-200">{inv.invoiceNumber}</span>
                <span className={INVOICE_STATUS_BADGE[inv.status]}>{inv.status}</span>
              </li>
            ))}
            {!stats?.invoices?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">School Announcements</h2>
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
