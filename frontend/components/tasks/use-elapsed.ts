"use client";

import { useEffect, useState } from "react";

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Секунды от старта задания: тикает, пока задание в процессе, и замирает после завершения. */
export function useElapsedSeconds(startedAt: string | null, finishedAt: string | null) {
  const running = startedAt !== null && finishedAt === null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!startedAt) return null;

  const end = finishedAt ? new Date(finishedAt).getTime() : now;
  return Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000));
}
