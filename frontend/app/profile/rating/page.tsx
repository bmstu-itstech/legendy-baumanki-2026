import type { Metadata } from "next";

import { RatingTable } from "@/components/rating/rating-table";

export const metadata: Metadata = {
  title: "Рейтинг — Легенды Бауманки 2026",
  description: "Рейтинг команд квеста «Легенды Бауманки».",
};

export default function RatingPage() {
  return (
    <>
      <h1 className="text-[1.375rem] font-bold uppercase text-ink sm:text-h3">Рейтинг</h1>

      <div className="mt-6">
        <RatingTable />
      </div>
    </>
  );
}
