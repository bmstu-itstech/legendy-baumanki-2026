import type {
  CreatedTeam,
  CreateTeamPayload,
  Team,
  TeamMember,
  UpdateTeamPayload,
} from "@/lib/types";

import { apiFetch } from "./client";

type TeamMemberDto = {
  user_id: number;
  full_name: string;
  group: string;
  telegram: string;
  team_id: number;
};

type TeamWithMembersDto = {
  id: number;
  public_code: string;
  name: string;
  members: TeamMemberDto[];
  leader: TeamMemberDto;
  created_at: string;
  updated_at: string;
};

function memberFromDto(dto: TeamMemberDto): TeamMember {
  return {
    userId: dto.user_id,
    fullName: dto.full_name,
    group: dto.group,
    telegram: dto.telegram,
    teamId: dto.team_id,
  };
}

function teamFromDto(dto: TeamWithMembersDto): Team {
  return {
    id: dto.id,
    publicCode: dto.public_code,
    name: dto.name,
    members: dto.members.map(memberFromDto),
    leader: memberFromDto(dto.leader),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export const teamApi = {
  create: (payload: CreateTeamPayload) =>
    apiFetch<{ team_id: number; public_code: string }>("/teams", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((dto): CreatedTeam => ({ teamId: dto.team_id, publicCode: dto.public_code })),

  getMine: () => apiFetch<TeamWithMembersDto>("/teams/my").then(teamFromDto),

  // В API есть только переименование — состав команды правится
  // исключительно через join/leave отдельных участников.
  rename: (payload: UpdateTeamPayload) =>
    apiFetch<TeamWithMembersDto>("/teams", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then(teamFromDto),

  // Ручка join ничего не возвращает (см. backend join_team) — свежие
  // данные команды подтягиваем отдельным getMine() после успешного join.
  join: (teamCode: string) =>
    apiFetch<void>(`/teams/${encodeURIComponent(teamCode)}/join`, {
      method: "POST",
    }),

  leave: () => apiFetch<void>("/teams/leave", { method: "POST" }),
};
