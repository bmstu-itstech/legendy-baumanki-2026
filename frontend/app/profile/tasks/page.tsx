import type { Metadata } from "next";

import { TasksBoard } from "@/components/tasks/tasks-board";

export const metadata: Metadata = {
  title: "Задания — Легенды Бауманки 2026",
  description: "Задания квеста «Легенды Бауманки» по модулям и разделам.",
};

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-[1.375rem] font-bold uppercase text-ink sm:text-h3">Задания</h1>

      <div className="mt-6">
        <TasksBoard />
      </div>
    </div>
  );
}
