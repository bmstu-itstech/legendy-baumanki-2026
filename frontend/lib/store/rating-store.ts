import { create } from "zustand";

import { ratingApi } from "@/lib/api/rating";
import { toErrorMessage } from "@/lib/api/errors";
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

  fetch: async () => {
    set({ status: "loading", error: null });
    try {
      const ratings = await ratingApi.getRatings();
      const boards = await Promise.all(ratings.map((rating) => ratingApi.getRating(rating.id)));
      set({ boards, status: "loaded" });
    } catch (err) {
      set({ status: "error", error: toErrorMessage(err) });
    }
  },
}));
