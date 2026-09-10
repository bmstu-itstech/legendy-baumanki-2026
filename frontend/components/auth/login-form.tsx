"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

import {
  ArrowSubmitIcon,
  EyeIcon,
  Field,
  LockIcon,
  MailIcon,
  inputClass,
} from "@/components/ui/form-fields";

const iconClass = "h-6 w-auto shrink-0 text-ink sm:h-[28px] xl:h-[30px]";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFormError(null);
    setSubmitting(true);
    try {
      await login({
        email: String(data.get("email")),
        password: String(data.get("password")),
      });
      router.push("/profile");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-[18px] max-w-[593px] sm:mt-5 xl:mt-7">
      <h1 className="text-[1.75rem] leading-[1.2] font-bold uppercase text-ink sm:text-[2rem] xl:text-[1.625rem]">
        Вход
      </h1>

      <div className="mt-6 flex flex-col gap-[29px] xl:gap-[27px]">
        <Field>
          <MailIcon className={iconClass} />
          <input
            name="email"
            type="email"
            autoComplete="email"
            aria-label="Почта"
            placeholder="Почта"
            required
            className={inputClass}
          />
        </Field>

        <Field>
          <LockIcon className={iconClass} />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-label="Пароль"
            placeholder="Пароль"
            required
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            aria-pressed={showPassword}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center"
          >
            <EyeIcon
              className={`h-5 w-auto transition-colors sm:h-6 ${
                showPassword ? "text-primary" : "text-ink/50"
              }`}
            />
          </button>
        </Field>
      </div>

      {formError && (
        <p role="alert" className="mt-3 text-[0.9375rem] text-error">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="group mt-5 flex h-[51px] max-w-full cursor-pointer items-center gap-4 rounded-full bg-ink pl-10 pr-8 font-hand text-[1.125rem] uppercase text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 min-[360px]:text-[1.375rem] xl:mt-[26px] xl:text-[1.625rem]"
      >
        {submitting ? "Входим…" : "Войти"}
        <ArrowSubmitIcon className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>

      <p className="mt-3 text-[1rem] text-ink sm:text-[1.125rem]">
        Нет аккаунта?{" "}
        <a href="/registration" className="text-ink">
          Зарегистрироваться
        </a>
      </p>
    </form>
  );
}
