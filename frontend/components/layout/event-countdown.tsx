"use client";

import { useSyncExternalStore } from "react";

const EVENT_START = new Date("2026-09-21T14:00:00+03:00");

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null;

let cachedSnapshot: TimeLeft = null;
let cachedKey = "";

function computeTimeLeft(): TimeLeft {
  const diff = EVENT_START.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function getSnapshot(): TimeLeft {
  const next = computeTimeLeft();
  const key = next ? `${next.days}-${next.hours}-${next.minutes}-${next.seconds}` : "done";
  if (key !== cachedKey) {
    cachedKey = key;
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): TimeLeft | undefined {
  return undefined;
}

function subscribe(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 1000);
  return () => clearInterval(id);
}

function pluralizeDays(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function EventCountdown() {
  const timeLeft = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // До первого клиентского рендера (SSR) время неизвестно — держим место под
  // баннер, чтобы не дёргать layout. После того как таймер дошёл до нуля,
  // баннер просто убираем — новое событие в этот момент не анонсируем.
  if (timeLeft === undefined) {
    return <div className="h-8 bg-accent xl:h-9" aria-hidden="true" />;
  }

  if (timeLeft === null) return null;

  return (
    <div className="flex h-8 w-full items-center justify-center bg-accent px-4 text-center text-[0.6875rem] font-bold uppercase tracking-wide text-ink xl:h-9 xl:text-caption">
      <span>
        До начала мероприятия осталось {timeLeft.days} {pluralizeDays(timeLeft.days)}{" "}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}
