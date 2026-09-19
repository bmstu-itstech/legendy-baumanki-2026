"use client";

import { useEffect, useMemo, useState } from "react";

import { useTasksStore } from "@/lib/store/tasks-store";
import type { Module, Task, TaskSection, TaskStatus } from "@/lib/types";

const panelClass = "rounded-[8px] border-2 border-secondary bg-white";

const STATUS_LABEL: Record<TaskStatus, string> = {
  closed: "Закрыто",
  opened: "Открыто",
  started: "В процессе",
  moderation: "На проверке",
  completed: "Готово",
  skipped: "Пропущено",
  failed: "Не принято",
};

const STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  closed: "border-[#41515a] bg-[#2f3e46] text-[#7c919b]",
  opened: "border-[#18d6ab] bg-[#10c49d] text-white shadow-[0_8px_0_#079579]",
  started: "border-[#18d6ab] bg-[#10c49d] text-white shadow-[0_8px_0_#079579]",
  moderation: "border-[#18d6ab] bg-[#10c49d] text-white shadow-[0_8px_0_#079579]",
  completed: "border-[#18d6ab] bg-[#10c49d] text-white shadow-[0_8px_0_#079579]",
  skipped: "border-[#5b6c74] bg-[#3b4c54] text-[#8da0aa]",
  failed: "border-[#e25b4b] bg-[#d64d3d] text-white shadow-[0_8px_0_#9e3128]",
};

const TASK_ICONS = ["✓", "▰", "◖", "★", "▰", "◖", "✣", "▰", "★"];
const TASK_OFFSETS = [8, -18, -38, -8, 32, 52, 18, -22, -46];

function formatElapsedTime(startedAt: string | null) {
  if (!startedAt) {
    return null;
  }

  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  const totalMinutes = Math.max(1, Math.floor(elapsedMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} мин`;
  }

  return `${hours} ч ${minutes} мин`;
}

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-ink/20 text-[1rem] leading-none text-ink transition-transform ${
        open ? "rotate-90" : ""
      }`}
    >
      ›
    </span>
  );
}

