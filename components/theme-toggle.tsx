'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  localStorage.setItem('theme', theme);
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved ?? (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const chooseTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  if (!theme) {
    return <div className="h-12 w-[110px]" />;
  }

  const baseButton =
    'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200';
  const activeButton =
    'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white';
  const inactiveButton =
    'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-black/5 bg-white/70 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <button
        type="button"
        aria-label="Use light theme"
        aria-pressed={theme === 'light'}
        onClick={() => chooseTheme('light')}
        className={`${baseButton} ${theme === 'light' ? activeButton : inactiveButton}`}
      >
        <SunIcon />
      </button>

      <button
        type="button"
        aria-label="Use dark theme"
        aria-pressed={theme === 'dark'}
        onClick={() => chooseTheme('dark')}
        className={`${baseButton} ${theme === 'dark' ? activeButton : inactiveButton}`}
      >
        <MoonIcon />
      </button>
    </div>
  );
}