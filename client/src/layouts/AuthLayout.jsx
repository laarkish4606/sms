import { Outlet } from 'react-router-dom';
import { GraduationCap, BookOpen, Award, Users, CalendarCheck } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero panel — hidden on small screens so mobile goes straight to the form. */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px, 64px 64px',
          }}
        />
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap size={22} />
          </div>
          <span className="text-lg font-bold">School Management System</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Everything your school needs, in one place.
          </h2>
          <p className="mt-3 text-primary-50/90">
            Attendance, grading, fees, and communication for administrators, teachers, students, and parents —
            all in one connected platform.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: CalendarCheck, label: 'Attendance' },
              { icon: Award, label: 'Grading' },
              { icon: Users, label: 'Communication' },
              { icon: BookOpen, label: 'Academics' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                <Icon size={18} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-50/70">© {new Date().getFullYear()} School Management System</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-600/30 lg:hidden">
              <GraduationCap size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Welcome to the School Management System
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Please sign in using your school credentials to continue.
              </p>
            </div>
          </div>
          <div className="card p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
