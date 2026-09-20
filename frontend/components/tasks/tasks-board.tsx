"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Sparkle, Star } from "@/components/ui/decor";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { Module, Task, TaskSection, TaskStatus } from "@/lib/types";

import { LiveTaskNode, NODE_OUTER, TaskNode } from "./task-node";
import { TaskPopover } from "./task-popover";
import { STATUS_LABEL } from "./task-status";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const panelClass = "rounded-[18px] border-2 border-secondary bg-white";

/** Шаг по вертикали между кружками, отступ сверху (под метку «Начать») и снизу. */
const MAP_ROW = 116;
const MAP_TOP = 92;
const MAP_BOTTOM = 56;
/** Форма «змейки»: множитель бокового смещения кружка от центра карты. */
const MAP_WAVE = [0, 0.6, 0.95, 0.6, 0, -0.6, -0.95, -0.6];
const MAP_MAX_AMPLITUDE = 120;

const PATH_DONE = "#12cf9e";
const PATH_PENDING = "#33444d";
/** Статусы, после которых команда «прошла» задание, — тропа за ним подсвечивается. */
const PASSED_STATUSES: TaskStatus[] = ["completed", "skipped", "failed", "moderation"];

type Selected = { taskId: number; element: HTMLElement };

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

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-mist"
    >
      <div
        className="h-full rounded-full bg-secondary transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function countCompleted(tasks: Task[]) {
  return tasks.filter((task) => task.status === "completed").length;
}

/** Декор по бокам от тропы: синие «таблетки» как на фрейме, искры и звёзды из палитры сайта. */
function MapDecor({ kind, rotate }: { kind: number; rotate: number }) {
  switch (kind % 4) {
    case 0:
      return (
        <span
          className="block h-3 w-9 rounded-full bg-[#2b8cf0]"
          style={{ transform: `rotate(${rotate}deg)` }}
        />
      );
    case 1:
      return <Sparkle className="size-7 text-[#fff4b8]" />;
    case 2:
      return <Star className="size-8 text-accent" />;
    default:
      return <span className="block size-3 rounded-full bg-[#f2a7c3]" />;
  }
}

