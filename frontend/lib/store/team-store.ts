import { create } from "zustand";

import { ApiError, toErrorMessage } from "@/lib/api/errors";
import { teamApi } from "@/lib/api/team";
import type { CreateTeamPayload, Team, UpdateTeamPayload } from "@/lib/types";

type TeamStatus = "idle" | "loading" | "loaded" | "none" | "error";

type TeamState = {
  team: Team | null;
  status: TeamStatus;
  error: string | null;
};

type TeamActions = {
  fetchMine: () => Promise<void>;
  create: (payload: CreateTeamPayload) => Promise<void>;
  rename: (payload: UpdateTeamPayload) => Promise<void>;
  join: (teamCode: string) => Promise<void>;
  leave: () => Promise<void>;
  reset: () => void;
};

export const useTeamStore = create<TeamState & TeamActions>((set) => ({
  team: null,
  status: "idle",
  error: null,

  fetchMine: async () => {
    set({ status: "loading", error: null });
    try {
      const team = await teamApi.getMine();
      set({ team, status: "loaded" });
    } catch (err) {
      // 404 — у пользователя пока нет команды, это не ошибка UI.
      if (err instanceof ApiError && err.status === 404) {
        set({ team: null, status: "none", error: null });
        return;
      }
      set({ status: "error", error: toErrorMessage(err) });
    }
  },

  create: async (payload) => {
    try {
      await teamApi.create(payload);
      const team = await teamApi.getMine();
      set({ team, status: "loaded", error: null });
    } catch (err) {
      throw new Error(toErrorMessage(err));
    }
  },

  rename: async (payload) => {
    try {
      const team = await teamApi.rename(payload);
      set({ team, status: "loaded", error: null });
    } catch (err) {
      throw new Error(toErrorMessage(err));
    }
  },

  join: async (teamCode) => {
    try {
      await teamApi.join(teamCode);
      const team = await teamApi.getMine();
      set({ team, status: "loaded", error: null });
    } catch (err) {
      throw new Error(toErrorMessage(err));
    }
  },

  leave: async () => {
    try {
      await teamApi.leave();
      set({ team: null, status: "none", error: null });
    } catch (err) {
      throw new Error(toErrorMessage(err));
    }
  },

  reset: () => set({ team: null, status: "idle", error: null }),
}));
