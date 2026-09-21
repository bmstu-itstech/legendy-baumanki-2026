"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useTasksStore } from "@/lib/store/tasks-store";
import type { Module, Task, TaskSection, TaskStatus } from "@/lib/types";

import { ModuleBuilding } from "./module-building";
import { formatOpenAt, isModuleOpen, useNow } from "./module-access";
import { NODE_OUTER, STAR_OUTER, StarTaskNode, TaskMarker, TaskNode } from "./task-node";
import { TaskPopover } from "./task-popover";
import { STATUS_LABEL } from "./task-status";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const panelClass = "rounded-[18px] border-2 border-secondary bg-white";

/** Шаг по вертикали между кружками, отступ сверху (под метку «Начать») и снизу. */
const MAP_ROW = 116;
const MAP_TOP = 92;
const MAP_BOTTOM = 56;
/** Расстояние между последним кружком одной группы и первым кружком следующей — в нём линия-разделитель. */
const GROUP_GAP = 216;
/** Форма «змейки»: множитель бокового смещения кружка от центра карты. */
const MAP_WAVE = [0, 0.6, 0.95, 0.6, 0, -0.6, -0.95, -0.6];
const MAP_MAX_AMPLITUDE = 120;
/** Изгиб — точка, где змейка ушла к краю почти до максимума: рядом с ней свободный «карман» для звезды. */
const BEND_WAVE = 0.9;
/**
 * Вертикальный шаг между звёздами, которые делят один и тот же «карман»
 * (побочных заданий больше, чем изгибов). Должен быть не меньше высоты самой
 * звезды с запасом — иначе соседние звёзды по вертикали перекрывают друг друга.
 */
const STAR_LAP_STEP = STAR_OUTER + 8;

/** Цвета тропы подобраны под светлый фон страницы. */
const PATH_DONE = "#12cf9e";
const PATH_PENDING = "#c3c6e0";
/** Статусы, после которых команда «прошла» задание, — тропа за ним подсвечивается. */
const PASSED_STATUSES: TaskStatus[] = ["completed", "skipped", "failed", "review"];

type Selected = { taskId: number; element: HTMLElement };
type OnSelect = (task: Task, element: HTMLElement) => void;

/** Раздел модуля (очный / дистанционный) — на карте это условная группа, отделённая линией. */
type MapGroup = { section: TaskSection; tasks: Task[] };
type PlacedTask = { task: Task; x: number; y: number };

function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useIsoLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => setWidth(Math.round(element.getBoundingClientRect().width));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-secondary/30 text-[1.125rem] leading-none text-ink transition-transform ${
        open ? "rotate-90" : ""
      }`}
    >
      ›
    </span>
  );
}

function LockedIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-secondary/20 text-ink/45"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
        <path
          d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className="h-3.5 w-full overflow-hidden rounded-full bg-ink/10"
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-700"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function TaskButton({
  task,
  hidden,
  onSelect,
}: {
  task: Task;
  hidden: boolean;
  onSelect: OnSelect;
}) {
  const isSide = task.kind === "side";
  const showRing = !isSide && (task.status === "opened" || task.status === "started");
  const tag =
    isSide || task.status === "closed"
      ? null
      : task.status === "opened"
        ? "Начать"
        : task.status === "started"
          ? "Продолжить"
          : null;
  const box = isSide ? STAR_OUTER : NODE_OUTER;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${isSide ? "Побочное задание" : "Задание"}: ${task.title}. ${STATUS_LABEL[task.status]}`}
      title={`${task.title}: ${STATUS_LABEL[task.status]}`}
      onClick={(event) => onSelect(task, event.currentTarget)}
      className="relative flex cursor-pointer items-center justify-center rounded-full outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-accent active:translate-y-0.5"
      style={{ width: box, height: box, visibility: hidden ? "hidden" : undefined }}
    >
      {tag ? (
        <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2">
          <span className="task-tag relative block whitespace-nowrap rounded-[8px] border-2 border-[#2b3b44] bg-[#0d181d] px-3 py-1 text-[0.8125rem] font-bold uppercase leading-5 text-[#17d8aa] shadow-[0_4px_0_rgb(0_0_0/0.3)]">
            {tag}
            <span
              aria-hidden="true"
              className="absolute -bottom-[7px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-[#2b3b44] bg-[#0d181d]"
            />
          </span>
        </span>
      ) : null}

      <TaskMarker task={task} ring={showRing} />
    </button>
  );
}

