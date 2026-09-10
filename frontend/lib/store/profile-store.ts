import { create } from "zustand";

import { toErrorMessage } from "@/lib/api/errors";
import { profileApi } from "@/lib/api/profile";
import type { CreateProfilePayload, MyProfile, UpdateProfilePayload } from "@/lib/types";

type ProfileStatus = "idle" | "loading" | "loaded" | "error";

type ProfileState = {
  profile: MyProfile | null;
  status: ProfileStatus;
  error: string | null;
};

type ProfileActions = {
  fetch: () => Promise<void>;
  create: (payload: CreateProfilePayload) => Promise<void>;
  update: (payload: UpdateProfilePayload) => Promise<void>;
  reset: () => void;
};

export const useProfileStore = create<ProfileState & ProfileActions>((set) => ({
  profile: null,
  status: "idle",
  error: null,

  fetch: async () => {
    set({ status: "loading", error: null });
    try {
      const profile = await profileApi.getMe();
      set({ profile, status: "loaded" });
    } catch (err) {
      set({ status: "error", error: toErrorMessage(err) });
    }
  },

  create: async (payload) => {
    set({ status: "loading", error: null });
    try {
      await profileApi.create(payload);
      const profile = await profileApi.getMe();
      set({ profile, status: "loaded" });
    } catch (err) {
      const message = toErrorMessage(err);
      set({ status: "error", error: message });
      throw new Error(message);
    }
  },

  update: async (payload) => {
    try {
      await profileApi.update(payload);
      // Ответ PUT /profiles/me не содержит email/team_code — перезапрашиваем.
      const profile = await profileApi.getMe();
      set({ profile, status: "loaded", error: null });
    } catch (err) {
      throw new Error(toErrorMessage(err));
    }
  },

  reset: () => set({ profile: null, status: "idle", error: null }),
}));
