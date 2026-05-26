import type { CardFormData } from './types';

export const EMPTY_FORM: CardFormData = {
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  category_id: '',
  bio: '',
};

export const FIELD_CLASS =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

export const TAILWIND_CATEGORY_CLASS_SAFELIST = [
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