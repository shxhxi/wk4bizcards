'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { isAdminUser } from '../lib/auth';

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function HeaderActionButton() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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

    const handleVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ open: boolean }>;
      setFormOpen(!!customEvent.detail?.open);
    };

    window.addEventListener(
      'add-card-form-visibility',
      handleVisibility as EventListener
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener(
        'add-card-form-visibility',
        handleVisibility as EventListener
      );
    };
  }, []);

  if (!ready) {
    return <div className="h-11 w-[170px]" />;
  }

  const isAdmin = isAdminUser(user?.email);

  if (isAdmin) {
    if (formOpen) {
      return <div className="h-11 w-[170px]" />;
    }

    return (
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event('open-add-card-form'));
        }}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
      >
        <PlusIcon />
        Add Business Card
      </button>
    );
  }

  return (
    <Link
      href="/submit"
      className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
    >
      Submit a Card
    </Link>
  );
}