import type { CreateProfilePayload, MyProfile, UpdateProfilePayload } from "@/lib/types";

import { apiFetch } from "./client";

type ProfileReadDto = {
  user_id: number;
  email: string;
  full_name: string;
  group: string;
  telegram: string;
  team_code: string | null;
};

function profileFromDto(dto: ProfileReadDto): MyProfile {
  return {
    userId: dto.user_id,
    email: dto.email,
    fullName: dto.full_name,
    group: dto.group,
    telegram: dto.telegram,
    teamCode: dto.team_code,
  };
}

export const profileApi = {
  // Вызывается один раз сразу после register+login — user_id берётся из
  // ответа register, team_code — из ссылки-приглашения (если по ней пришли).
  create: (payload: CreateProfilePayload) =>
    apiFetch<unknown>("/profiles", {
      method: "POST",
      body: JSON.stringify({
        user_id: payload.userId,
        full_name: payload.fullName,
        group: payload.group,
        telegram: payload.telegram,
        team_code: payload.teamCode ?? null,
      }),
    }),

  getMe: () => apiFetch<ProfileReadDto>("/profiles/me").then(profileFromDto),

  // Ответ PUT /profiles/me — усечённая схема (без email/team_code), поэтому
  // после сохранения профиль перезапрашиваем через getMe(), а не доверяем
  // телу этого ответа (см. profile-store.ts).
  update: (payload: UpdateProfilePayload) =>
    apiFetch<unknown>("/profiles/me", {
      method: "PUT",
      body: JSON.stringify({
        user_id: payload.userId,
        full_name: payload.fullName,
        group: payload.group,
        telegram: payload.telegram,
      }),
    }),
};
