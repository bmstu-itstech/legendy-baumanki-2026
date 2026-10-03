import type { FinalOverview } from "@/lib/types";

import { apiFetch } from "./client";

type FinalSlotDto = {
  id: number;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
};

type FinalOverviewDto = {
  deadline: string;
  booking_open: boolean;
  has_team: boolean;
  is_captain: boolean;
  booked_slot_id: number | null;
  team_size: number | null;
  min_team_size: number;
  slots: FinalSlotDto[];
};

function overviewFromDto(dto: FinalOverviewDto): FinalOverview {
  return {
    deadline: dto.deadline,
    bookingOpen: dto.booking_open,
    hasTeam: dto.has_team,
    isCaptain: dto.is_captain,
    bookedSlotId: dto.booked_slot_id,
    teamSize: dto.team_size,
    minTeamSize: dto.min_team_size,
    slots: dto.slots.map((slot) => ({
      id: slot.id,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      capacity: slot.capacity,
      booked: slot.booked,
    })),
  };
}

// Запись и отмена возвращают свежий обзор целиком — счётчики мест у
// остальных слотов тоже могли поменяться, пока страница была открыта.
export const finalApi = {
  get: () => apiFetch<FinalOverviewDto>("/final").then(overviewFromDto),

  book: (slotId: number) =>
    apiFetch<FinalOverviewDto>(`/final/slots/${slotId}/book`, { method: "POST" }).then(
      overviewFromDto,
    ),

  cancel: () =>
    apiFetch<FinalOverviewDto>("/final/booking", { method: "DELETE" }).then(overviewFromDto),
};
