"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { adminApi, type AdminSection, type AdminTask } from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import { Notice } from "@/components/admin/admin-ui";
import { TaskEditorForm } from "@/components/admin/task-editor-form";

export default function AdminEditTaskPage() {
  const params = useParams<{ moduleId: string; taskId: string }>();
  const moduleId = Number(params.moduleId);
  const taskId = Number(params.taskId);

  const [sections, setSections] = useState<AdminSection[] | null>(null);
  const [task, setTask] = useState<AdminTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.getModuleContent(moduleId), adminApi.getTask(taskId)])
      .then(([content, loadedTask]) => {
        setSections(content.sections);
        setTask(loadedTask);
      })
      .catch((err) => setError(toErrorMessage(err)));
  }, [moduleId, taskId]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!sections || !task) return <p className="text-ink/70">Загрузка…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/modules/${moduleId}`}
        className="text-[0.875rem] font-bold uppercase text-ink/60 underline-offset-4 hover:underline"
      >
        ← Модуль
      </Link>
      <TaskEditorForm moduleId={moduleId} sections={sections} task={task} />
    </div>
  );
}
