import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useGetMeQuery } from '../api/authApi.js';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { setCredentials, selectCurrentUser } from '../features/auth/authSlice.js';
import Spinner from '../components/Spinner.jsx';

// Resolves the refresh-token cookie into a live session on first load,
// so a page refresh doesn't force the user back to /login.
export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading, isUninitialized } = useGetMeQuery(undefined, { skip: Boolean(user) });

  useEffect(() => {
    if (data?.data) dispatch(setCredentials({ user: data.data }));
  }, [data, dispatch]);

  if (!user && (isLoading || isUninitialized)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  return <Outlet />;
}
