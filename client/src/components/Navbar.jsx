import { Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { selectCurrentUser, logout as logoutAction } from '../features/auth/authSlice.js';
import { toggleSidebar } from '../features/ui/uiSlice.js';
import { useLogoutMutation } from '../api/authApi.js';
import { ROLE_LABELS } from '../utils/navConfig.js';
import ThemeToggle from './ThemeToggle.jsx';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // proceed with client-side logout regardless of network failure
    }
    dispatch(logoutAction());
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <button
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400">
            <User size={16} />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
