import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { GraduationCap, X } from 'lucide-react';
import { NAV_ITEMS } from '../utils/navConfig.js';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { selectCurrentUser } from '../features/auth/authSlice.js';
import { closeSidebar, selectSidebarOpen } from '../features/ui/uiSlice.js';

function groupBySection(items) {
  const sections = [];
  items.forEach((item) => {
    let section = sections.find((s) => s.name === item.section);
    if (!section) {
      section = { name: item.section, items: [] };
      sections.push(section);
    }
    section.items.push(item);
  });
  return sections;
}

export default function Sidebar() {
  const user = useAppSelector(selectCurrentUser);
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const dispatch = useAppDispatch();

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const sections = groupBySection(items);

  const content = (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-600/30">
          <GraduationCap size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight text-gray-900 dark:text-gray-100">SMS</p>
          {user?.school?.name && (
            <p className="truncate text-[11px] leading-tight text-gray-500 dark:text-gray-400">{user.school.name}</p>
          )}
        </div>
        <button className="ml-auto md:hidden" onClick={() => dispatch(closeSidebar())} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.name}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
              {section.name}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => dispatch(closeSidebar())}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={clsx(
                          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-600 transition-opacity duration-150',
                          isActive ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <item.icon size={18} className="shrink-0 transition-transform duration-150 group-hover:scale-110" />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 md:flex">{content}</aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => dispatch(closeSidebar())} />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] bg-white shadow-xl dark:bg-gray-950">{content}</aside>
        </div>
      )}
    </>
  );
}
