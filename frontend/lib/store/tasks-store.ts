import { create } from "zustand";

import { toErrorMessage } from "@/lib/api/errors";
import { tasksApi } from "@/lib/api/tasks";
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
  /** started -> review (ручная проверка) | completed | failed (авто-проверка) */
  submitAnswer: (taskId: number, answers: string[]) => Promise<void>;
  /** opened | started -> skipped */
  skip: (taskId: number) => Promise<void>;
};

export const useTasksStore = create<TasksState & TasksActions>((set, get) => {
  const patchTask = (taskId: number, patch: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));

  return {
    modules: [],
    sections: [],
    tasks: [],
    status: "idle",
    error: null,

    // Повторный fetch ничего не перезапрашивает — дальнейшая актуализация
    // статусов идёт точечно через start/submitAnswer/skip, без рефетча дерева.
    fetch: async () => {
      if (get().status === "loaded") return;

      set({ status: "loading", error: null });
      try {
        const modules = await tasksApi.getModules();
        const details = await Promise.all(
          modules.map((module) => tasksApi.getModuleDetails(module.id)),
        );
        set({
          modules,
          sections: details.flatMap((detail) => detail.sections),
          tasks: details.flatMap((detail) => detail.tasks),
          status: "loaded",
        });
      } catch (err) {
        set({ status: "error", error: toErrorMessage(err) });
      }
    },

    start: async (taskId) => {
      try {
        patchTask(taskId, await tasksApi.start(taskId));
      } catch (err) {
        throw new Error(toErrorMessage(err));
      }
    },

    submitAnswer: async (taskId, answers) => {
      try {
        patchTask(taskId, await tasksApi.answer(taskId, answers));
      } catch (err) {
        throw new Error(toErrorMessage(err));
      }
    },

    skip: async (taskId) => {
      try {
        patchTask(taskId, await tasksApi.skip(taskId));
      } catch (err) {
        throw new Error(toErrorMessage(err));
      }
    },
  };
});
