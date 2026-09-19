"use client";

import { useEffect, useState } from "react";

import { useRatingStore } from "@/lib/store/rating-store";

const cardClass =
  "flex w-full flex-col rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9";

function formatTime(seconds: number | null) {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function RatingTable() {
  const boards = useRatingStore((state) => state.boards);
  const status = useRatingStore((state) => state.status);
  const error = useRatingStore((state) => state.error);
  const fetchRating = useRatingStore((state) => state.fetch);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  if (status === "idle" || status === "loading") {
    return (
      <div className={cardClass}>
        <p className="text-[1rem] text-ink/70">Загружаем рейтинг…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={cardClass}>
        <p role="alert" className="text-[1rem] text-error">
          {error ?? "Не удалось загрузить рейтинг"}
        </p>
      </div>
    );
  }

  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0];

  if (!activeBoard) {
    return (
      <div className={cardClass}>
        <p className="text-[1rem] text-ink/70">Рейтинг пока пуст.</p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {boards.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {boards.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => setActiveBoardId(board.id)}
              className={`cursor-pointer rounded-[10px] border-2 px-3 py-1.5 text-[0.9375rem] font-bold uppercase transition-colors ${
                board.id === activeBoard.id
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 text-ink"
              }`}
            >
              {board.title}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-[0.9375rem] text-ink">
          <thead>
            <tr className="border-b border-ink/15 text-ink/60">
              <th className="py-2 pr-3 font-normal">№</th>
              <th className="py-2 pr-3 font-normal">Команда</th>
              <th className="py-2 pr-3 font-normal">Баллы</th>
              <th className="py-2 pr-3 font-normal">Время</th>
            </tr>
          </thead>
          <tbody>
            {activeBoard.rows.map((row) => (
              <tr key={row.teamId} className="border-b border-ink/10">
                <td className="py-2 pr-3">{row.place}</td>
                <td className="py-2 pr-3">{row.teamName}</td>
                <td className="py-2 pr-3 font-bold">{row.totalPoints}</td>
                <td className="py-2 pr-3 text-ink/70">{formatTime(row.totalTimeSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
