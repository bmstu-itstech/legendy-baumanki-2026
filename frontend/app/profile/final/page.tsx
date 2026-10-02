import type { Metadata } from "next";

import { FinalBooking } from "@/components/final/final-booking";

export const metadata: Metadata = {
  title: "Финал — Легенды Бауманки 2026",
  description: "Запись команды на финал квеста «Легенды Бауманки» 5 октября.",
};

export default function FinalPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-[1.375rem] font-bold uppercase text-ink sm:text-h3">Финал</h1>

      <div className="mt-6">
        <FinalBooking />
      </div>
    </div>
  );
}
