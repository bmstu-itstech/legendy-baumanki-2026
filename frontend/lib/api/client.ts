import { API_BASE_URL } from "@/lib/env";

import { ApiError } from "./errors";
import { tokenStore } from "./token-store";

/**
 * Бэкенд присылает access-токен в заголовке `Authorization: Bearer <token>`
 * — и при логине/регистрации (тело ответа у этих ручек пустое: `{}`), и
 * молча при каждом запросе, если старый токен устарел, но refresh-cookie
 * ещё жива. Отдельного /auth/refresh в API нет — обновление вшито в
 * обычный ответ.
 *
 * Важно: чтобы браузер вообще отдал JS этот заголовок ответа, бэкенду
 * нужно явно открыть его через CORS — `Access-Control-Expose-Headers:
 * Authorization` (без этого fetch Response.headers.get будет молча
 * возвращать null, даже если сервер заголовок реально прислал).
 */
const ACCESS_TOKEN_HEADER = "Authorization";
const BEARER_PREFIX = "Bearer ";

type ApiFetchOptions = {
  /** Не слать заголовок Authorization (логин/регистрация — токена ещё нет). */
  skipAuth?: boolean;
};

function captureTokenFromResponse(response: Response) {
  const header = response.headers.get(ACCESS_TOKEN_HEADER);
  if (!header) return;
  const token = header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : header;
  tokenStore.set(token);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  { skipAuth }: ApiFetchOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL не настроен");
  }

  const headers = new Headers(init.headers);
  // FormData (загрузка файла) сама выставляет Content-Type с boundary —
  // навязанный application/json ломает multipart-запрос на бэкенде.
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = tokenStore.get();
  if (token && !skipAuth) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    // Нужно всегда — именно так браузер шлёт/принимает httpOnly
    // refresh-cookie. Требует от бэкенда настроенного CORS с
    // credentials и конкретным (не "*") Access-Control-Allow-Origin.
    credentials: "include",
  });

  // Токен может обновиться даже в ответе на неуспешный запрос — ловим в любом случае.
  captureTokenFromResponse(response);

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      // Access-токен невалиден и refresh-cookie не смогла его обновить —
      // сессия на бэкенде истекла.
      tokenStore.clear();
      tokenStore.notifyExpired();
    }
    const body = await response.json().catch(() => null);
    const detailMessage =
      typeof body?.detail === "string" ? body.detail : body?.detail?.[0]?.msg;
    // error_code — стабильный машиночитаемый код от бэкенда (см.
    // AppException.error_code на бэкенде). detailMessage — сырой,
    // технический текст (иногда на английском, иногда с чувствительными
    // деталями вроде email) и используется только для логов/дебага, в UI
    // его показывать нельзя — см. toErrorMessage в ./errors.
    const code = typeof body?.error_code === "string" ? body.error_code : undefined;
    throw new ApiError(
      response.status,
      detailMessage ?? body?.message ?? response.statusText,
      body,
      code,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
