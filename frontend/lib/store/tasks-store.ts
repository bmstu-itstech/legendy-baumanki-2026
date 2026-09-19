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
};

export const useTasksStore = create<TasksState & TasksActions>((set) => ({
  modules: [],
  sections: [],
  tasks: [],
  status: "idle",
  error: null,

  // TODO: заменить на lib/api/tasks.ts, когда появится бэкенд — пока моки.
  fetch: async () => {
    set({ status: "loading", error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      set({ modules: MOCK_MODULES, sections: MOCK_SECTIONS, tasks: MOCK_TASKS, status: "loaded" });
    } catch {
      set({ status: "error", error: "Не удалось загрузить задания" });
    }
  },
}));
