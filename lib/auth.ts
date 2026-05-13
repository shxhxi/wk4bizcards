const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '')
  .trim()
  .toLowerCase();

export function isAdminUser(email?: string | null) {
  return !!email && !!ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL;
}