function TaskButton({
  task,
  hidden,
  onSelect,
}: {
  task: Task;
  hidden: boolean;
  onSelect: (task: Task, element: HTMLElement) => void;
}) {
  const showRing = task.status === "opened" || task.status === "started";
  const tag = task.status === "opened" ? "Начать" : task.status === "started" ? "Продолжить" : null;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${task.title}. ${STATUS_LABEL[task.status]}`}
      title={`${task.title}: ${STATUS_LABEL[task.status]}`}
      onClick={(event) => onSelect(task, event.currentTarget)}
      className="relative flex cursor-pointer items-center justify-center rounded-full outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-accent active:translate-y-0.5"
      style={{ width: NODE_OUTER, height: NODE_OUTER, visibility: hidden ? "hidden" : undefined }}
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

      <LiveTaskNode task={task} ring={showRing} />
    </button>
  );
}

function SectionMap({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: Task[];
  selectedId: number | null;
  onSelect: (task: Task, element: HTMLElement) => void;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>(360);

  const amplitude = Math.max(0, Math.min((width - NODE_OUTER) / 2 - 8, MAP_MAX_AMPLITUDE));
  const points = tasks.map((_, index) => ({
    x: width / 2 + amplitude * MAP_WAVE[index % MAP_WAVE.length],
    y: MAP_TOP + index * MAP_ROW,
  }));
  const height = MAP_TOP + Math.max(0, tasks.length - 1) * MAP_ROW + NODE_OUTER / 2 + MAP_BOTTOM;
  const showDecor = width >= 280;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[460px]" style={{ height }}>
      <svg
        aria-hidden="true"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="pointer-events-none absolute inset-0"
      >
        {points.slice(0, -1).map((from, index) => {
          const to = points[index + 1];
          const middle = (from.y + to.y) / 2;
          const passed = PASSED_STATUSES.includes(tasks[index].status);

          return (
            <path
              key={tasks[index].id}
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

      {showDecor
        ? points.map((point, index) => {
            if (index % 2 === 0) return null;

            // Декор ставим с противоположной от кружка стороны.
            const onLeft = point.x > width / 2;
            const inset = 22 + (index % 3) * 12;

            return (
              <span
                key={tasks[index].id}
                aria-hidden="true"
                className="pointer-events-none absolute opacity-80"
                style={{
                  top: point.y + ((index % 3) - 1) * 16,
                  ...(onLeft ? { left: inset } : { right: inset }),
                }}
              >
                <MapDecor kind={index >> 1} rotate={index % 2 === 0 ? -24 : 28} />
              </span>
            );
          })
        : null}

      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="absolute"
          style={{ left: points[index].x - NODE_OUTER / 2, top: points[index].y - NODE_OUTER / 2 }}
        >
          <TaskButton task={task} hidden={selectedId === task.id} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  tasks,
  open,
  selectedId,
  onToggle,
  onSelectTask,
}: {
  section: TaskSection;
  tasks: Task[];
  open: boolean;
  selectedId: number | null;
  onToggle: () => void;
  onSelectTask: (task: Task, element: HTMLElement) => void;
}) {
  const completed = countCompleted(tasks);

  return (
    <div className="overflow-hidden rounded-[14px] border-2 border-secondary/15 bg-mist/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-[1.0625rem] font-bold uppercase text-ink">{section.title}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-ink/55">
            Выполнено {completed} из {tasks.length}
          </span>
        </span>
        <ExpandIcon open={open} />
      </button>

      {open ? (
        <div className="border-t-2 border-secondary/10 p-3 sm:p-4">
          <div
            className="relative overflow-hidden rounded-[14px] px-3 py-5 sm:px-6"
            style={{
              backgroundColor: "#101c22",
              backgroundImage:
                "radial-gradient(120% 55% at 50% 0%, rgb(18 207 158 / 0.16), transparent 60%), radial-gradient(90% 45% at 50% 100%, rgb(74 78 140 / 0.4), transparent 70%)",
            }}
          >
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[0.8125rem] font-bold uppercase leading-5 text-white/80">
              Пройдено {completed} из {tasks.length}
            </span>

            <SectionMap tasks={tasks} selectedId={selectedId} onSelect={onSelectTask} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModuleCard({
  module,
  sections,
  tasksBySection,
  open,
  openSections,
  selectedId,
  onToggleModule,
  onToggleSection,
  onSelectTask,
}: {
  module: Module;
  sections: TaskSection[];
  tasksBySection: Map<number, Task[]>;
  open: boolean;
  openSections: Set<number>;
  selectedId: number | null;
  onToggleModule: () => void;
  onToggleSection: (sectionId: number) => void;
  onSelectTask: (task: Task, element: HTMLElement) => void;
}) {
  const completedCount = sections.reduce(
    (count, section) => count + countCompleted(tasksBySection.get(section.id) ?? []),
    0,
  );
  const totalCount = sections.reduce(
    (count, section) => count + (tasksBySection.get(section.id) ?? []).length,
    0,
  );

  return (
    <article className={panelClass}>
      <button
        type="button"
        onClick={onToggleModule}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[1.25rem] font-bold uppercase text-ink sm:text-[1.5rem]">
            {module.name}
          </span>
          <span className="mt-1 block text-[0.875rem] text-ink/55">
            Выполнено {completedCount} из {totalCount}
          </span>
          <span className="mt-3 block max-w-[320px]">
            <ProgressBar
              value={completedCount}
              total={totalCount}
              label={`Прогресс модуля «${module.name}»`}
            />
          </span>
        </span>
        <ExpandIcon open={open} />
      </button>

      {open ? (
        <div className="flex flex-col gap-4 border-t-2 border-secondary/10 px-4 py-4 sm:px-6 sm:py-5">
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              tasks={tasksBySection.get(section.id) ?? []}
              open={openSections.has(section.id)}
              selectedId={selectedId}
              onToggle={() => onToggleSection(section.id)}
              onSelectTask={onSelectTask}
            />
          ))}
        </div>
      ) : null}
    </article>
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
    </div>
  );
}

function RulesPanel(): ReactNode {
  return (
    <aside className={`${panelClass} order-first p-5 xl:order-none xl:sticky xl:top-16 xl:self-start`}>
      <h2 className="text-[1.25rem] font-bold uppercase text-ink">Правила</h2>
      <div className="mt-4 space-y-3 text-[0.9375rem] leading-6 text-ink/75">
        <p>Открывайте модули, выбирайте формат участия и проходите задания по порядку.</p>
        <p>
          Кружок показывает статус задания: закрыто, открыто, в процессе, на проверке, выполнено,
          пропущено или не принято. Нажмите на кружок, чтобы открыть задание.
        </p>
        <p>
          Очные задания выполняются на площадке, дистанционные можно проходить онлайн. После
          отправки ручные задания попадают на модерацию.
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
  const [openSectionIds, setOpenSectionIds] = useState<Set<number>>(() => new Set([11]));
  const [selected, setSelected] = useState<Selected | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // После закрытия облачка возвращаем фокус на кружок, с которого его открыли.
  useEffect(() => {
    if (selected === null) triggerRef.current?.focus({ preventScroll: true });
  }, [selected]);

  const tasksBySection = useMemo(() => {
    const groupedTasks = new Map<number, Task[]>();

    for (const task of tasks) {
      const list = groupedTasks.get(task.sectionId) ?? [];
      list.push(task);
      groupedTasks.set(task.sectionId, list);
    }

    return groupedTasks;
  }, [tasks]);

  const handleSelectTask = (task: Task, element: HTMLElement) => {
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          {modules
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                sections={sections
                  .filter((section) => section.moduleId === module.id)
                  .sort((a, b) => a.order - b.order)}
                tasksBySection={tasksBySection}
                open={openModuleIds.has(module.id)}
                openSections={openSectionIds}
                selectedId={selected?.taskId ?? null}
                onToggleModule={() => toggleInSet(setOpenModuleIds, module.id)}
                onToggleSection={(sectionId) => toggleInSet(setOpenSectionIds, sectionId)}
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
          total={tasksBySection.get(selectedTask.sectionId)?.length ?? 1}
          anchorEl={selected.element}
          onClose={handleClosePopover}
        />
      ) : null}
    </>
  );
}
