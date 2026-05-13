'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(`Sign in failed: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Sign out failed: ${error.message}`);
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

  return (
    <div className="flex items-center gap-3 rounded-full border border-black/5 bg-white/80 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
      <span className="max-w-[240px] truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {user.email}
      </span>

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