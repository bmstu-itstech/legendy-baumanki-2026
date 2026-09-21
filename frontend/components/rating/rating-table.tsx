"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Star } from "@/components/ui/decor";

import { formatDuration } from "@/lib/format";
import { useRatingStore } from "@/lib/store/rating-store";
import type { RatingBoard } from "@/lib/types";

const cardClass =
  "flex w-full flex-col rounded-[18px] border-2 border-secondary bg-white px-1 py-7 sm:px-9";

/**
 * Первые две колонки «залипают» слева: на каждое задание приходится своя
 * колонка, таблица шире экрана, и без этого при скролле не видно, чья строка.
 * Отступ второй колонки обязан совпадать с шириной первой, а ширина первой —
 * вмещать «№ места» вместе с боковыми отступами: иначе колонка растянется под
 * содержимое и left второй колонки перестанет совпадать с её краем.
 * Горизонтальные отступы держим здесь, чтобы шапка и строки не разъехались.
 * На мобильных обе колонки уже — иначе они съедают всю ширину карточки и под
 * скроллящиеся колонки заданий не остаётся места (left второй колонки следует
 * за шириной первой на каждом брейкпоинте).
 */
const PLACE_CELL = "sticky left-0 z-20 w-16 min-w-16 bg-inherit pr-1 pl-3 sm:w-24 sm:min-w-24 sm:pr-2 sm:pl-4";
const TEAM_CELL =
  "sticky left-16 z-20 w-[124px] min-w-[124px] bg-inherit pr-2 shadow-[1px_0_0_rgb(8_24_58/0.12)] sm:left-24 sm:w-[176px] sm:min-w-[176px] sm:pr-4";
const TEAM_NAME_BUTTON =
  "block cursor-pointer appearance-none bg-transparent p-0 text-left font-inherit text-inherit underline decoration-dotted decoration-ink/40 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-accent";
const TEAM_NAME_COLLAPSED = "truncate max-w-[104px] sm:max-w-[156px]";
const TEAM_NAME_EXPANDED = "whitespace-normal break-words";

/**
 * Полосатость строк. Цвет обязан быть непрозрачным: залипающие колонки берут
 * фон строки через bg-inherit, и сквозь полупрозрачный оттенок при
 * горизонтальном скролле просвечивали колонки заданий. Это mist на 40% по белому.
 */
const ROW_STRIPE = "bg-white even:bg-[#f6f6fa]";

/**
 * Рейтинг может содержать сотни команд — рендерить их все сразу в тяжёлую
 * sticky-таблицу не вариант, поэтому показываем страницами по PAGE_SIZE.
 */
const PAGE_SIZE = 50;

const SHOW_MORE_BUTTON =
  "h-11 shrink-0 cursor-pointer rounded-[14px] border-2 border-secondary/25 px-5 font-hand text-[1.0625rem] uppercase text-ink transition-colors hover:bg-mist";

/**
 * Рейтинги — вкладки слева направо над таблицей (не «браузерные»: те же плашки,
 * что и в меню профиля). Ряд скроллится по горизонтали, на мобильных — до края экрана.
 * Паттерн WAI-ARIA tabs: стрелки, Home/End, «ролящийся» tabindex.
 */