/**
 * Раскладка карты модуля: основные задания обеих секций идут одной «змейкой»
 * (в каждой секции волна начинается заново), между секциями — зазор под линию,
 * а побочные задания расставляются звёздами по «карманам» изгибов.
 */
function layoutModuleMap(groups: MapGroup[], sideTasks: Task[], width: number) {
  const amplitude = Math.max(0, Math.min((width - NODE_OUTER) / 2 - 8, MAP_MAX_AMPLITUDE));

  const segments: { from: PlacedTask; to: PlacedTask; passed: boolean }[] = [];
  const main: PlacedTask[] = [];
  const bends: PlacedTask[] = [];
  const dividers: { y: number; title: string }[] = [];
  let firstTitle: string | null = null;
  let cursorY = MAP_TOP;
  let lastY = MAP_TOP;

  for (const group of groups) {
    if (group.tasks.length === 0) continue;

    if (main.length === 0) {
      firstTitle = group.section.title;
    } else {
      cursorY = lastY + GROUP_GAP;
      dividers.push({ y: lastY + GROUP_GAP / 2, title: group.section.title });
    }

    const placed = group.tasks.map((task, index) => {
      const wave = MAP_WAVE[index % MAP_WAVE.length];
      const point = { task, x: width / 2 + amplitude * wave, y: cursorY + index * MAP_ROW };

      if (Math.abs(wave) >= BEND_WAVE) bends.push(point);
      return point;
    });

    placed.slice(0, -1).forEach((from, index) => {
      segments.push({
        from,
        to: placed[index + 1],
        passed: PASSED_STATUSES.includes(from.task.status),
      });
    });

    main.push(...placed);
    lastY = placed[placed.length - 1].y;
  }

  // Побочные задания — в «карманы» изгибов, равномерно по всей карте. Карман лежит
  // на пустой стороне змейки: зеркально относительно центра. Если побочек больше,
  // чем изгибов, добираем по кругу со сдвигом вниз на STAR_LAP_STEP — иначе
  // несколько звёзд в одном кармане садятся друг на друга.
  const pockets = bends.length > 0 ? bends : main;
  const stars: PlacedTask[] = pockets.length
    ? sideTasks.map((task, index) => {
        const slot =
          sideTasks.length <= pockets.length
            ? Math.floor((index * pockets.length) / sideTasks.length)
            : index % pockets.length;
        const lap = sideTasks.length <= pockets.length ? 0 : Math.floor(index / pockets.length);
        const bend = pockets[slot];
        const half = STAR_OUTER / 2 + 4;
        // Зеркалка «width - bend.x» работает, только если у кармана есть
        // боковое смещение волны. Когда карманов нет (мало заданий — pockets
        // = main) и берём первую точку змейки, та стоит точно по центру
        // (MAP_WAVE[0] === 0): зеркалка от центра схлопывается в ту же
        // точку, и звезда садится прямо поверх кружка задания — визуально
        // выглядит так, будто звезда «слишком крупная», хотя на деле это
        // наложение двух узлов. Для центрированного кармана вместо зеркалки
        // отодвигаем звезду на фиксированный безопасный отступ в сторону.
        const centered = Math.abs(bend.x - width / 2) < 1;
        const minOffset = NODE_OUTER / 2 + STAR_OUTER / 2 + 12;
        const x = centered
          ? width / 2 + (index % 2 === 0 ? -minOffset : minOffset)
          : width - bend.x;

        return {
          task,
          x: Math.min(Math.max(x, half), width - half),
          y: bend.y + lap * STAR_LAP_STEP,
        };
      })
    : [];

  return {
    main,
    stars,
    segments,
    dividers,
    firstTitle,
    height: lastY + NODE_OUTER / 2 + MAP_BOTTOM,
  };
}

