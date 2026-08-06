import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import AdminDashboard from './AdminDashboard.jsx';
import AccountantDashboard from './AccountantDashboard.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import ParentDashboard from './ParentDashboard.jsx';

export default function Dashboard() {
  const user = useAppSelector(selectCurrentUser);

  if (user?.role === 'school_admin') return <AdminDashboard />;
  if (user?.role === 'accountant') return <AccountantDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'parent') return <ParentDashboard />;
  // Super admins manage schools rather than a single school's day-to-day stats.
  if (user?.role === 'super_admin') return <Navigate to="/schools" replace />;
  return null;
}
