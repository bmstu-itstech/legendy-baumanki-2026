import type { AuthenticatedUser, LoginPayload, RegisterPayload } from "@/lib/types";

import { apiFetch } from "./client";

type AuthenticatedUserDto = {
  id: number;
  is_superuser: boolean;
};

function userFromDto(dto: AuthenticatedUserDto): AuthenticatedUser {
  return { id: dto.id, isSuperuser: dto.is_superuser };
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiFetch<{ id: number }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          utm_source: payload.utmSource ?? null,
          utm_campaign: payload.utmCampaign ?? null,
        }),
      },
      { skipAuth: true },
    ),

  // Тело ответа пустое ({}) — сессия выдаётся через httpOnly refresh-cookie
  // + access-токен в заголовке ответа (см. lib/api/client.ts).
  login: (payload: LoginPayload) =>
    apiFetch<void>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(payload) },
      { skipAuth: true },
    ),

  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),

  // Используется и для обычного запроса текущего юзера, и как «тихий вход»
  // при загрузке приложения: если access-токена нет, но refresh-cookie жива,
  // бэкенд всё равно ответит 200 и пришлёт новый токен в заголовке.
  me: () => apiFetch<AuthenticatedUserDto>("/auth/me").then(userFromDto),
};
