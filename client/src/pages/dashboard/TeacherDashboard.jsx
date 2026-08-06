import { useGetTeacherDashboardQuery } from '../../api/dashboardApi.js';
import Spinner from '../../components/Spinner.jsx';
import StatCard from '../../components/StatCard.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { CalendarCheck, BookOpen, Users, School, Clock } from 'lucide-react';

export default function TeacherDashboard() {
  const { data, isLoading } = useGetTeacherDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const stats = data?.data;
  const present = stats?.attendanceToday?.find((s) => s._id === 'present')?.count || 0;
  const absent = stats?.attendanceToday?.find((s) => s._id === 'absent')?.count || 0;

  return (
    <div className="space-y-6">
      <DashboardHeader greeting={`Hi ${stats?.teacher?.firstName || ''}, here's what's happening today.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes Assigned" value={stats?.classesAssigned ?? 0} icon={School} accent="primary" />
        <StatCard label="Courses Taught" value={stats?.coursesTaught ?? 0} icon={BookOpen} accent="green" />
        <StatCard label="Total Students" value={stats?.studentCount ?? 0} icon={Users} accent="amber" />
        <StatCard label="Attendance Pending" value={stats?.attendancePendingCount ?? 0} icon={Clock} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Students Present Today" value={present} icon={CalendarCheck} accent="green" />
        <StatCard label="Students Absent Today" value={absent} icon={CalendarCheck} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Clock size={16} /> Today's Timetable
          </h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.todaysTimetable || []).map((p, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-800 dark:text-gray-200">
                  {p.subject} <span className="text-gray-400">— Section {p.section}</span>
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {p.startTime}–{p.endTime}
                </span>
              </li>
            ))}
            {!stats?.todaysTimetable?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No periods scheduled today.</p>}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <BookOpen size={16} /> Recent Notices
          </h2>
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
    </div>
  );
}
