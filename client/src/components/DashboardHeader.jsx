import { useAppSelector } from '../app/hooks.js';
import { selectCurrentUser } from '../features/auth/authSlice.js';

// Shows "Welcome to <School Name>" using the school info attached to the
// logged-in user's session (see auth.controller.js publicUser/loadSchool),
// with an optional personal greeting underneath.
export default function DashboardHeader({ greeting }) {
  const user = useAppSelector(selectCurrentUser);
  const schoolName = user?.school?.name;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {schoolName ? `Welcome to ${schoolName}` : 'Dashboard'}
      </h1>
      {greeting && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{greeting}</p>}
    </div>
  );
}
