"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV_ITEMS = [
  { label: "Модули и задания", href: "/admin" },
  { label: "Модерация", href: "/admin/reviews" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-secondary/15 pb-4">
      <div className="flex flex-wrap gap-2">
        {ADMIN_NAV_ITEMS.map(({ label, href }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center rounded-[12px] border-2 px-4 font-hand text-[1rem] uppercase transition-colors ${
                active
                  ? "border-secondary bg-secondary text-white"
                  : "border-secondary/25 text-ink hover:bg-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/profile"
        className="text-[0.875rem] font-bold uppercase text-ink/60 underline-offset-4 hover:underline"
      >
        ← В профиль
      </Link>
    </nav>
  );
}
