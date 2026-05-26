'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/client';
import type { Category } from '../../lib/types';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

type SubmitForm = {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  category_id: string;
};

const EMPTY_FORM: SubmitForm = {
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  category_id: '',
};

export default function SubmitPage() {
  const [form, setForm] = useState<SubmitForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) {
        toast.error(`Failed to load categories: ${error.message}`);
      } else {
        setCategories(data ?? []);
      }

      setLoadingCategories(false);
    };

    loadCategories();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PNG and JPG files are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Photo must be under 2MB.');
      return;
    }

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.title.trim() ||
      !form.company.trim() ||
      !form.email.trim() ||
      !form.category_id
    ) {
      toast.error('Name, title, company, email, and category are required.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await fetch('/api/submit-card', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      setSubmitted(true);
      toast.success('Your card has been submitted for review.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border border-black/5 bg-white/85 p-10 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900/85">
          <div className="mb-4 text-5xl">✅</div>

          <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Submitted for Review
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400">
            Thank you. Your business card has been submitted and will appear in the
            directory once approved.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-sky-600 hover:underline dark:text-sky-400"
          >
            ← Back to Directory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Directory
        </Link>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Submit Your Business Card
        </h1>

        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Fill in your details below. Your card will be reviewed before appearing in
          the directory.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-black/5 bg-white/85 p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/85"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Name', key: 'name', required: true, placeholder: 'Full Name' },
            { label: 'Title', key: 'title', required: true, placeholder: 'Job Title' },
            { label: 'Company', key: 'company', required: true, placeholder: 'Company Name' },
            {
              label: 'Email',
              key: 'email',
              required: true,
              placeholder: 'email@example.com',
              type: 'email',
            },
            { label: 'Phone', key: 'phone', placeholder: '555-0100' },
            { label: 'Website', key: 'website', placeholder: 'https://example.com'},
          ].map(({ label, key, required, placeholder, type }) => (
            <div key={key} className={key === 'website' ? 'sm:col-span-2' : ''}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label} {required ? <span className="text-red-500">*</span> : null}
              </label>

              <input
                type={type || 'text'}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={form[key as keyof SubmitForm]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder={placeholder}
              />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Category <span className="text-red-500">*</span>
            </label>

            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={form.category_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category_id: e.target.value }))
              }
              disabled={loadingCategories}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Profile Photo{' '}
              <span className="font-normal normal-case tracking-normal text-zinc-400 dark:text-zinc-500">
                (optional, PNG/JPG, max 2MB)
              </span>
            </label>

            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mb-3 h-20 w-20 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : null}

            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handlePhotoChange}
              className="w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200 dark:hover:file:bg-zinc-700"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-sky-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </main>
  );
}