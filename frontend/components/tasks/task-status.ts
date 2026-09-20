import type { TaskStatus } from "@/lib/types";

/** Короткие подписи статусов — для легенды и aria-label кружков. */
export const STATUS_LABEL: Record<TaskStatus, string> = {
  closed: "Закрыто",
  opened: "Открыто",
  started: "В процессе",
  review: "На проверке",
  completed: "Готово",
  skipped: "Пропущено",
  failed: "Не принято",
};

export type StatusTheme = {
  /** Лицевая сторона «монетки». */
  face: string;
  /** Нижняя грань «монетки» (объём). */
  edge: string;
  /** Цвет иконки внутри кружка. */
  glyph: string;
  /** Фон облачка с описанием задания. */
  bubble: string;
  /** Цвет текста на облачке. */
  bubbleText: string;
  /** Цвет текста на белой кнопке внутри облачка. */
  buttonText: string;
};

const GREEN = {
  face: "#12cf9e",
  edge: "#079a77",
  glyph: "#ffffff",
  bubble: "#12cf9e",
  bubbleText: "#ffffff",
  buttonText: "#067a60",
} satisfies StatusTheme;

/**
 * Цвета взяты из фрейма (зелёный кружок + облачко) и легенды на странице.
 * «На проверке» сделан янтарным, чтобы не путаться с «Открыто / В процессе / Готово».
 */
export const STATUS_THEME: Record<TaskStatus, StatusTheme> = {
  closed: {
    face: "#2f3e46",
    edge: "#1b262c",
    glyph: "#7c919b",
    bubble: "#33444d",
    bubbleText: "#ffffff",
    buttonText: "#33444d",
  },
  opened: GREEN,
  started: GREEN,
  review: {
    face: "#f4b73f",
    edge: "#c08414",
    glyph: "#ffffff",
    bubble: "#f4b73f",
    bubbleText: "#08183a",
    buttonText: "#8a5a06",
  },
  completed: GREEN,
  skipped: {
    face: "#56666f",
    edge: "#39474f",
    glyph: "#c9d5da",
    bubble: "#56666f",
    bubbleText: "#ffffff",
    buttonText: "#3d4b53",
  },
  failed: {
    face: "#e0574a",
    edge: "#a5342a",
    glyph: "#ffffff",
    bubble: "#e0574a",
    bubbleText: "#ffffff",
    buttonText: "#a5342a",
  },
};
