'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { isAdminUser } from '../lib/auth';
import { toast } from 'sonner';

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setUser(user ?? null);
      setReady(true);
    };

    loadUser(); 

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      toast.error(`Sign in failed: ${error.message}`, { duration: 6000 });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(`Sign out failed: ${error.message}`, { duration: 6000 });
    }
  };

  if (!ready) {
    return <div className="h-10 w-52" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="h-4 w-4"
        />
        Sign in with Google
      </button>
    );
  }

  const isAdmin = isAdminUser(user.email);

  return (
    <div className="flex items-center gap-3 rounded-full border border-black/5 bg-white/80 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
      <span className="max-w-[240px] truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {user.email}
      </span>

      {isAdmin ? (
        <Link
          href="/admin/submissions"
          className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
        >
          Admin
        </Link>
      ) : null}

      <button
        type="button"
        onClick={handleSignOut}
        className="text-xs font-semibold uppercase tracking-wide text-red-500 transition-colors hover:text-red-600"
      >
        Sign Out
      </button>
    </div>
  );
}