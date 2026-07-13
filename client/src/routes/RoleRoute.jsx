import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks.js';
import { selectCurrentUser } from '../features/auth/authSlice.js';

export default function RoleRoute({ roles }) {
  const user = useAppSelector(selectCurrentUser);

  if (!user) return null;
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />;

  return <Outlet />;
}
