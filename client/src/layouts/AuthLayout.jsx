import { Outlet } from 'react-router-dom';
import { GraduationCap, CalendarCheck, BarChart3, DollarSign, MessageCircle, Users, ShieldCheck } from 'lucide-react';
import AuthThemeToggle from '../components/AuthThemeToggle.jsx';

const FEATURES = [
  { icon: CalendarCheck, title: 'Attendance', subtitle: 'Track in real-time' },
  { icon: BarChart3, title: 'Grades', subtitle: 'Analyze performance' },
  { icon: DollarSign, title: 'Fees', subtitle: 'Manage collections' },
  { icon: MessageCircle, title: 'Communication', subtitle: 'Stay connected' },
  { icon: Users, title: 'Students', subtitle: 'Manage records' },
  { icon: ShieldCheck, title: 'Secure', subtitle: 'Data protection' },
];

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero panel — hidden on small screens so mobile goes straight to the form. */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] lg:flex lg:flex-col lg:justify-between lg:rounded-r-[3rem] lg:p-10 xl:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle at 80% 15%, black, transparent 55%)',
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl" />

        <div className="relative space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">School Management System</p>
              <p className="text-sm text-primary-200">Smart School, Better Future</p>
            </div>
          </div>

          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary-100 backdrop-blur">
            ALL-IN-ONE SOLUTION
          </span>

          <h1 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            Manage Smarter.
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-primary-100 bg-clip-text text-transparent">
              Educate Better.
            </span>
          </h1>
          <p className="max-w-md text-primary-100/80">
            A complete platform for schools to manage students, attendance, grading, fees, communication and much
            more efficiently.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, subtitle }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur transition-colors hover:bg-white/10"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/30 text-primary-100">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-primary-200/80">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simple dusk skyline illustration for the school building. */}
        <div className="relative -mx-10 mt-10 h-40 xl:-mx-12">
          <svg viewBox="0 0 600 160" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
            <rect x="40" y="60" width="200" height="100" rx="4" fill="#1e1b4b" opacity="0.9" />
            <rect x="240" y="30" width="140" height="130" rx="4" fill="#2e2a6b" />
            <rect x="380" y="70" width="180" height="90" rx="4" fill="#1e1b4b" opacity="0.9" />
            {Array.from({ length: 24 }).map((_, i) => (
              <rect
                key={i}
                x={260 + (i % 6) * 20}
                y={45 + Math.floor(i / 6) * 22}
                width="10"
                height="12"
                rx="1.5"
                fill="#fbbf24"
                opacity={i % 3 === 0 ? 0.25 : 0.9}
              />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={`l-${i}`} x={55 + (i % 4) * 42} y={80 + Math.floor(i / 4) * 30} width="14" height="16" rx="1.5" fill="#fbbf24" opacity="0.8" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={`r-${i}`} x={400 + (i % 4) * 38} y={90 + Math.floor(i / 4) * 30} width="14" height="16" rx="1.5" fill="#fbbf24" opacity="0.8" />
            ))}
          </svg>
        </div>

        <div className="relative flex justify-center">
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-primary-100 backdrop-blur">
            Secure • Reliable • Efficient
          </span>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
          <AuthThemeToggle />
        </div>

        <div className="w-full max-w-md animate-fadeIn">
          <Outlet />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} School Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
