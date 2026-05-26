'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { isAdminUser } from '../lib/auth';
import {
  EMPTY_FORM,
  FIELD_CLASS,
  TAILWIND_CATEGORY_CLASS_SAFELIST,
} from '../lib/constants';
import type {
  Category,
  CardFormData,
  CardRow,
  CardWritePayload,
} from '../lib/types';
import { toast } from 'sonner';

type Props = {
  initialCards: CardRow[];
  categories: Category[];
};

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'email';
  required?: boolean;
  className?: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  required?: boolean;
};

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

function buildCardPayload(formData: CardFormData): CardWritePayload {
  return {
    name: formData.name.trim(),
    title: formData.title.trim(),
    company: formData.company.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim() || null,
    website: normalizeWebsiteInput(formData.website),
    category_id: formData.category_id.trim(),
  };
}

function isPayloadValid(payload: CardWritePayload) {
  return !!(
    payload.name &&
    payload.title &&
    payload.company &&
    payload.email &&
    payload.category_id
  );
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  className = '',
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type={type}
        className={FIELD_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  categories,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
        {required ? ' *' : ''}
      </label>
      <select
        className={FIELD_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CardsDirectory({ initialCards, categories }: Props) {
  const [cards, setCards] = useState<CardRow[]>(() => sortCards(initialCards));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [user, setUser] = useState<User | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<CardFormData>(EMPTY_FORM);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState<CardFormData>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setCards(sortCards(initialCards));
  }, [initialCards]);

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

  const categoriesById = useMemo<Record<string, Category>>(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, category])
      ) as Record<string, Category>,
    [categories]
  );

  const isAdmin = isAdminUser(user?.email);

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
    addFormData.category_id ? categoriesById[addFormData.category_id] ?? null : null;

  const selectedEditCategory =
    editFormData.category_id ? categoriesById[editFormData.category_id] ?? null : null;

  const handleEditClick = (card: CardRow) => {
    setEditingId(card.id);
    setEditFormData({
      name: card.name,
      title: card.title,
      company: card.company,
      email: card.email,
      phone: card.phone ?? '',
      website: card.website ?? '',
      category_id: card.category_id,
    });
  };

  const handleSave = async (id: string) => {
    const payload = buildCardPayload(editFormData);

    if (!isPayloadValid(payload)) {
      toast.error('Name, title, company, email, and category are required.');
      return;
    }

    setSavingId(id);

    const { error } = await supabase.from('cards').update(payload).eq('id', id);

    if (error) {
      toast.error(`Update failed: ${error.message}`, { duration: 6000 });
      setSavingId(null);
      return;
    }

    const category = categoriesById[payload.category_id] ?? null;

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

    setSavingId(null);
    setEditingId(null);
  };

  const handleAdd = async () => {
    const payload = buildCardPayload(addFormData);

    if (!isPayloadValid(payload)) {
      toast.error('Name, title, company, email, and category are required.');
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
      toast.error(`Add failed: ${error.message}`, { duration: 6000 });
      setAdding(false);
      return;
    }

    const category = categoriesById[payload.category_id] ?? null;

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
      toast.error(`Delete failed: ${error.message}`, { duration: 6000 });
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
            <InputField
              label="Name"
              required
              value={addFormData.name}
              onChange={(value) => setAddFormData({ ...addFormData, name: value })}
              placeholder="Full Name"
            />
            <InputField
              label="Title"
              required
              value={addFormData.title}
              onChange={(value) => setAddFormData({ ...addFormData, title: value })}
              placeholder="Job Title"
            />
            <InputField
              label="Company"
              required
              value={addFormData.company}
              onChange={(value) => setAddFormData({ ...addFormData, company: value })}
              placeholder="Company Name"
            />
            <SelectField
              label="Category"
              required
              value={addFormData.category_id}
              onChange={(value) =>
                setAddFormData({ ...addFormData, category_id: value })
              }
              categories={categories}
            />
            <InputField
              label="Email"
              required
              type="email"
              value={addFormData.email}
              onChange={(value) => setAddFormData({ ...addFormData, email: value })}
              placeholder="email@example.com"
            />
            <InputField
              label="Phone"
              value={addFormData.phone}
              onChange={(value) => setAddFormData({ ...addFormData, phone: value })}
              placeholder="(925) 555-0101"
            />
            <InputField
              label="Website"
              value={addFormData.website}
              onChange={(value) => setAddFormData({ ...addFormData, website: value })}
              placeholder="https://example.com"
              className="sm:col-span-2"
            />
          </div>

          {selectedAddCategory ? (
            <div className="mt-2">
              <span
                className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${selectedAddCategory.color}`}
              >
                {selectedAddCategory.name}
              </span>
            </div>
          ) : null}

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
            const isSaving = savingId === card.id;

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
                    loading="lazy"
                    decoding="async"
                    className="h-[72px] w-[72px] rounded-2xl border border-black/5 bg-gradient-to-br from-sky-100 to-violet-100 shadow-sm dark:border-white/10 dark:from-sky-500/10 dark:to-violet-500/10"
                  />

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <InputField
                          label="Name"
                          value={editFormData.name}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, name: value })
                          }
                          placeholder="Name"
                        />
                        <InputField
                          label="Title"
                          value={editFormData.title}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, title: value })
                          }
                          placeholder="Title"
                        />
                        <InputField
                          label="Company"
                          value={editFormData.company}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, company: value })
                          }
                          placeholder="Company"
                        />
                        <SelectField
                          label="Category"
                          required
                          value={editFormData.category_id}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, category_id: value })
                          }
                          categories={categories}
                        />

                        {selectedEditCategory ? (
                          <div>
                            <span
                              className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${selectedEditCategory.color}`}
                            >
                              {selectedEditCategory.name}
                            </span>
                          </div>
                        ) : null}

                        <InputField
                          label="Email"
                          type="email"
                          value={editFormData.email}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, email: value })
                          }
                          placeholder="Email"
                        />
                        <InputField
                          label="Phone"
                          value={editFormData.phone}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, phone: value })
                          }
                          placeholder="Phone"
                        />
                        <InputField
                          label="Website"
                          value={editFormData.website}
                          onChange={(value) =>
                            setEditFormData({ ...editFormData, website: value })
                          }
                          placeholder="https://example.com"
                        />

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSave(card.id)}
                            disabled={isSaving}
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-sky-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
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
                        <div className="flex items-start gap-2">
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

                          {isAdmin ? (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditClick(card)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sky-700 transition hover:bg-sky-600 hover:text-white dark:bg-zinc-800 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-white"
                                aria-label={`Edit ${card.name}`}
                                title={`Edit ${card.name}`}
                              >
                                <PencilIcon />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(card.id, card.name)}
                                disabled={isDeleting}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                                aria-label={`Delete ${card.name}`}
                                title={`Delete ${card.name}`}
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {card.title}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {card.company}
                        </p>
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