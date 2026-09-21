// Модели данных — соответствуют lb26.openapi.json (v0.1.0).
// Поля переведены в camelCase, camel<->snake маппинг живёт в lib/api/*.

export type AuthenticatedUser = {
  id: number;
  isSuperuser: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  /** Берутся из localStorage (см. lib/utm.ts), куда попадают из query-параметров при первом заходе на сайт. */
  utmSource?: string | null;
  utmCampaign?: string | null;
};

/** GET /profiles/me — единственный эндпоинт, который отдаёт email. */
export type MyProfile = {
  userId: number;
  email: string;
  fullName: string;
  group: string;
  telegram: string;
  /** Код команды, к которой присоединился профиль при регистрации (если был). */
  teamCode: string | null;
};

export type CreateProfilePayload = {
  fullName: string;
  group: string;
  telegram: string;
  /** team_code из ссылки-приглашения — бэкенд сам присоединит к команде. */
  teamCode?: string | null;
};

export type UpdateProfilePayload = {
  userId: number;
  fullName: string;
  group: string;
  telegram: string;
};

/** Профиль участника команды — без email (его отдаёт только /profiles/me). */
export type TeamMember = {
  userId: number;
  fullName: string;
  group: string;
  telegram: string;
  teamId: number;
};

export type Team = {
  id: number;
  publicCode: string;
  name: string;
  members: TeamMember[];
  leader: TeamMember;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeamPayload = {
  name: string;
};

export type UpdateTeamPayload = {
  name: string;
};

export type CreatedTeam = {
  teamId: number;
  publicCode: string;
};
