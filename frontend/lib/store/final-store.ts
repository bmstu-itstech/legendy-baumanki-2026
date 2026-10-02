import { create } from "zustand";

import { toErrorMessage } from "@/lib/api/errors";
import { finalApi } from "@/lib/api/final";
import type { FinalOverview } from "@/lib/types";

type FinalStatus = "idle" | "loading" | "loaded" | "error";

type FinalState = {
  overview: FinalOverview | null;
  status: FinalStatus;
  error: string | null;
};

type FinalActions = {
  fetch: () => Promise<void>;
  book: (slotId: number) => Promise<void>;
  cancel: () => Promise<void>;
};

export const useFinalStore = create<FinalState & FinalActions>((set, get) => ({
  overview: null,
  status: "idle",
  error: null,

  fetch: async () => {
    // Повторный заход на вкладку не мигает лоадером — показываем старые
    // данные, пока подтягиваются свежие.
    if (!get().overview) set({ status: "loading", error: null });
    try {
      const overview = await finalApi.get();
      set({ overview, status: "loaded", error: null });
    } catch (err) {
      set({ status: "error", error: toErrorMessage(err) });
    }
  },

  book: async (slotId) => {
    try {
      const overview = await finalApi.book(slotId);
      set({ overview, status: "loaded", error: null });
    } catch (err) {
      // Слот мог заполниться, пока страница была открыта, — обновляем
      // счётчики, чтобы пользователь увидел актуальную картину.
      void get().fetch();
      throw new Error(toErrorMessage(err));
    }
  },

  cancel: async () => {
    try {
      const overview = await finalApi.cancel();
      set({ overview, status: "loaded", error: null });
    } catch (err) {
      void get().fetch();
      throw new Error(toErrorMessage(err));
    }
  },
}));
