import { connection } from 'next/server';
import { createSupabaseServerClient } from '../lib/supabase/server';
import CardsDirectory from '../components/cards-directory';
import type { Category, CardRow, CardRowFromQuery } from '../lib/types';

function normalizeCard(card: CardRowFromQuery): CardRow {
  return {
    ...card,
    categories: Array.isArray(card.categories)
      ? (card.categories[0] ?? null)
      : card.categories,
  };
}

export default async function HomePage() {
  await connection();

  const supabase = await createSupabaseServerClient();

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
          categories:category_id (
            id,
            name,
            color
          )
        `
      )
      .order('name', { ascending: true }),
    supabase
      .from('categories')
      .select(
        `
          id,
          name,
          color
        `
      )
      .order('name', { ascending: true }),
  ]);

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  const cards: CardRow[] = ((cardsData ?? []) as CardRowFromQuery[]).map(normalizeCard);
  const categories: Category[] = (categoriesData ?? []) as Category[];

  return (
    <main className="mx-auto max-w-7xl px-6 pb-12 pt-4 sm:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Directory
        </p>

        <h1 className="mt-2 bg-gradient-to-r from-sky-600 via-violet-600 to-pink-600 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl dark:from-sky-400 dark:via-violet-400 dark:to-pink-400">
          Business Cards
        </h1>

        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-300">
          Sorted by name and loaded live from Supabase.
        </p>
      </div>

      <CardsDirectory initialCards={cards} categories={categories} />
    </main>
  );
}