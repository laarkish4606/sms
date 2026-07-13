import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">School Management System</h1>
        </div>
        <div className="card p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
