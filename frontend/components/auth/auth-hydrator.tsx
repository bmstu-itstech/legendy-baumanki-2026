"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

/**
 * Разово пытается тихо восстановить сессию по refresh-cookie при
 * загрузке приложения. Ничего не рендерит.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
