import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TaskDetailPage } from "@/components/tasks/task-detail-page";

export const metadata: Metadata = {
  title: "Задание — Легенды Бауманки 2026",
  description: "Страница задания квеста «Легенды Бауманки».",
};

export default async function TaskPage(props: PageProps<"/profile/tasks/[taskId]">) {
  const { taskId } = await props.params;
  const id = Number(taskId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  return <TaskDetailPage taskId={id} />;
}