function BoardTabs({
  boards,
  value,
  idPrefix,
  onChange,
}: {
  boards: RatingBoard[];
  value: string;
  idPrefix: string;
  onChange: (boardId: string) => void;
}) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  // Активная вкладка не должна оставаться за краем прокручиваемого ряда.
  useEffect(() => {
    tabRefs.current.get(value)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = boards.findIndex((board) => board.id === value);
    let next = current;

    if (event.key === "ArrowRight") next = (current + 1) % boards.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + boards.length) % boards.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = boards.length - 1;
    else return;

    event.preventDefault();
    const target = boards[next];
    onChange(target.id);
    tabRefs.current.get(target.id)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Рейтинги"
      onKeyDown={handleKeyDown}
      className="scrollbar-thin -mx-6 flex gap-2 overflow-x-auto px-6 pt-1 pb-3 sm:-mx-9 sm:px-9 sm:pt-1 sm:pb-3"
    >
      {boards.map((board) => {
        const active = board.id === value;

        return (
          <button
            key={board.id}
            ref={(element) => {
              if (element) tabRefs.current.set(board.id, element);
              else tabRefs.current.delete(board.id);
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${board.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(board.id)}
            className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-[14px] border-2 px-4 font-hand text-[1.0625rem] uppercase whitespace-nowrap outline-none transition-colors focus-visible:ring-4 focus-visible:ring-accent ${
              active
                ? "border-secondary bg-secondary text-white"
                : "border-secondary/25 text-ink hover:bg-mist"
            }`}
          >
            {board.kind === "side" ? <Star className="size-4 shrink-0" /> : null}
            {board.title}
          </button>
        );
      })}
    </div>
  );
}

function BoardTable({ board }: { board: RatingBoard }) {
  // Названия команд обрезаны по ширине колонки; тултип title работает только
  // по наведению, а на тач-устройствах его нет — поэтому по тапу разворачиваем
  // название целиком прямо в ячейке (перенос строк внутри залипающей колонки).
  const [expandedTeamId, setExpandedTeamId] = useState<RatingBoard["rows"][number]["teamId"] | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleRows = board.rows.slice(0, visibleCount);
  const hasMore = visibleCount < board.rows.length;

  return (
    <div className="mt-5">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-[0.9375rem] text-ink">
          <caption className="sr-only">Рейтинг команд: {board.title}</caption>

          <thead>
            <tr className="border-b-2 border-ink/15 bg-white text-[0.75rem] uppercase text-ink/55">
              <th scope="col" className={`${PLACE_CELL} py-2 font-bold whitespace-nowrap`}>
                <span className="sm:hidden">Место</span>
                <span className="hidden sm:inline">№ места</span>
              </th>
              <th scope="col" className={`${TEAM_CELL} py-2 font-bold`}>
                <span className="sm:hidden">Команда</span>
                <span className="hidden sm:inline">Название команды</span>
              </th>
              {board.columns.map((column) => (
                <th
                  key={column.taskId}
                  scope="col"
                  title={`${column.title} — до ${column.maxPoints} баллов`}
                  className="min-w-[82px] px-2 py-2 text-center font-bold whitespace-nowrap"
                >
                  Задание {column.index}
                </th>
              ))}
              <th
                scope="col"
                className="min-w-[92px] border-l border-ink/10 px-2 py-2 text-center font-bold"
              >
                Сумма баллов
              </th>
              <th scope="col" className="min-w-[104px] px-2 py-2 text-right font-bold">
                Сумма времени
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.teamId} className={`border-b border-ink/10 last:border-b-0 ${ROW_STRIPE}`}>
                <td className={`${PLACE_CELL} py-3 align-top text-[1.0625rem] font-bold`}>
                  {row.place}
                </td>
                <td className={`${TEAM_CELL} py-3 align-top`}>
                  <button
                    type="button"
                    title={row.teamName}
                    aria-expanded={expandedTeamId === row.teamId}
                    onClick={() =>
                      setExpandedTeamId((current) => (current === row.teamId ? null : row.teamId))
                    }
                    className={`${TEAM_NAME_BUTTON} ${
                      expandedTeamId === row.teamId ? TEAM_NAME_EXPANDED : TEAM_NAME_COLLAPSED
                    }`}
                  >
                    {row.teamName}
                  </button>
                </td>

                {row.tasks.map((score) => (
                  <td key={score.taskId} className="px-2 py-3 text-center align-top">
                    <span className="block text-[1.0625rem] leading-5 font-bold">{score.points}</span>
                    <span className="block text-[0.75rem] leading-4 text-ink/50">
                      {score.timeSec == null ? "—" : formatDuration(score.timeSec)}
                    </span>
                  </td>
                ))}

                <td className="border-l border-ink/10 px-2 py-3 text-center align-top text-[1.0625rem] font-bold">
                  {row.totalPoints}
                </td>
                <td className="px-2 py-3 text-right align-top whitespace-nowrap text-ink/70">
                  {formatDuration(row.totalTimeSec)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, board.rows.length))}
            className={SHOW_MORE_BUTTON}
          >
            Показать ещё {Math.min(PAGE_SIZE, board.rows.length - visibleCount)}
          </button>
          <span className="text-[0.8125rem] text-ink/55">
            Показано {visibleRows.length} из {board.rows.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function RatingTable() {
  const boards = useRatingStore((state) => state.boards);
  const status = useRatingStore((state) => state.status);
  const error = useRatingStore((state) => state.error);
  const fetchRating = useRatingStore((state) => state.fetch);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const idPrefix = useId();

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
      <BoardTabs
        boards={boards}
        value={activeBoard.id}
        idPrefix={idPrefix}
        onChange={setActiveBoardId}
      />

      <div
        role="tabpanel"
        id={`${idPrefix}-panel`}
        aria-labelledby={`${idPrefix}-tab-${activeBoard.id}`}
      >
        <p className="mt-4 text-[0.8125rem] leading-5 text-ink/55">
          В колонках заданий сверху баллы, снизу — время выполнения. Место определяется суммой
          баллов, при равенстве — суммарным временем.
        </p>

        {activeBoard.rows.length === 0 ? (
          <p className="mt-6 text-[1rem] text-ink/70">В этом рейтинге пока нет результатов.</p>
        ) : (
          <BoardTable key={activeBoard.id} board={activeBoard} />
        )}
      </div>
    </div>
  );
}
