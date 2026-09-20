"use client";

import { useEffect, useState } from "react";

import type { Module } from "@/lib/types";

/** Модули открываются по `openAt`: до этой даты задания модуля недоступны. */
export function isModuleOpen(module: Pick<Module, "openAt">, now: number) {
  return new Date(module.openAt).getTime() <= now;
}

const OPEN_AT_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** «22 сентября, 10:00» — в часовом поясе браузера. */
export function formatOpenAt(openAt: string) {
  return OPEN_AT_FORMAT.format(new Date(openAt));
}

/** Текущее время, обновляемое раз в `intervalMs`: модуль разблокируется без перезагрузки страницы. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
