'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const current = document.documentElement.dataset.theme || localStorage.getItem('dv_theme') || 'dark';
    setTheme(current);
    document.documentElement.dataset.theme = current;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('dv_theme', next);
  };

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      aria-label={isLight ? 'Switch to night theme' : 'Switch to day theme'}
      title={isLight ? 'Night mode' : 'Day mode'}
      onClick={toggleTheme}
      className={`theme-icon-btn h-11 w-11 rounded-xl shrink-0 ${className}`}
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
