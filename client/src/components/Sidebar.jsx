import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { GraduationCap, X } from 'lucide-react';
import { NAV_ITEMS } from '../utils/navConfig.js';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { selectCurrentUser } from '../features/auth/authSlice.js';
import { closeSidebar, selectSidebarOpen } from '../features/ui/uiSlice.js';

export default function Sidebar() {
  const user = useAppSelector(selectCurrentUser);
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const dispatch = useAppDispatch();

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <GraduationCap className="text-primary-600" size={26} />
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">SMS</span>
        <button className="ml-auto md:hidden" onClick={() => dispatch(closeSidebar())} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => dispatch(closeSidebar())}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 md:flex">{content}</aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => dispatch(closeSidebar())} />
          <aside className="relative z-10 h-full w-64 bg-white dark:bg-gray-950">{content}</aside>
        </div>
      )}
    </>
  );
}
