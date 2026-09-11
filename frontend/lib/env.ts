/**
 * Адрес бэкенда. Пока NEXT_PUBLIC_API_URL не задан (.env.local),
 * запросы к API не отправляются — авторизация остаётся в состоянии
 * "unauthenticated" без сетевых ошибок в консоли.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || null;
