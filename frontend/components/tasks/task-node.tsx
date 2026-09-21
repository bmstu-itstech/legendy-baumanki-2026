"use client";

import { STAR_PATH } from "@/components/ui/decor";
import type { Task, TaskStatus } from "@/lib/types";

import { STATUS_THEME } from "./task-status";

/** Диаметр самого кружка на карте. */
export const NODE_SIZE = 76;
/** Запас под кольцо вокруг кружка (зазор + толщина, с обеих сторон). */
export const RING_PAD = 20;
/** Полный размер кружка вместе с кольцом. */
export const NODE_OUTER = NODE_SIZE + RING_PAD;

/** Диаметр звезды побочного задания и полный размер вместе с запасом под тень. */
export const STAR_SIZE = 76;
export const STAR_OUTER = 88;

const RING_STROKE = 5;
/** Кольцо читается и на светлом фоне карты, и на затемнении под облачком. */
const RING_TRACK = "#b3b7d8";

function StatusGlyph({ status, size }: { status: TaskStatus; size: number }) {
  const common = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    "aria-hidden": true,
    focusable: false,
  } as const;

  switch (status) {
    case "closed":
      return (
        <svg {...common} fill="none">
          <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
          <path
            d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "opened":
      return (
        <svg {...common} fill="currentColor">
          <path
            d="M12 2.8l2.75 5.85 6.4.85-4.7 4.4 1.2 6.35L12 17.15 6.35 20.25l1.2-6.35-4.7-4.4 6.4-.85L12 2.8z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "started":
      return (
        <svg {...common} fill="currentColor">
          <path
            d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2a.8.8 0 0 0-1.2.7z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "review":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6.5 3.5h11M6.5 20.5h11" />
          <path d="M7.5 3.5v3.2c0 1.6.9 3 2.4 3.8L12 12l2.1-1.5c1.5-.8 2.4-2.2 2.4-3.8V3.5" />
          <path d="M7.5 20.5v-3.2c0-1.6.9-3 2.4-3.8L12 12l2.1 1.5c1.5.8 2.4 2.2 2.4 3.8v3.2" />
        </svg>
      );
    case "completed":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.8l4.6 4.6L19 7.6" />
        </svg>
      );
    case "skipped":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6l6 6-6 6M13 6l6 6-6 6" />
        </svg>
      );
    case "failed":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </svg>
      );
  }
}

type TaskNodeProps = {
  status: TaskStatus;
  /** Номер задания — показывается жёлтым бейджем в углу кружка. */
  index?: number;
  /** Диаметр самого кружка (без кольца). */
  size?: number;
  /** Рисовать ли кольцо «ты здесь» вокруг кружка. */
  ring?: boolean;
  className?: string;
};

/**
 * «Монетка» основного задания: цвет и иконка зависят от статуса, снизу тёмная грань
 * для объёма (как на фрейме). Ничего не знает про клики — оборачивается
 * в кнопку/ссылку снаружи.
 */
export function TaskNode({
  status,
  index,
  size = NODE_SIZE,
  ring = false,
  className = "",
}: TaskNodeProps) {
  const theme = STATUS_THEME[status];
  const depth = Math.max(2, Math.round(size * 0.08));
  const outer = size + RING_PAD;
  const radius = (outer - RING_STROKE) / 2;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: ring ? outer : size, height: ring ? outer : size }}
    >
      {ring ? (
        <svg
          viewBox={`0 0 ${outer} ${outer}`}
          aria-hidden="true"
          className="absolute inset-0"
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={RING_TRACK}
            strokeWidth={RING_STROKE}
          />
        </svg>
      ) : null}

      <span
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: theme.face,
          color: theme.glyph,
          boxShadow: `0 ${depth}px 0 ${theme.edge}, inset 0 ${Math.max(2, depth / 2)}px 0 rgb(255 255 255 / 0.22)`,
        }}
      >
        <StatusGlyph status={status} size={Math.round(size * 0.46)} />

        {index !== undefined ? (
          <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#fff4b8] text-[0.75rem] font-bold text-ink shadow-[0_2px_0_rgb(0_0_0/0.22)]">
            {index}
          </span>
        ) : null}
      </span>
    </span>
  );
}

type StarTaskNodeProps = {
  status: TaskStatus;
  size?: number;
  className?: string;
};

/**
 * Звезда побочного задания — живёт в изгибах змейки. Цвет по статусу тот же, что
 * у монетки; номера нет, зато внутри иконка статуса (кроме «Открыто»: звезда в звезде лишняя).
 */
export function StarTaskNode({ status, size = STAR_SIZE, className = "" }: StarTaskNodeProps) {
  const theme = STATUS_THEME[status];
  const depth = Math.max(2, Math.round(size * 0.07));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, color: theme.glyph }}
    >
      <svg
        viewBox="0 0 94.6498 94.7089"
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-visible"
        style={{ filter: `drop-shadow(0 ${depth}px 0 ${theme.edge})` }}
      >
        <path
          d={STAR_PATH}
          fill={theme.face}
          stroke={theme.edge}
          strokeWidth={6.67}
          strokeLinejoin="round"
        />
      </svg>

      {status !== "opened" ? (
        <span className="relative">
          <StatusGlyph status={status} size={Math.round(size * 0.36)} />
        </span>
      ) : null}
    </span>
  );
}

/** Маркер задания на карте: монетка для основных, звезда для побочных. */
export function TaskMarker({
  task,
  ring = false,
  className,
}: {
  task: Task;
  ring?: boolean;
  className?: string;
}) {
  if (task.kind === "side") return <StarTaskNode status={task.status} className={className} />;

  return <TaskNode status={task.status} index={task.index} ring={ring} className={className} />;
}
