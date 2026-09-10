"use client";

import Image from "next/image";
import Link from "next/link";

import { useAuthStore } from "@/lib/store/auth-store";

import { LogoutIcon, ProfileUserIcon, RatingIcon, TasksIcon } from "@/components/ui/icons";

const PROFILE_NAV_ITEMS = [
  { label: "Задания", href: "#", Icon: TasksIcon, disabled: true },
  { label: "Рейтинг", href: "#", Icon: RatingIcon, disabled: true },
  { label: "Профиль", href: "/profile", Icon: ProfileUserIcon, disabled: false },
] as const;

function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return async () => {
    await logout();
    // Полная перезагрузка вместо router.push — сбрасывает скролл и весь
    // клиентский стейт гарантированно (см. "State and authentication" в
    // node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md).
    // Клиентский переход после логаута иногда оставлял скролл там же, где
    // он был на предыдущей странице (уезжал к футеру на главной).
    window.location.href = "/";
  };
}

export function ProfileSidebar() {
  const handleLogout = useLogout();

  return (
    <aside className="relative hidden w-[300px] shrink-0 flex-col overflow-hidden bg-ink px-4 pt-8 lg:flex xl:w-[337px] xl:px-[18px]">
      <Link href="/" className="flex w-full items-center">
        <span className="block w-full text-[2.375rem] font-bold uppercase leading-[0.95] text-white xl:text-[2.75rem]">
          ЛЕГЕНДЫ<span className="block">БАУМАНКИ</span>
        </span>
      </Link>

      <nav className="mt-10 flex flex-col gap-3">
        {PROFILE_NAV_ITEMS.map(({ label, href, Icon, disabled }) => {
          const active = label === "Профиль";

          if (disabled) {
            return (
              <span
                key={label}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-[14px] border border-transparent px-3.5 py-3 font-hand text-[1.375rem] uppercase text-white/50"
              >
                <Icon className="size-7 shrink-0" />
                {label}
              </span>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[14px] border px-3.5 py-3 font-hand text-[1.375rem] uppercase text-white transition-colors ${
                active
                  ? "border-white bg-secondary"
                  : "border-transparent hover:bg-white/5"
              }`}
            >
              <Icon className="size-7 shrink-0" />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-transparent px-3.5 py-3 font-hand text-[1.375rem] uppercase text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogoutIcon className="size-7 shrink-0" />
          Выйти
        </button>
      </nav>

      <div className="relative mt-auto -ml-4 aspect-[258/331] w-[270px] xl:w-[300px]">
        <Image
          src="/assets/profile-sidebar-decor.svg"
          alt=""
          fill
          sizes="300px"
          className="object-contain object-bottom"
        />
      </div>
    </aside>
  );
}

export function ProfileBottomNav() {
  const handleLogout = useLogout();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[84px] items-center justify-around bg-ink px-2 lg:hidden">
      {PROFILE_NAV_ITEMS.map(({ label, href, Icon, disabled }) => {
        const active = label === "Профиль";

        if (disabled) {
          return (
            <span
              key={label}
              aria-disabled="true"
              className="flex flex-1 cursor-not-allowed flex-col items-center gap-1 font-hand text-[0.8125rem] uppercase text-white/40"
            >
              <Icon className="size-7 shrink-0" />
              {label}
            </span>
          );
        }

        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 font-hand text-[0.8125rem] uppercase ${
              active ? "text-white" : "text-white/60"
            }`}
          >
            <Icon className="size-7 shrink-0" />
            {label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-1 cursor-pointer flex-col items-center gap-1 font-hand text-[0.8125rem] uppercase text-white/60"
      >
        <LogoutIcon className="size-7 shrink-0" />
        Выйти
      </button>
    </nav>
  );
}
