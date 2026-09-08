import type { Metadata } from "next";

import { AuthLayout, AuthTitle } from "@/components/auth-layout";
import { RegistrationForm } from "@/components/registration-form";

export const metadata: Metadata = {
  title: "Регистрация — Легенды Бауманки 2026",
  description:
    "Зарегистрируйся на квест «Легенды Бауманки» — заполни ФИО, учебную группу, почту и телеграм, чтобы стать частью легендарной истории МГТУ им. Н.Э. Баумана.",
};

export default function RegistrationPage() {
  return (
    <AuthLayout contentClassName="reg-adaptive [@media(min-width:80rem)_and_(max-height:780px)]:[zoom:0.88]">
      <AuthTitle />

      <p className="bg-mist mt-3 -mr-3 max-w-[560px] font-hand text-[0.8125rem] uppercase leading-[1.6] text-ink sm:mr-0 sm:mt-4 sm:text-[1.125rem] sm:leading-[1.4] xl:text-[1.25rem]">
        Раскрой все тайны и секреты университета.
        <br />
        Пришло твоё время стать частью легендарной истории!
      </p>

      <RegistrationForm />
    </AuthLayout>
  );
}
