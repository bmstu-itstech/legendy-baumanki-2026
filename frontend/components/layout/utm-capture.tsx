"use client";

import { useEffect } from "react";

import { captureUtmParams } from "@/lib/utm";

/**
 * Разово сохраняет utm_source/utm_campaign из URL в localStorage при
 * загрузке приложения — независимо от того, на какую страницу пришёл
 * пользователь по ссылке с метками. Ничего не рендерит.
 */
export function UtmCapture() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return null;
}
