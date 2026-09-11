"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

// Пока auth-store не разрешился в "authenticated"/"unauthenticated" в первый
// раз (AuthHydrator ещё не дождался ответа /auth/me), не показываем ни
// защищённый контент, ни форму логина, чтобы не мигать не тем экраном перед
// редиректом. Дальше ориентируемся на hasHydrated, а не на status: login()/
// register() на время своего запроса переводят status в "loading", и если бы
// гварды реагировали на это, форма разлогинивалась бы (unmount) прямо в
// момент отправки.
function GuardFallback() {
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-mist">
      <p className="text-[0.9375rem] text-ink/70">Загрузка…</p>
    </div>
  );
}

/** Страницы, доступные только авторизованным (например, /profile). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && status !== "authenticated") router.replace("/login");
  }, [hasHydrated, status, router]);

  if (!hasHydrated || status !== "authenticated") return <GuardFallback />;
  return <>{children}</>;
}

/** Страницы только для гостей (/login, /registration) — авторизованных уводим в профиль. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && status === "authenticated") router.replace("/profile");
  }, [hasHydrated, status, router]);

  if (!hasHydrated || status === "authenticated") return <GuardFallback />;
  return <>{children}</>;
}
