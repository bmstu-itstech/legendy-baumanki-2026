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

async function loadTree(): Promise<Pick<TasksState, "modules" | "sections" | "tasks">> {
  const modules = await tasksApi.getModules();
  const details = await Promise.all(modules.map((module) => tasksApi.getModuleDetails(module.id)));
  return {
    modules,
    sections: details.flatMap((detail) => detail.sections),
    tasks: details.flatMap((detail) => detail.tasks),
  };
}

export const useTasksStore = create<TasksState & TasksActions>((set, get) => {
  const patchTask = (taskId: number, patch: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));

  // После start/submitAnswer/skip статус других заданий тоже мог поменяться
  // (следующее задание в цепочке require_task_id разблокировалось), а
  // patchTask точечно обновляет только само действие. Тихо перекачиваем всё
  // дерево — без этого разблокировка была видна только после перезагрузки
  // страницы (заново создающей store). status не трогаем, чтобы не мигать
  // загрузкой поверх уже отрисованной карты; если рефреш не удался, ничего
  // не теряем — следующее действие или ручной reload всё равно поправят.
  const refreshTree = async () => {
    try {
      set(await loadTree());
    } catch {
      // молча игнорируем — patchTask уже отразил результат самого действия
    }
  };

  return {
    modules: [],
    sections: [],
    tasks: [],
    status: "idle",
    error: null,

    fetch: async () => {
      if (get().status === "loaded") return;

      set({ status: "loading", error: null });
      try {
        set({ ...(await loadTree()), status: "loaded" });
      } catch (err) {
        set({ status: "error", error: toErrorMessage(err) });
      }
    },

    start: async (taskId) => {
      let progress;
      try {
        progress = await tasksApi.start(taskId);
      } catch (err) {
        throw new Error(toErrorMessage(err));
      }
      patchTask(taskId, progress);
      await refreshTree();
    },

    submitAnswer: async (taskId, answers) => {
      let progress;
      try {
        progress = await tasksApi.answer(taskId, answers);
      } catch (err) {
        throw new Error(toErrorMessage(err));
      }
      patchTask(taskId, progress);
      await refreshTree();
    },

    skip: async (taskId) => {
      let progress;
      try {
        progress = await tasksApi.skip(taskId);
      } catch (err) {
        throw new Error(toErrorMessage(err));
      }
      patchTask(taskId, progress);
      await refreshTree();
    },
  };
});
