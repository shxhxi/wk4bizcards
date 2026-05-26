import type { Tables, TablesInsert } from './database.types';

export type Category = Tables<'categories'>;

export type CardTableRow = Tables<'cards'>;

export type CardRowFromQuery = CardTableRow & {
  categories: Category | Category[] | null;
};

export type CardRow = CardTableRow & {
  categories: Category | null;
};

export type CardFormData = {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  category_id: string;
  bio: string;
};

export type CardWritePayload = Pick<
  TablesInsert<'cards'>,
  'name' | 'title' | 'company' | 'email' | 'phone' | 'website' | 'category_id' | 'bio'
>;