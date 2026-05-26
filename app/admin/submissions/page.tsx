'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase/client';
import { isAdminUser } from '../../../lib/auth';
import type { Category, CardRow } from '../../../lib/types';

type PendingCard = CardRow;

function getCardAvatar(card: PendingCard) {
  return (
    card.profile_photo_url ||
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(card.name)}`
  );
}

export default function SubmissionsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cards, setCards] = useState<PendingCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const router = useRouter();

  const categoriesById = useMemo<Record<string, Category>>(
    () =>
      Object.fromEntries(categories.map((category) => [category.id, category])) as Record<
        string,
        Category
      >,
    [categories]
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email ?? null;

      if (!isAdminUser(email)) {
        router.push('/');
        return;
      }

      setUserEmail(email);

      const [
        { data: cardsData, error: cardsError },
        { data: categoriesData, error: categoriesError },
      ] = await Promise.all([
        supabase
          .from('cards')
          .select(
            `
              id,
              name,
              title,
              company,
              phone,
              email,
              website,
              category_id,
              created_at,
              updated_at,
              status,
              profile_photo_url,
              approved_at,
              session_id
            `
          )
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, color, created_at, updated_at')
          .order('name', { ascending: true }),
      ]);

      if (cardsError) {
        toast.error(`Failed to load submissions: ${cardsError.message}`);
      } else {
        setCards((cardsData ?? []) as PendingCard[]);
      }

      if (categoriesError) {
        toast.error(`Failed to load categories: ${categoriesError.message}`);
      } else {
        setCategories(categoriesData ?? []);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleApprove = async (id: string) => {
    setActingId(id);

    const { error } = await supabase
      .from('cards')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error(`Approval failed: ${error.message}`);
      setActingId(null);
      return;
    }

    setCards((prev) => prev.filter((card) => card.id !== id));
    setActingId(null);
    toast.success('Card approved and published.');
  };

  const handleReject = async (id: string) => {
    setActingId(id);

    const { error } = await supabase
      .from('cards')
      .update({
        status: 'rejected',
      })
      .eq('id', id);

    if (error) {
      toast.error(`Rejection failed: ${error.message}`);
      setActingId(null);
      return;
    }

    setCards((prev) => prev.filter((card) => card.id !== id));
    setActingId(null);
    toast.success('Card rejected.');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <div className="rounded-3xl border border-black/5 bg-white/70 p-10 text-center text-zinc-500 shadow-sm dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-400">
          Loading submissions...
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Directory
          </Link>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Pending Submissions
          </h1>

          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            Review public submissions before they appear in the directory.
          </p>
        </div>

        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {cards.length} pending
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white/80 p-10 text-center text-zinc-500 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-400">
          No pending submissions. You are all caught up.
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const category = categoriesById[card.category_id] ?? null;
            const isActing = actingId === card.id;

            return (
              <article
                key={card.id}
                className="rounded-3xl border border-black/5 bg-white/85 p-6 shadow-sm transition-colors dark:border-white/10 dark:bg-zinc-900/85"
              >
                <div className="flex items-start gap-5">
                  <img
                    src={getCardAvatar(card)}
                    alt={card.name}
                    className="h-16 w-16 rounded-2xl bg-zinc-100 object-cover ring-2 ring-white shadow-sm dark:bg-zinc-800 dark:ring-zinc-900"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <h2 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {card.name}
                      </h2>

                      {category ? (
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${category.color}`}
                        >
                          {category.name}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm text-zinc-500 italic dark:text-zinc-400">
                      {card.title}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {card.company}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {card.email ? <span>✉ {card.email}</span> : null}
                      {card.phone ? <span>📞 {card.phone}</span> : null}
                      {card.website ? <span>🌐 {card.website}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(card.id)}
                      disabled={isActing}
                      className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {isActing ? 'Working...' : 'Approve'}
                    </button>

                    <button
                      onClick={() => handleReject(card.id)}
                      disabled={isActing}
                      className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}