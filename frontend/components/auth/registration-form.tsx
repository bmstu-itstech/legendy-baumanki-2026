"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuthStore } from "@/lib/store/auth-store";
import { useProfileStore } from "@/lib/store/profile-store";
import { getStoredUtmParams } from "@/lib/utm";
import {
  FULL_NAME_PATTERN,
  FULL_NAME_TITLE,
  GROUP_INVALID_MESSAGE,
  GROUP_PATTERN,
  GROUP_TITLE,
  TELEGRAM_PATTERN,
  TELEGRAM_TITLE,
} from "@/lib/validation";

import {
  ArrowSubmitIcon,
  EyeIcon,
  Field,
  GroupIcon,
  LockIcon,
  MailIcon,
  TelegramIcon,
  UserIcon,
  inputClass,
} from "@/components/ui/form-fields";

const iconClass = "h-6 w-auto shrink-0 text-ink sm:h-[28px] xl:h-[30px]";

export function RegistrationForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const createProfile = useProfileStore((state) => state.create);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const fullName = String(data.get("fullName"));
    const studyGroup = String(data.get("studyGroup"));
    const telegram = String(data.get("telegram"));

    // Ссылка-приглашение вида /registration?team_code=XXXXXX — при таком
    // заходе профиль создаётся сразу с team_code, бэкенд сам присоединяет
    // к команде. utm_* же могли быть пойманы ещё на входе на сайт (см.
    // components/layout/utm-capture.tsx) и лежат в localStorage.
    const searchParams = new URLSearchParams(window.location.search);
    const teamCode = searchParams.get("team_code");
    const { utmSource, utmCampaign } = getStoredUtmParams();

    setFormError(null);
    setSubmitting(true);
    try {
      // register сразу авторизует (access-токен в заголовке + refresh-cookie
      // на этот же запрос) — отдельный /auth/login не нужен.
      const { id: userId } = await register({
        email,
        password,
        utmSource,
        utmCampaign,
      });
      await createProfile({
        userId,
        fullName,
        group: studyGroup,
        telegram,
        teamCode,
      });
      router.push("/profile");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось зарегистрироваться");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-[18px] max-w-[593px] sm:mt-5 xl:mt-7">
      <h1 className="text-[1.75rem] leading-[1.2] font-bold uppercase text-ink sm:text-[2rem] xl:text-[1.625rem]">
        Регистрация
      </h1>

      <div className="mt-6 flex flex-col gap-[29px] xl:gap-[27px]">
        <Field>
          <UserIcon className={iconClass} />
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            aria-label="ФИО"
            placeholder="ФИО"
            required
            pattern={FULL_NAME_PATTERN}
            title={FULL_NAME_TITLE}
            minLength={2}
            maxLength={128}
            className={inputClass}
            style={{ paddingLeft: 12 }}
          />
        </Field>

        <Field>
          <GroupIcon className={iconClass} />
          <input
            name="studyGroup"
            type="text"
            autoComplete="off"
            aria-label="Учебная группа"
            placeholder="Учебная группа"
            required
            pattern={GROUP_PATTERN}
            title={GROUP_TITLE}
            onInvalid={(event) => event.currentTarget.setCustomValidity(GROUP_INVALID_MESSAGE)}
            onChange={(event) => event.currentTarget.setCustomValidity("")}
            className={inputClass}
            style={{ paddingLeft: 2 }}
          />
        </Field>

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
          <TelegramIcon className={iconClass} />
          <input
            name="telegram"
            type="text"
            autoComplete="off"
            aria-label="Телеграм"
            placeholder="Телеграм"
            required
            pattern={TELEGRAM_PATTERN}
            title={TELEGRAM_TITLE}
            minLength={2}
            maxLength={32}
            // Юзернейм можно вводить с "@" или без — бэкенд хранит без него,
            // так что просто вырезаем "@", если человек его напечатал или
            // вставил из буфера.
            onChange={(event) => {
              const { value } = event.currentTarget;
              const cleaned = value.replace(/@/g, "");
              if (cleaned !== value) event.currentTarget.value = cleaned;
            }}
            className={inputClass}
            style={{ paddingLeft: 10 }}
          />
        </Field>

        <Field>
          <LockIcon className={iconClass} />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={6}
            aria-label="Пароль"
            placeholder="Пароль"
            required
            className={`${inputClass} pr-11`}
            style={{ paddingLeft: 18 }}
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
        {submitting ? "Регистрируем…" : "Зарегистрироваться"}
        <ArrowSubmitIcon className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>

      <p className="mt-3 text-[1rem] text-ink sm:text-[1.125rem]">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          Войти
        </Link>
      </p>
    </form>
  );
}