function TaskCircle({ task, onSelect }: { task: Task; onSelect: (task: Task) => void }) {
  const active = task.status === "opened" || task.status === "started";
  const icon = TASK_ICONS[(task.index - 1) % TASK_ICONS.length];

  return (
    <div className="relative flex flex-col items-center">
      {active ? (
        <span className="absolute -top-10 z-10 rounded-[6px] border-2 border-[#263841] bg-[#13252c] px-3 py-1 text-[0.8125rem] font-bold uppercase text-[#17d8aa] shadow-[0_6px_0_rgba(0,0,0,0.28)]">
          Начать
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onSelect(task)}
        className={`group relative flex size-[72px] shrink-0 items-center justify-center rounded-full border-[5px] text-[2rem] font-bold transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:size-[84px] ${
          active ? "scale-110 ring-[8px] ring-[#263841]" : ""
        } ${STATUS_DOT_CLASS[task.status]}`}
        aria-label={`${task.title}. ${STATUS_LABEL[task.status]}`}
        title={`${task.title}: ${STATUS_LABEL[task.status]}`}
      >
        <span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-[#fff4b8] text-[0.75rem] font-bold text-ink">
          {task.index}
        </span>
        <span aria-hidden="true">{icon}</span>
      </button>
    </div>
  );
}

function SectionBlock({
  section,
  tasks,
  open,
  onToggle,
  onSelectTask,
}: {
  section: TaskSection;
  tasks: Task[];
  open: boolean;
  onToggle: () => void;
  onSelectTask: (task: Task) => void;
}) {
  return (
    <div className="rounded-[8px] border border-ink/10 bg-mist/45">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-[1.0625rem] font-bold uppercase text-ink">{section.title}</span>
        <ExpandIcon open={open} />
      </button>

      {open ? (
        <div className="border-t border-ink/10 p-3 sm:p-5">
          <div className="relative min-h-[680px] overflow-hidden rounded-[8px] bg-[#102126] px-4 py-8 sm:min-h-[760px] sm:px-8">
            <div className="absolute left-3 top-3 rounded-[2px] bg-[#fff4b8] px-3 py-2 text-[0.75rem] leading-4 text-ink shadow-[0_2px_0_rgba(0,0,0,0.12)]">
              Номера заданий внутри кружочка
            </div>
            <div className="pointer-events-none absolute bottom-[14%] left-[12%] hidden size-24 rounded-full bg-[#2f3e46] opacity-35 sm:block" />
            <div className="pointer-events-none absolute right-[10%] top-[22%] hidden size-20 rounded-full bg-[#f0a58e] opacity-70 sm:block" />
            <div className="pointer-events-none absolute bottom-[4%] right-[14%] hidden size-20 rounded-full bg-[#2f3e46] opacity-45 sm:block" />

            <div className="mx-auto flex w-full max-w-[380px] flex-col items-center gap-9 pt-8 sm:gap-11">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex w-full justify-center transition-transform"
                  style={{
                    transform: `translateX(${TASK_OFFSETS[index % TASK_OFFSETS.length]}%)`,
                  }}
                >
                  <TaskCircle task={task} onSelect={onSelectTask} />
                </div>
              ))}
            </div>
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
  onToggleModule,
  onToggleSection,
  onSelectTask,
}: {
  module: Module;
  sections: TaskSection[];
  tasksBySection: Map<number, Task[]>;
  open: boolean;
  openSections: Set<number>;
  onToggleModule: () => void;
  onToggleSection: (sectionId: number) => void;
  onSelectTask: (task: Task) => void;
}) {
  const completedCount = sections.reduce(
    (count, section) =>
      count + (tasksBySection.get(section.id) ?? []).filter((task) => task.status === "completed").length,
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
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[1.25rem] font-bold uppercase text-ink sm:text-[1.5rem]">
            {module.name}
          </span>
          <span className="mt-1 block text-[0.875rem] text-ink/55">
            Выполнено {completedCount} из {totalCount}
          </span>
        </span>
        <ExpandIcon open={open} />
      </button>

      {open ? (
        <div className="flex flex-col gap-4 border-t border-ink/10 px-4 py-4 sm:px-6">
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              tasks={tasksBySection.get(section.id) ?? []}
              open={openSections.has(section.id)}
              onToggle={() => onToggleSection(section.id)}
              onSelectTask={onSelectTask}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function RulesPanel() {
  return (
    <aside className={`${panelClass} order-first p-5 xl:order-none xl:sticky xl:top-6 xl:self-start`}>
      <h2 className="text-[1.25rem] font-bold uppercase text-ink">Правила</h2>
      <div className="mt-4 space-y-3 text-[0.9375rem] leading-6 text-ink/72">
        <p>Открывайте модули, выбирайте формат участия и проходите задания по порядку.</p>
        <p>
          Кружок показывает статус задания: закрыто, открыто, в процессе, на проверке,
          выполнено, пропущено или не принято.
        </p>
        <p>
          Очные задания выполняются на площадке, дистанционные можно проходить онлайн. После
          отправки ручные задания попадают на модерацию.
        </p>
      </div>

      <div className="mt-5 border-t border-ink/10 pt-5">
        <StatusLegend />
      </div>
    </aside>
  );
}

function StatusLegend() {
  return (
    <div>
      <h3 className="text-[1rem] font-bold uppercase text-ink">Статусы</h3>
      <div className="mt-3 grid grid-cols-1 gap-2 text-[0.875rem] text-ink/70 sm:grid-cols-2 xl:grid-cols-1">
        {Object.entries(STATUS_LABEL).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className={`size-5 rounded-full border-2 ${STATUS_DOT_CLASS[status as TaskStatus]}`}
              aria-hidden="true"
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskModal({
  task,
  totalTasks,
  onClose,
}: {
  task: Task;
  totalTasks: number;
  onClose: () => void;
}) {
  const elapsedTime = formatElapsedTime(task.startedAt);
  const showElapsedTime = task.status === "started" || task.status === "moderation" || task.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-8" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-[520px] rounded-[8px] border-2 border-secondary bg-white p-6 shadow-[0_24px_70px_rgba(17,17,17,0.22)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.8125rem] font-bold uppercase text-secondary">
              {STATUS_LABEL[task.status]}
            </p>
            <h2 id="task-modal-title" className="mt-2 text-[1.5rem] font-bold uppercase text-ink">
              {task.title}
            </h2>
            <p className="mt-2 text-[1rem] text-ink/60">
              Задание {task.index} из {totalTasks}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/20 text-[1.25rem] text-ink hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {showElapsedTime ? (
          <p className="mt-5 rounded-[8px] bg-mist px-4 py-3 text-[0.9375rem] text-ink/72">
            Время от старта задания: {elapsedTime ?? "пока неизвестно"}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            className="rounded-[8px] bg-accent px-6 py-3 text-[0.9375rem] font-bold uppercase text-white transition hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {task.status === "opened" ? "Начать" : "Приступить"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const tasksBySection = useMemo(() => {
    const groupedTasks = new Map<number, Task[]>();

    for (const task of tasks) {
      const list = groupedTasks.get(task.sectionId) ?? [];
      list.push(task);
      groupedTasks.set(task.sectionId, list);
    }

    return groupedTasks;
  }, [tasks]);

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
                onToggleModule={() => {
                  setOpenModuleIds((current) => {
                    const next = new Set(current);

                    if (next.has(module.id)) {
                      next.delete(module.id);
                    } else {
                      next.add(module.id);
                    }

                    return next;
                  });
                }}
                onToggleSection={(sectionId) => {
                  setOpenSectionIds((current) => {
                    const next = new Set(current);

                    if (next.has(sectionId)) {
                      next.delete(sectionId);
                    } else {
                      next.add(sectionId);
                    }

                    return next;
                  });
                }}
                onSelectTask={setSelectedTask}
              />
            ))}
        </div>

        <RulesPanel />
      </div>

      {selectedTask ? (
        <TaskModal
          task={selectedTask}
          totalTasks={tasksBySection.get(selectedTask.sectionId)?.length ?? selectedTask.index}
          onClose={() => setSelectedTask(null)}
        />
      ) : null}
    </>
  );
}
