"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { formatDuration } from "@/lib/format";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { Task, TaskStatus } from "@/lib/types";

import { TaskMarker } from "./task-node";
import { STATUS_THEME } from "./task-status";
import { useElapsedSeconds } from "./use-elapsed";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Экранные координаты кружка, от которого «растёт» облачко. */
type Anchor = { left: number; top: number; width: number; height: number };

function measure(element: HTMLElement): Anchor {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

type Placement = "below" | "above";
type Position = { left: number; top: number; width: number; arrowX: number; placement: Placement };
type PendingAction = "start" | "skip";

const BUBBLE_MAX_WIDTH = 340;
const VIEWPORT_MARGIN = 12;
/** Зазор между кружком и облачком — внутри него помещается стрелка. */
const ANCHOR_GAP = 14;
const ARROW_INSET = 30;

/** Показываем время от старта, пока задание не завершено окончательно (по ТЗ с доски). */
const TIMER_STATUSES: TaskStatus[] = ["started", "review", "failed"];

const STATUS_NOTE: Partial<Record<TaskStatus, (task: Task) => string>> = {
  closed: () => "Откроется, когда вы завершите предыдущее задание.",
  review: () => "Ответ отправлен и ждёт проверки модератором.",
  completed: (task) => `Задание выполнено. Начислено баллов: ${task.points}.`,
  skipped: () => "Вы пропустили это задание — баллы не начисляются.",
  failed: () => "Ответ не принят — баллы за это задание не начислены.",
};

const buttonBase =
  "flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] px-4 text-center font-hand text-[1.125rem] uppercase leading-none transition-transform active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-60";
const primaryButton = `${buttonBase} bg-white shadow-[0_4px_0_rgb(0_0_0/0.2)]`;
const secondaryButton = `${buttonBase} border-2 border-current/50 hover:bg-white/15`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ElapsedTimer({ task }: { task: Task }) {
  const elapsed = useElapsedSeconds(task.startedAt, task.finishedAt);
  if (elapsed === null) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-0.5 text-[0.875rem] font-bold tabular-nums"
      aria-label={`Время с начала задания: ${formatDuration(elapsed)}`}
    >
      <ClockIcon />
      {formatDuration(elapsed)}
    </span>
  );
}

