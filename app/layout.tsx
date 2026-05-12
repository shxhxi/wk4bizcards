import type { Metadata } from 'next';
import './globals.css';
import ThemeToggle from '../components/theme-toggle';

export const metadata: Metadata = {
  title: 'WK3 Biz Cards',
  description: 'Business card directory',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-100 text-zinc-900 antialiased transition-colors duration-300 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-900 dark:text-zinc-100">
        <header className="mx-auto flex max-w-7xl justify-end px-6 pt-6 sm:px-8">
          <ThemeToggle />
        </header>

        {children}
      </body>
    </html>
  );
}