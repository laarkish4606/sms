import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import MarkAttendance from './MarkAttendance.jsx';
import MyAttendance from './MyAttendance.jsx';

export default function AttendancePage() {
  const user = useAppSelector(selectCurrentUser);

  if (user?.role === 'school_admin' || user?.role === 'teacher') return <MarkAttendance />;
  return <MyAttendance />;
}
