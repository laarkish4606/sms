import { useEffect } from 'react';
import { useAppSelector } from '../app/hooks.js';
import { selectTheme } from '../features/theme/themeSlice.js';

export default function ThemeProvider({ children }) {
  const mode = useAppSelector(selectTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return children;
}
