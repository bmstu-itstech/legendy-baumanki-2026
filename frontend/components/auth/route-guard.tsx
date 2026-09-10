"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

// Пока auth-store не разрешился в "authenticated"/"unauthenticated"
// (idle/loading — AuthHydrator ещё не дождался ответа /auth/me), не
// показываем ни защищённый контент, ни форму логина, чтобы не мигать
// не тем экраном перед редиректом.
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
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") return <GuardFallback />;
  return <>{children}</>;
}

/** Страницы только для гостей (/login, /registration) — авторизованных уводим в профиль. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [status, router]);

  if (status === "idle" || status === "loading" || status === "authenticated") {
    return <GuardFallback />;
  }
  return <>{children}</>;
}
