import type { RatingBoard } from "@/lib/types";

import { apiFetch } from "./client";

type RatingDto = {
  id: number;
  module_id: number | null;
  title: string;
};

type RatingColumnDto = {
  task_id: number;
  index: number;
  title: string;
  max_score: number;
};

type RatingCellDto = {
  task_id: number;
  score: number;
  time: number;
};

type RatingRowDto = {
  position: number;
  team_id: number;
  team_name: string;
  cells: RatingCellDto[];
  total_score: number | null;
  total_time: number | null;
};

type RatingDetailDto = RatingDto & {
  columns: RatingColumnDto[];
  rows: RatingRowDto[];
};

type RatingsListDto = {
  ratings: RatingDto[];
};

function boardFromDetailDto(dto: RatingDetailDto): RatingBoard {
  return {
    id: String(dto.id),
    title: dto.title,
    kind: dto.module_id === null ? "side" : "module",
    moduleId: dto.module_id ?? undefined,
    columns: dto.columns.map((column) => ({
      taskId: column.task_id,
      index: column.index,
      title: column.title,
      maxPoints: column.max_score,
    })),
    rows: dto.rows.map((row) => ({
      place: row.position,
      teamId: row.team_id,
      teamName: row.team_name,
      tasks: row.cells.map((cell) => ({
        taskId: cell.task_id,
        points: cell.score,
        timeSec: cell.time,
      })),
      totalPoints: row.total_score ?? 0,
      totalTimeSec: row.total_time ?? 0,
    })),
  };
}

export const ratingApi = {
  getRatings: () => apiFetch<RatingsListDto>("/ratings/").then((dto) => dto.ratings),

  getRating: (id: number) => apiFetch<RatingDetailDto>(`/ratings/${id}`).then(boardFromDetailDto),
};
