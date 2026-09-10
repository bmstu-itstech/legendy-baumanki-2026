/**
 * Access-токен живёт только в памяти (module-level, вне React) — так его
 * видит и apiFetch (для заголовка Authorization), и auth-store (для UI),
 * без циклических импортов между ними. Refresh-токен фронт не видит:
 * он в httpOnly cookie, которую бэкенд сам ставит и читает, и сам же
 * молча продлевает access-токен в заголовке ответа, когда старый истёк
 * (см. lib/api/client.ts).
 */
let accessToken: string | null = null;
let expiredHandler: (() => void) | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
  /** Вызывается один раз при инициализации auth-store. */
  onExpire: (handler: () => void) => {
    expiredHandler = handler;
  },
  /** apiFetch зовёт это, если тихий refresh не удался — сессия истекла. */
  notifyExpired: () => {
    expiredHandler?.();
  },
};
