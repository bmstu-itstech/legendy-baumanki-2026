import { create } from "zustand";

import { MOCK_MODULES, MOCK_SECTIONS, MOCK_TASKS } from "@/lib/mocks/tasks";
import type { Module, Task, TaskSection } from "@/lib/types";

type TasksStatus = "idle" | "loading" | "loaded" | "error";

type TasksState = {
  modules: Module[];
  sections: TaskSection[];
  tasks: Task[];
  status: TasksStatus;
  error: string | null;
};

type TasksActions = {
  fetch: () => Promise<void>;
  /** opened -> started */
  start: (taskId: number) => Promise<void>;
  /** started -> review (ручная проверка) | completed (авто-проверка) */
  submitAnswer: (taskId: number, answer: string) => Promise<void>;
  /** opened | started -> skipped */
  skip: (taskId: number) => Promise<void>;
};

const MOCK_LATENCY_MS = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useTasksStore = create<TasksState & TasksActions>((set, get) => {
  const patchTask = (taskId: number, patch: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));

  const getTask = (taskId: number) => {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) throw new Error("Задание не найдено");
    return task;
  };

  return {
    modules: [],
    sections: [],
    tasks: [],
    status: "idle",
    error: null,

    // TODO: заменить на lib/api/tasks.ts, когда появится бэкенд — пока моки.
    // Пока данные моковые, повторный fetch ничего не перезаписывает: иначе
    // возврат со страницы задания на карту сбрасывал бы сделанные локально
    // переходы статусов. С реальным API здесь нужна актуализация с сервера.
    fetch: async () => {
      if (get().status === "loaded") return;

      set({ status: "loading", error: null });
      try {
        await delay(200);
        set({ modules: MOCK_MODULES, sections: MOCK_SECTIONS, tasks: MOCK_TASKS, status: "loaded" });
      } catch {
        set({ status: "error", error: "Не удалось загрузить задания" });
      }
    },

    // TODO: POST /tasks/{id}/start
    start: async (taskId) => {
      const task = getTask(taskId);
      if (task.status !== "opened") throw new Error("Задание нельзя начать");

      await delay(MOCK_LATENCY_MS);
      patchTask(taskId, { status: "started", startedAt: new Date().toISOString() });
    },

    // TODO: POST /tasks/{id}/answer — статус и пояснение приходят от бэкенда.
    // TODO: по ТЗ ответы на сервер уходят одним запросом, когда собраны ответы на все
    // вопросы задания (сейчас в моке один ответ = одно задание).
    // В моке любой ответ принимается: авто-задания сразу засчитываются,
    // ручные уходят на модерацию.
    submitAnswer: async (taskId, answer) => {
      const task = getTask(taskId);
      if (task.status !== "started") throw new Error("Ответ на это задание уже нельзя отправить");
      if (!answer.trim()) throw new Error("Введите ответ");

      await delay(MOCK_LATENCY_MS);
      patchTask(taskId, {
        status: task.checkType === "auto" ? "completed" : "review",
        finishedAt: new Date().toISOString(),
      });
    },

    // TODO: POST /tasks/{id}/skip
    skip: async (taskId) => {
      const task = getTask(taskId);
      if (task.status !== "opened" && task.status !== "started") {
        throw new Error("Это задание нельзя пропустить");
      }

      await delay(MOCK_LATENCY_MS);
      patchTask(taskId, { status: "skipped", finishedAt: new Date().toISOString() });
    },
  };
});