function FormatLabel({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-ink px-3 py-1 text-[0.8125rem] font-bold uppercase leading-5 text-white">
      {children}
    </span>
  );
}

function ModuleMap({
  groups,
  sideTasks,
  selectedId,
  onSelect,
}: {
  groups: MapGroup[];
  sideTasks: Task[];
  selectedId: number | null;
  onSelect: OnSelect;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>(360);
  const layout = layoutModuleMap(groups, sideTasks, width);

  if (layout.main.length === 0 && layout.stars.length === 0) {
    return <p className="mt-6 text-[1rem] text-ink/70">В этом модуле пока нет заданий.</p>;
  }

  return (
    <div
      ref={ref}
      className="relative mx-auto mt-4 w-full max-w-[460px]"
      style={{ height: layout.height }}
    >
      <svg
        aria-hidden="true"
        width={width}
        height={layout.height}
        viewBox={`0 0 ${width} ${layout.height}`}
        className="pointer-events-none absolute inset-0"
      >
        {layout.dividers.map((divider) => (
          <line
            key={divider.y}
            x1={0}
            x2={width}
            y1={divider.y}
            y2={divider.y}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={2}
            className="text-ink"
          />
        ))}

        {layout.segments.map(({ from, to, passed }) => {
          const middle = (from.y + to.y) / 2;

          return (
            <path
              key={from.task.id}
              d={`M ${from.x} ${from.y} C ${from.x} ${middle}, ${to.x} ${middle}, ${to.x} ${to.y}`}
              fill="none"
              stroke={passed ? PATH_DONE : PATH_PENDING}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="10 12"
            />
          );
        })}
      </svg>

      {layout.firstTitle ? (
        <span className="pointer-events-none absolute top-0 left-0">
          <FormatLabel>{layout.firstTitle}</FormatLabel>
        </span>
      ) : null}

      {layout.dividers.map((divider) => (
        <span
          key={divider.y}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: divider.y }}
        >
          <FormatLabel>{divider.title}</FormatLabel>
        </span>
      ))}

      {[...layout.main, ...layout.stars].map(({ task, x, y }) => {
        const box = task.kind === "side" ? STAR_OUTER : NODE_OUTER;

        return (
          <div key={task.id} className="absolute" style={{ left: x - box / 2, top: y - box / 2 }}>
            <TaskButton task={task} hidden={selectedId === task.id} onSelect={onSelect} />
          </div>
        );
      })}
    </div>
  );
}

function countCompleted(tasks: Task[]) {
  return tasks.filter((task) => task.status === "completed").length;
}

const cardClass = `${panelClass} overflow-hidden`;
const cardDivider = "border-t-2 border-secondary/15";

