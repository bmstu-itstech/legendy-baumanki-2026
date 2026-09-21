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
      // allSettled, а не all: один недоступный рейтинг (например, только что
      // удалённый модуль) не должен ронять всю страницу в ошибку — остальные
      // борды при этом показываются нормально, а если не выжил ни один, ниже
      // просто получаем пустой boards и rating-table отрисует "Рейтинг пока пуст.".
      const results = await Promise.allSettled(
        ratings.map((rating) => ratingApi.getRating(rating.id)),
      );
      const boards = results
        .filter((result): result is PromiseFulfilledResult<RatingBoard> => result.status === "fulfilled")
        .map((result) => result.value);
      set({ boards, status: "loaded" });
    } catch (err) {
      set({ status: "error", error: toErrorMessage(err) });
    }
  },
}));