export function TaskPopover({
  task,
  anchorEl,
  onClose,
}: {
  task: Task;
  /** Кружок на карте, от которого открыли облачко. Пока оно открыто, кружок скрыт, но его геометрия жива. */
  anchorEl: HTMLElement;
  onClose: () => void;
}) {
  const router = useRouter();
  const start = useTasksStore((state) => state.start);
  const skip = useTasksStore((state) => state.skip);

  const titleId = useId();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor>(() => measure(anchorEl));
  const [position, setPosition] = useState<Position | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const theme = STATUS_THEME[task.status];
  const busy = pending !== null;
  const canStart = task.status === "opened";
  const canContinue = task.status === "started";
  const canSkip = task.status === "opened" || task.status === "started";
  const canView =
    task.status === "review" ||
    task.status === "completed" ||
    task.status === "failed" ||
    task.status === "skipped";
  const taskHref = `/profile/tasks/${task.id}`;
  const note = STATUS_NOTE[task.status]?.(task);

  // Облачко ставим под кружок; если внизу нет места — над ним. По горизонтали
  // прижимаем к краям экрана, а стрелку оставляем направленной на центр кружка.
  const place = useCallback(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(BUBBLE_MAX_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
    const height = bubble.offsetHeight;
    const centerX = anchor.left + anchor.width / 2;

    const left = clamp(centerX - width / 2, VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN);
    const arrowX = clamp(centerX - left, ARROW_INSET, width - ARROW_INSET);

    const below = anchor.top + anchor.height + ANCHOR_GAP;
    const above = anchor.top - ANCHOR_GAP - height;
    const fitsBelow = below + height <= viewportHeight - VIEWPORT_MARGIN;

    let placement: Placement = "below";
    let top = below;
    if (!fitsBelow && above >= VIEWPORT_MARGIN) {
      placement = "above";
      top = above;
    } else if (!fitsBelow) {
      top = clamp(below, VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN);
    }

    setPosition((prev) =>
      prev &&
      prev.left === left &&
      prev.top === top &&
      prev.width === width &&
      prev.arrowX === arrowX &&
      prev.placement === placement
        ? prev
        : { left, top, width, arrowX, placement },
    );
  }, [anchor]);

  useIsoLayoutEffect(() => {
    place();

    const bubble = bubbleRef.current;
    if (!bubble || typeof ResizeObserver === "undefined") return;

    // Высота облачка меняется при смене статуса / подтверждении пропуска / ошибке.
    const observer = new ResizeObserver(place);
    observer.observe(bubble);
    return () => observer.disconnect();
  }, [place]);

  // Кружок могут сдвинуть скролл (в т.ч. плавный, ещё не доехавший на момент клика),
  // ресайз или пропавший из-за блокировки прокрутки скроллбар — следим за ним вживую.
  useEffect(() => {
    const sync = () => {
      const next = measure(anchorEl);
      const offscreen = next.top + next.height < 0 || next.top > window.innerHeight;
      if (offscreen) {
        onClose();
        return;
      }
      setAnchor((prev) =>
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    };

    sync();
    window.addEventListener("scroll", sync, { capture: true, passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync, { capture: true });
      window.removeEventListener("resize", sync);
    };
  }, [anchorEl, onClose]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, busy]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // Фокус — на главное действие (или на само облачко, если действий нет).
  useEffect(() => {
    const bubble = bubbleRef.current;
    const target = bubble?.querySelector<HTMLElement>("[data-autofocus]") ?? bubble;
    target?.focus({ preventScroll: true });
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      bubbleRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function run(action: PendingAction, fn: () => Promise<void>) {
    setPending(action);
    setActionError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось выполнить действие");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function handleStart() {
    const ok = await run("start", () => start(task.id));
    if (!ok) return;
    onClose();
    router.push(taskHref);
  }

  async function handleSkip() {
    const ok = await run("skip", () => skip(task.id));
    if (ok) onClose();
  }

  const timerVisible = TIMER_STATUSES.includes(task.status);
  const below = position?.placement !== "above";

  let actions: ReactNode = null;
  if (confirmSkip) {
    actions = (
      <>
        <p className="mt-4 text-[0.9375rem] leading-5">
          Пропустить задание? Баллы за него не начислятся, отменить пропуск будет нельзя.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={busy}
            data-autofocus
            onClick={handleSkip}
            style={{ color: theme.buttonText }}
            className={`${primaryButton} flex-1`}
          >
            {pending === "skip" ? "Пропускаем…" : "Пропустить"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmSkip(false)}
            className={`${secondaryButton} flex-1`}
          >
            Отмена
          </button>
        </div>
      </>
    );
  } else if (canStart || canContinue || canSkip || canView) {
    actions = (
      <div className="mt-4 flex flex-col gap-3">
        {canStart ? (
          <button
            type="button"
            disabled={busy}
            data-autofocus
            onClick={handleStart}
            style={{ color: theme.buttonText }}
            className={primaryButton}
          >
            {pending === "start" ? "Запускаем…" : `Начать: +${task.points}`}
          </button>
        ) : null}

        {canContinue ? (
          <Link
            href={taskHref}
            data-autofocus
            onClick={onClose}
            style={{ color: theme.buttonText }}
            className={primaryButton}
          >
            Продолжить: +{task.points}
          </Link>
        ) : null}

        {canView ? (
          <Link
            href={taskHref}
            data-autofocus
            onClick={onClose}
            style={{ color: theme.buttonText }}
            className={primaryButton}
          >
            Посмотреть
          </Link>
        ) : null}

        {canSkip ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmSkip(true)}
            className={secondaryButton}
          >
            Пропустить
          </button>
        ) : null}
      </div>
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/70"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      {/* Тот же кружок на прежнем месте: оригинал на карте на время модалки скрыт. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed flex items-center justify-center"
        style={{
          left: anchor.left,
          top: anchor.top,
          width: anchor.width,
          height: anchor.height,
        }}
      >
        <TaskMarker task={task} ring />
      </div>

      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="task-pop fixed rounded-[24px] px-5 pt-5 pb-5 shadow-[0_8px_0_rgb(0_0_0/0.22)] outline-none"
        style={{
          background: theme.bubble,
          color: theme.bubbleText,
          left: position?.left ?? 0,
          top: position?.top ?? 0,
          width: position?.width ?? BUBBLE_MAX_WIDTH,
          visibility: position ? "visible" : "hidden",
          transformOrigin: `${position?.arrowX ?? 0}px ${below ? "0%" : "100%"}`,
        }}
      >
        <span
          aria-hidden="true"
          className="absolute size-5 rotate-45 rounded-[4px]"
          style={{
            background: theme.bubble,
            left: (position?.arrowX ?? 0) - 10,
            ...(below ? { top: -7 } : { bottom: -7 }),
          }}
        />

        <h2 id={titleId} className="relative text-[1.25rem] font-bold leading-6">
          {task.title}
        </h2>

        {timerVisible ? (
          <div className="relative mt-2 flex">
            <ElapsedTimer task={task} />
          </div>
        ) : null}

        {note ? <p className="relative mt-3 text-[0.9375rem] leading-5">{note}</p> : null}

        <div className="relative">
          {actions}

          {actionError ? (
            <p
              role="alert"
              className="mt-3 rounded-[10px] bg-white px-3 py-2 text-[0.875rem] leading-5 text-error"
            >
              {actionError}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
