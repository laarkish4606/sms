import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { selectTheme, toggleTheme } from '../features/theme/themeSlice.js';

export default function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectTheme);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
