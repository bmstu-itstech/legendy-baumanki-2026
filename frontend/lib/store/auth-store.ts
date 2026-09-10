import { create } from "zustand";

import { authApi } from "@/lib/api/auth";
import { toErrorMessage } from "@/lib/api/errors";
import { tokenStore } from "@/lib/api/token-store";
import { API_BASE_URL } from "@/lib/env";
import type { AuthenticatedUser, LoginPayload, RegisterPayload } from "@/lib/types";
import { useProfileStore } from "./profile-store";
import { useTeamStore } from "./team-store";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: AuthenticatedUser | null;
  status: AuthStatus;
  error: string | null;
  /**
   * true после первого разрешения hydrate() (успех или провал). Гварды
   * (route-guard.tsx) ориентируются на этот флаг, а не на status, — иначе
   * их fallback перекрывал бы форму логина каждый раз, когда login()/
   * register() на секунду переводят status в "loading".
   */
  hasHydrated: boolean;
};

type AuthActions = {
  /** Тихий вход по refresh-cookie при загрузке приложения. Вызывается один раз. */
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  /**
   * Создаёт аккаунт и сразу авторизует (бэкенд отдаёт access-токен в
   * заголовке + ставит refresh-cookie на этот же запрос — отдельный
   * /auth/login после регистрации не нужен). Профиль (ФИО/группа/
   * телеграм) создаётся отдельно через profile-store.create — см.
   * registration-form.tsx, там же и код команды из ссылки-приглашения.
   */
  register: (payload: RegisterPayload) => Promise<{ id: number }>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  status: "idle",
  error: null,
  hasHydrated: false,

  hydrate: async () => {
    if (get().status !== "idle") return;
    if (!API_BASE_URL) {
      set({ status: "unauthenticated", hasHydrated: true });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authApi.me();
      set({ user, status: "authenticated", error: null, hasHydrated: true });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "unauthenticated", hasHydrated: true });
    }
  },

  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      await authApi.login(payload);
      const user = await authApi.me();
      set({ user, status: "authenticated", error: null });
    } catch (err) {
      const message = toErrorMessage(err);
      set({ status: "unauthenticated", error: message });
      throw new Error(message);
    }
  },

  register: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const created = await authApi.register(payload);
      const user = await authApi.me();
      set({ user, status: "authenticated", error: null });
      return created;
    } catch (err) {
      const message = toErrorMessage(err);
      set({ status: "unauthenticated", error: message });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Даже если запрос не удался, разлогиниваем локально.
    } finally {
      tokenStore.clear();
      set({ user: null, status: "unauthenticated", error: null });
      useProfileStore.getState().reset();
      useTeamStore.getState().reset();
    }
  },
}));

// Если apiFetch поймал 401 без валидной refresh-cookie — сессия истекла на
// бэкенде, синхронизируем это в UI-стор.
tokenStore.onExpire(() => {
  useAuthStore.setState({ user: null, status: "unauthenticated" });
  useProfileStore.getState().reset();
  useTeamStore.getState().reset();
});
