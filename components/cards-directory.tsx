'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase/client';

type Category = {
  id: string;
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
  initialCards: CardRow[];
  categories: Category[];
};

const EMPTY_FORM = {
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  category_id: '',
};

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

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '').trim().toLowerCase();

function sortCards(cards: CardRow[]) {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name));
}

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

function normalizeWebsiteInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getPhoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

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

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function CardsDirectory({ initialCards, categories }: Props) {
  const [cards, setCards] = useState<CardRow[]>(sortCards(initialCards));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [user, setUser] = useState<any>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);
    };

    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin =
    !!user?.email && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) {
      setShowAddForm(false);
      setEditingId(null);
    }
  }, [isAdmin]);

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'All') return cards;
    return cards.filter((card) => card.categories?.name === selectedCategory);
  }, [cards, selectedCategory]);

  const selectedAddCategory =
    categories.find((category) => category.id === addFormData.category_id) ?? null;

  const selectedEditCategory =
    categories.find((category) => category.id === editFormData.category_id) ?? null;

  const handleEditClick = (card: CardRow) => {
    setEditingId(card.id);
    setEditFormData({
      id: card.id,
      name: card.name,
      title: card.title,
      company: card.company,
      email: card.email,
      phone: card.phone ?? '',
      website: card.website ?? '',
      category_id: card.category_id ?? '',
    });
  };

  const handleSave = async (id: string) => {
    const payload = {
      name: editFormData.name?.trim() ?? '',
      title: editFormData.title?.trim() ?? '',
      company: editFormData.company?.trim() ?? '',
      email: editFormData.email?.trim() ?? '',
      phone: editFormData.phone?.trim() || null,
      website: normalizeWebsiteInput(editFormData.website ?? ''),
      category_id: editFormData.category_id || null,
    };

    if (!payload.name || !payload.title || !payload.company || !payload.email) {
      alert('Name, title, company, and email are required.');
      return;
    }

    const { error } = await supabase.from('cards').update(payload).eq('id', id);

    if (error) {
      alert(`Update failed: ${error.message}`);
      return;
    }

    const category =
      categories.find((item) => item.id === payload.category_id) ?? null;

    setCards((prev) =>
      sortCards(
        prev.map((card) =>
          card.id === id
            ? {
                ...card,
                ...payload,
                categories: category,
              }
            : card
        )
      )
    );

    setEditingId(null);
  };

  const handleAdd = async () => {
    const payload = {
      name: addFormData.name.trim(),
      title: addFormData.title.trim(),
      company: addFormData.company.trim(),
      email: addFormData.email.trim(),
      phone: addFormData.phone.trim() || null,
      website: normalizeWebsiteInput(addFormData.website),
      category_id: addFormData.category_id || null,
    };

    if (!payload.name || !payload.title || !payload.company || !payload.email) {
      alert('Name, title, company, and email are required.');
      return;
    }

    setAdding(true);

    const { data, error } = await supabase
      .from('cards')
      .insert([payload])
      .select(
        `
          id,
          name,
          title,
          company,
          phone,
          email,
          website,
          category_id
        `
      )
      .single();

    if (error) {
      alert(`Add failed: ${error.message}`);
      setAdding(false);
      return;
    }

    const category =
      categories.find((item) => item.id === payload.category_id) ?? null;

    setCards((prev) =>
      sortCards([
        ...prev,
        {
          ...(data as Omit<CardRow, 'categories'>),
          categories: category,
        },
      ])
    );

    setAddFormData(EMPTY_FORM);
    setShowAddForm(false);
    setAdding(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete ${name}'s business card?`);
    if (!confirmed) return;

    setDeletingId(id);

    const { error } = await supabase.from('cards').delete().eq('id', id);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setCards((prev) => prev.filter((card) => card.id !== id));

    if (editingId === id) {
      setEditingId(null);
    }

    setDeletingId(null);
  };

  return (
    <>
      {isAdmin ? (
        <div className="mb-8 flex justify-start">
          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setAddFormData(EMPTY_FORM);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700"
            aria-label={showAddForm ? 'Cancel adding business card' : 'Add business card'}
            title={showAddForm ? 'Cancel' : 'Add business card'}
          >
            <PlusIcon />
            {showAddForm ? 'Cancel' : 'Add Business Card'}
          </button>
        </div>
      ) : null}

      {isAdmin && showAddForm ? (
        <div className="mb-10 rounded-3xl border border-black/5 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/85">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            New Business Card
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Name *
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.name}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, name: e.target.value })
                }
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Title *
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.title}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, title: e.target.value })
                }
                placeholder="Job Title"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Company *
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.company}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, company: e.target.value })
                }
                placeholder="Company Name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Category
              </label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.category_id}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {selectedAddCategory ? (
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${selectedAddCategory.color}`}
                  >
                    {selectedAddCategory.name}
                  </span>
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Email *
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.email}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Phone
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.phone}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, phone: e.target.value })
                }
                placeholder="(925) 555-0101"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Website
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={addFormData.website}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, website: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
          </div>

          {addFormData.name.trim() ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <img
                src={getAvatarUrl(addFormData.name)}
                alt="Avatar preview"
                className="h-10 w-10 rounded-full bg-zinc-200"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Avatar auto-generated from name
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              {adding ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </div>
      ) : null}

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
              key={category.id}
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
          {filteredCards.map((card) => {
            const isEditing = editingId === card.id;
            const isDeleting = deletingId === card.id;

            return (
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
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.name ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Name"
                        />

                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.title ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              title: e.target.value,
                            })
                          }
                          placeholder="Title"
                        />

                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.company ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              company: e.target.value,
                            })
                          }
                          placeholder="Company"
                        />

                        <select
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.category_id ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              category_id: e.target.value,
                            })
                          }
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>

                        {selectedEditCategory ? (
                          <div>
                            <span
                              className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${selectedEditCategory.color}`}
                            >
                              {selectedEditCategory.name}
                            </span>
                          </div>
                        ) : null}

                        <input
                          type="email"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.email ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                        />

                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.phone ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Phone"
                        />

                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          value={editFormData.website ?? ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              website: e.target.value,
                            })
                          }
                          placeholder="https://example.com"
                        />

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSave(card.id)}
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-sky-700"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
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

                        {isAdmin ? (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditClick(card)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sky-700 transition hover:bg-sky-600 hover:text-white dark:bg-zinc-800 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white"
                              aria-label={`Edit ${card.name}`}
                              title={`Edit ${card.name}`}
                            >
                              <PencilIcon />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(card.id, card.name)}
                              disabled={isDeleting}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                              aria-label={`Delete ${card.name}`}
                              title={`Delete ${card.name}`}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                {!isEditing ? (
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
                ) : null}
              </article>
            );
          })}
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