export const ADMIN_EMAIL = 'systemconsultwork@gmail.com';

export const isAdminEmail = (email?: string | null): boolean =>
  Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL);
