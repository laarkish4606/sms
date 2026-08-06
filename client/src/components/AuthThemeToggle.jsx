import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { selectTheme, setTheme } from '../features/theme/themeSlice.js';

// Segmented sun/moon control (both options always visible, active one
// highlighted) — distinct from the single-icon ThemeToggle used in the
// dashboard navbar, matching the auth page's reference design.
export default function AuthThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectTheme);

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur dark:bg-gray-800/90">
      <button
        onClick={() => dispatch(setTheme('light'))}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          mode === 'light' ? 'bg-gray-100 text-warning-500' : 'text-gray-400 hover:text-gray-600'
        )}
        aria-label="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => dispatch(setTheme('dark'))}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          mode === 'dark' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-gray-600'
        )}
        aria-label="Dark mode"
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
