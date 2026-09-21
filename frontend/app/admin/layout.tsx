import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RequireSuperuser } from "@/components/auth/route-guard";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Админка — Легенды Бауманки 2026",
  description: "Управление заданиями и модерация ответов.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSuperuser>
      <div className="min-h-svh bg-mist">
        <div className="container-page max-w-[1100px] py-8 sm:py-10">
          <AdminNav />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </RequireSuperuser>
  );
}
