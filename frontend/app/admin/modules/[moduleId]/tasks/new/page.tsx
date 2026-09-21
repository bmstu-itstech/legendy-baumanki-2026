"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { adminApi, type AdminSection } from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import { Notice } from "@/components/admin/admin-ui";
import { TaskEditorForm } from "@/components/admin/task-editor-form";

export default function AdminNewTaskPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = Number(params.moduleId);

  const [sections, setSections] = useState<AdminSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getModuleContent(moduleId)
      .then((content) => setSections(content.sections))
      .catch((err) => setError(toErrorMessage(err)));
  }, [moduleId]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!sections) return <p className="text-ink/70">Загрузка…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/modules/${moduleId}`}
        className="text-[0.875rem] font-bold uppercase text-ink/60 underline-offset-4 hover:underline"
      >
        ← Модуль
      </Link>
      <TaskEditorForm moduleId={moduleId} sections={sections} />
    </div>
  );
}
