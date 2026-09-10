import type { Metadata } from "next";

import { AuthLayout, AuthTitle } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { RequireGuest } from "@/components/auth/route-guard";

export const metadata: Metadata = {
  title: "Вход — Легенды Бауманки 2026",
  description:
    "Войди в аккаунт «Легенд Бауманки» по почте и паролю и продолжи раскрывать тайны МГТУ им. Н.Э. Баумана.",
};

export default function LoginPage() {
  return (
    <RequireGuest>
      <AuthLayout contentClassName="login-adaptive">
        <AuthTitle />

        <p className="bg-mist mt-3 -mr-3 max-w-[560px] font-hand text-[0.8125rem] uppercase leading-[1.6] text-ink sm:mr-0 sm:mt-4 sm:text-[1.125rem] sm:leading-[1.4] xl:text-[1.25rem]">
          Рады видеть тебя снова!
          <br />
          Продолжим раскрывать тайны университета.
        </p>

        <LoginForm />
      </AuthLayout>
    </RequireGuest>
  );
}
