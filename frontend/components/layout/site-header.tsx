"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { NAV_ITEMS, REGISTRATION_URL } from "@/components/site-data";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-ink text-white">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center px-4 xl:px-[18px]">
        <a href="#top" className="flex items-center gap-3 xl:gap-[17px]">
          <Image
            src="/assets/emblem.svg"
            alt="Эмблема «Легенды Бауманки»"
            width={64}
            height={64}
            priority
            className="size-12 shrink-0 xl:size-16"
          />
          <span className="leading-tight">
            <span className="block text-[1.125rem] font-bold uppercase leading-[1.15] xl:text-title">
              Легенды <span className="block xl:inline">Бауманки</span>
            </span>
            <span className="mt-1 hidden text-caption text-muted xl:block">
              МГТУ им. Н.Э. Баумана
            </span>
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-8 xl:flex xl:gap-[61px]">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-body whitespace-nowrap transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href={REGISTRATION_URL}
          className="ml-8 hidden h-11 items-center justify-center rounded-chip border-2 border-white px-4 text-caption transition-colors hover:bg-white hover:text-ink xl:inline-flex xl:w-[168px]"
        >
          Зарегистрироваться
        </Link>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto flex size-11 cursor-pointer items-center justify-center xl:hidden"
        >
          <span className="relative block h-[18px] w-6" aria-hidden="true">
            <span
              className={`absolute left-0 block h-[3px] w-full rounded-full bg-white transition-transform duration-200 ${
                menuOpen ? "top-2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute top-2 left-0 block h-[3px] w-full rounded-full bg-white transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-[3px] w-full rounded-full bg-white transition-transform duration-200 ${
                menuOpen ? "top-2 -rotate-45" : "top-4"
              }`}
            />
          </span>
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-20 border-t border-white/10 bg-ink px-4 pt-2 pb-6 xl:hidden"
        >
          <nav className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/10 py-4 text-title"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <Link
            href={REGISTRATION_URL}
            onClick={() => setMenuOpen(false)}
            className="mt-6 flex h-12 items-center justify-center rounded-chip border-2 border-white text-title"
          >
            Зарегистрироваться
          </Link>
        </div>
      )}
    </header>
  );
}
