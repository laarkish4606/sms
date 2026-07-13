import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import AdminDashboard from './AdminDashboard.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';

export default function Dashboard() {
  const user = useAppSelector(selectCurrentUser);

  if (user?.role === 'school_admin' || user?.role === 'accountant') return <AdminDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'student' || user?.role === 'parent') return <StudentDashboard />;
  // Super admins manage schools rather than a single school's day-to-day stats.
  if (user?.role === 'super_admin') return <Navigate to="/schools" replace />;
  return null;
}