function ModuleSection({
  module,
  groups,
  sideTasks,
  locked,
  open,
  selectedId,
  onToggle,
  onSelectTask,
}: {
  module: Module;
  groups: MapGroup[];
  sideTasks: Task[];
  /** Модуль ещё не открылся (`openAt` в будущем) — задания недоступны. */
  locked: boolean;
  open: boolean;
  selectedId: number | null;
  onToggle: () => void;
  onSelectTask: OnSelect;
}) {
  const mapId = useId();
  // Агрегат по основным заданиям модуля — побочные идут в отдельный зачёт.
  const mainTasks = groups.flatMap((group) => group.tasks);
  const completedCount = countCompleted(mainTasks);
  const progress = mainTasks.length === 0 ? 0 : completedCount / mainTasks.length;

  if (locked) {
    return (
      <section aria-label={module.name} className={cardClass}>
        <div className="flex justify-center bg-white px-6 pt-8 pb-6">
          <ModuleBuilding order={module.order} progress={0} locked />
        </div>

        <div className={`${cardDivider} flex items-center justify-between gap-4 px-5 py-4 sm:px-6`}>
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.5rem] font-bold uppercase text-ink/45 sm:text-[1.75rem]">
              {module.name}
            </h2>
            <p className="mt-1 text-[0.875rem] text-ink/60">
              Откроется {formatOpenAt(module.openAt)}
            </p>
          </div>
          <LockedIcon />
        </div>
      </section>
    );
  }

  return (
    <section aria-label={module.name} className={cardClass}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={mapId}
        className="block w-full cursor-pointer text-left outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span className="flex justify-center bg-white px-6 pt-8 pb-6">
          <ModuleBuilding order={module.order} progress={progress} />
        </span>

        <span className={`${cardDivider} block px-5 pt-4 pb-5 sm:px-6`}>
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0 text-[1.5rem] font-bold uppercase text-ink sm:text-[1.75rem]">
              {module.name}
            </span>
            <span className="shrink-0 rounded-[8px] bg-mist px-2.5 py-1 text-[0.9375rem] font-bold text-ink">
              <span className="sr-only">Выполнено </span>
              {completedCount}/{mainTasks.length}
            </span>
          </span>

          <span className="mt-3 block">
            <ProgressBar
              value={completedCount}
              total={mainTasks.length}
              label={`Прогресс модуля «${module.name}»`}
            />
          </span>

          <span className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[0.9375rem] font-bold uppercase tracking-wide text-secondary">
              {open ? "Свернуть задания" : "Открыть задания"}
            </span>
            <ExpandIcon open={open} />
          </span>
        </span>
      </button>

      {open ? (
        <div id={mapId} className={`${cardDivider} px-5 pb-2 sm:px-6`}>
          <ModuleMap
            groups={groups}
            sideTasks={sideTasks}
            selectedId={selectedId}
            onSelect={onSelectTask}
          />
        </div>
      ) : null}
    </section>
  );
}

