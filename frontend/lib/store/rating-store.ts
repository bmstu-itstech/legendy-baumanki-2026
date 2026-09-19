import { create } from "zustand";

import { MOCK_RATING_BOARDS } from "@/lib/mocks/tasks";
import type { RatingBoard } from "@/lib/types";

type RatingStatus = "idle" | "loading" | "loaded" | "error";

type RatingState = {
  boards: RatingBoard[];
  status: RatingStatus;
  error: string | null;
};

type RatingActions = {
  fetch: () => Promise<void>;
};

export const useRatingStore = create<RatingState & RatingActions>((set) => ({
  boards: [],
  status: "idle",
  error: null,

  // TODO: заменить на lib/api/rating.ts, когда появится бэкенд — пока моки.
  fetch: async () => {
    set({ status: "loading", error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      set({ boards: MOCK_RATING_BOARDS, status: "loaded" });
    } catch {
      set({ status: "error", error: "Не удалось загрузить рейтинг" });
    }
  },
}));
