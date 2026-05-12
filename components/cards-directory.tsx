'use client';

import { useMemo, useState } from 'react';

type Category = {
  name: string;
  color: string;
};

type CardRow = {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string | null;
  email: string;
  website: string | null;
  category_id: string | null;
  categories: Category | null;
};

type Props = {
  cards: CardRow[];
  categories: Category[];
};

function getAvatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function getWebsiteLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getPhoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

const TAILWIND_CATEGORY_CLASS_SAFELIST = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-amber-100 text-amber-800',
  'bg-indigo-100 text-indigo-800',
  'bg-orange-100 text-orange-800',
  'bg-purple-100 text-purple-800',
  'bg-teal-100 text-teal-800',
  'bg-gray-100 text-gray-800',
  'bg-slate-100 text-slate-800',
  'bg-pink-100 text-pink-800',
] as const;

export default function CardsDirectory({ cards, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'All') return cards;
    return cards.filter((card) => card.categories?.name === selectedCategory);
  }, [cards, selectedCategory]);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={() => setSelectedCategory('All')}
    aria-pressed={selectedCategory === 'All'}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      selectedCategory === 'All'
        ? 'scale-105 bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900'
        : 'bg-white text-zinc-700 shadow-sm opacity-60 hover:-translate-y-0.5 hover:opacity-100 dark:bg-zinc-900 dark:text-zinc-200 dark:opacity-55 dark:hover:bg-zinc-800'
    }`}
  >
    All
  </button>

  {categories.map((category) => {
    const isSelected = selectedCategory === category.name;

    return (
      <button
        key={category.name}
        type="button"
        onClick={() => setSelectedCategory(category.name)}
        aria-pressed={isSelected}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${category.color} ${
          isSelected
            ? 'scale-105 shadow-md opacity-100'
            : 'shadow-sm opacity-55 hover:-translate-y-0.5 hover:opacity-100 dark:opacity-45'
        }`}
      >
        {category.name}
      </button>
    );
  })}
</div>

      {filteredCards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No cards found for that category.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card) => (
            <article
              key={card.id}
              className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white/85 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl dark:border-white/10 dark:bg-zinc-900/85 dark:hover:shadow-[0_16px_40px_rgba(220,220,220,0.18)]"
            >
              <div className="relative flex items-start gap-4">
                <img
                  src={getAvatarUrl(card.name)}
                  alt={`${card.name} avatar`}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-2xl border border-black/5 bg-gradient-to-br from-sky-100 to-violet-100 shadow-sm dark:border-white/10 dark:from-sky-500/10 dark:to-violet-500/10"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <h2 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">
                      {card.name}
                    </h2>

                    {card.categories ? (
                      <span
                        className={`shrink-0 rounded-lg border border-black/10 px-3 py-1 text-[11px] font-semibold tracking-wide shadow-sm dark:border-white/10 ${card.categories.color}`}
                      >
                        {card.categories.name}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {card.title}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {card.company}
                  </p>
                </div>
              </div>

              <dl className="relative mt-6 space-y-3 text-sm">
                {card.phone ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">Phone</dt>
                    <dd className="text-right">
                      <a
                        href={getPhoneHref(card.phone)}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {card.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
                  <dd className="min-w-0 text-right">
                    <a
                      href={`mailto:${card.email}`}
                      className="break-all font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {card.email}
                    </a>
                  </dd>
                </div>

                {card.website ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-400">Website</dt>
                    <dd className="text-right">
                      <a
                        href={card.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {getWebsiteLabel(card.website)}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      )}

      <div className="hidden">
        {TAILWIND_CATEGORY_CLASS_SAFELIST.map((classes) => (
          <span key={classes} className={classes} />
        ))}
      </div>
    </>
  );
}