function StatusLegend() {
  return (
    <div>
      <h3 className="text-[1rem] font-bold uppercase text-ink">Статусы</h3>
      <ul className="mt-3 grid grid-cols-1 gap-x-3 gap-y-3 text-[0.875rem] text-ink/75 sm:grid-cols-2 xl:grid-cols-1">
        {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((status) => (
          <li key={status} className="flex items-center gap-3">
            <TaskNode status={status} size={24} className="mb-0.5" />
            <span>{STATUS_LABEL[status]}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-center gap-3 border-t-2 border-secondary/10 pt-4 text-[0.875rem] text-ink/75">
        <StarTaskNode status="opened" size={26} className="mb-0.5" />
        Побочное задание
      </p>
    </div>
  );
}

function RulesPanel() {
  return (
    <aside
      className={`${panelClass} order-first p-5 xl:order-none xl:sticky xl:top-16 xl:max-h-[calc(100svh-4rem)] xl:self-start xl:overflow-y-auto xl:scrollbar-hidden`}
    >
      <h2 className="text-[1.25rem] font-bold uppercase text-ink">Правила</h2>
      <div className="mt-4 space-y-3 text-[0.9375rem] leading-6 text-ink/75">
        <p>
          Открывайте модули и проходите задания в любом порядке: очные и дистанционные задания
          решаются параллельно.
        </p>
        <p>
          Кружок показывает статус задания: закрыто, открыто, в процессе, на проверке, выполнено,
          пропущено или не принято. Нажмите на кружок, чтобы открыть задание.
        </p>
        <p>
          Звёзды в изгибах пути — побочные задания. Они не обязательны, но дадут вам преимущество в
          виду ценной информации, а результаты по ним идут в отдельный рейтинг.
        </p>
        <p>
          Очные задания выполняются в корпусе, связанным с этим заданием, дистанционные можно
          проходить онлайн. После отправки ручные задания попадают на модерацию и могут быть
          отправлены на доработку.
        </p>
        <p>
          Важно: за выполнение задания вы получаете баллы, кроме того, оценивается время сдачи
          ответа — чем быстрее, тем лучше! Ответ может дать любой участник команды.
        </p>
        <p>
          Вам предстоит разгадать запутанную историю, разобраться во всех связях и узнать много
          нового. Удачи!
        </p>
        <p>
          По вопросам работы сайта/наполнения заданий обращаться по TG:{" "}
          <a
            href="https://t.me/MariyaRodionova2600"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-ink underline underline-offset-2 hover:no-underline"
          >
            @MariyaRodionova2600
          </a>
        </p>
      </div>

      <div className="mt-5 border-t-2 border-secondary/10 pt-5">
        <StatusLegend />
      </div>
    </aside>
  );
}

function toggleInSet(setState: (updater: (current: Set<number>) => Set<number>) => void, id: number) {
  setState((current) => {
    const next = new Set(current);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    return next;
  });
}

export function TasksBoard() {
  const modules = useTasksStore((state) => state.modules);
  const sections = useTasksStore((state) => state.sections);
  const tasks = useTasksStore((state) => state.tasks);
  const status = useTasksStore((state) => state.status);
  const error = useTasksStore((state) => state.error);
  const fetchTasks = useTasksStore((state) => state.fetch);
  const [openModuleIds, setOpenModuleIds] = useState<Set<number>>(() => new Set([1]));
  const [selected, setSelected] = useState<Selected | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const now = useNow();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // После закрытия облачка возвращаем фокус на кружок, с которого его открыли.
  useEffect(() => {
    if (selected === null) triggerRef.current?.focus({ preventScroll: true });
  }, [selected]);

  // На карту каждого модуля: основные задания по разделам + побочные (звёзды).
  const mapsByModule = useMemo(() => {
    const sectionModule = new Map(sections.map((section) => [section.id, section.moduleId]));
    const maps = new Map<number, { groups: MapGroup[]; sideTasks: Task[] }>();

    for (const moduleItem of modules) {
      maps.set(moduleItem.id, {
        groups: sections
          .filter((section) => section.moduleId === moduleItem.id)
          .sort((a, b) => a.order - b.order)
          .map((section) => ({
            section,
            tasks: tasks.filter((task) => task.sectionId === section.id && task.kind === "main"),
          })),
        sideTasks: tasks.filter(
          (task) => task.kind === "side" && sectionModule.get(task.sectionId) === moduleItem.id,
        ),
      });
    }

    return maps;
  }, [modules, sections, tasks]);

  const handleSelectTask: OnSelect = (task, element) => {
    triggerRef.current = element;
    setSelected({ taskId: task.id, element });
  };

  const handleClosePopover = useMemo(() => () => setSelected(null), []);

  if (status === "idle" || status === "loading") {
    return (
      <div className={panelClass}>
        <p className="p-6 text-[1rem] text-ink/70">Загружаем задания…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={panelClass}>
        <p role="alert" className="p-6 text-[1rem] text-error">
          {error ?? "Не удалось загрузить задания"}
        </p>
      </div>
    );
  }

  const selectedTask = selected ? tasks.find((task) => task.id === selected.taskId) : undefined;

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          {modules
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <ModuleSection
                key={module.id}
                module={module}
                groups={mapsByModule.get(module.id)?.groups ?? []}
                sideTasks={mapsByModule.get(module.id)?.sideTasks ?? []}
                locked={!isModuleOpen(module, now)}
                open={openModuleIds.has(module.id)}
                selectedId={selected?.taskId ?? null}
                onToggle={() => toggleInSet(setOpenModuleIds, module.id)}
                onSelectTask={handleSelectTask}
              />
            ))}
        </div>

        <RulesPanel />
      </div>

      {selected && selectedTask ? (
        <TaskPopover
          key={selectedTask.id}
          task={selectedTask}
          anchorEl={selected.element}
          onClose={handleClosePopover}
        />
      ) : null}
    </>
  );
}
