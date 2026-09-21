"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { adminApi, type AdminModuleContent, type AdminTask } from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import {
  DangerButton,
  Field,
  Notice,
  PrimaryButton,
  SecondaryButton,
  TextInput,
  panelClass,
  secondaryButtonClass,
} from "@/components/admin/admin-ui";

/** ISO -> значение для <input type="datetime-local"> в локальном времени браузера. */
function toDatetimeLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TaskList({
  tasks,
  moduleId,
  onDelete,
}: {
  tasks: AdminTask[];
  moduleId: number;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0) {
    return <p className="mt-2 text-[0.875rem] text-ink/60">Заданий нет.</p>;
  }

  return (
    <ul className="mt-2 flex flex-col gap-2">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border-2 border-secondary/15 px-3.5 py-2.5"
        >
          <span className="text-ink">
            {t.number}. {t.title}{" "}
            <span className="text-[0.8125rem] text-ink/50">
              ({t.maxScore} балл{t.maxScore === 1 ? "" : "ов"}
              {t.manualReview ? ", ручная проверка" : ""})
            </span>
          </span>
          <div className="flex gap-2">
            <Link href={`/admin/modules/${moduleId}/tasks/${t.id}`} className={secondaryButtonClass}>
              Изменить
            </Link>
            <DangerButton onClick={() => onDelete(t.id)}>Удалить</DangerButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminModuleDetailPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = Number(params.moduleId);
  const router = useRouter();

  const [content, setContent] = useState<AdminModuleContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [savingModule, setSavingModule] = useState(false);

  const [sectionTitle, setSectionTitle] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  async function load() {
    try {
      const c = await adminApi.getModuleContent(moduleId);
      setContent(c);
      setTitle(c.module.title);
      setOpenAt(toDatetimeLocalInput(c.module.openAt));
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  useEffect(() => {
    adminApi
      .getModuleContent(moduleId)
      .then((c) => {
        setContent(c);
        setTitle(c.module.title);
        setOpenAt(toDatetimeLocalInput(c.module.openAt));
      })
      .catch((err) => setError(toErrorMessage(err)));
  }, [moduleId]);

  async function handleSaveModule(event: FormEvent) {
    event.preventDefault();
    setSavingModule(true);
    setError(null);
    try {
      await adminApi.updateModule(moduleId, {
        title: title.trim(),
        openAt: new Date(openAt).toISOString(),
      });
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSavingModule(false);
    }
  }

  async function handleDeleteModule() {
    if (!confirm("Удалить модуль? Это возможно, только если в нём нет секций и заданий.")) return;
    try {
      await adminApi.deleteModule(moduleId);
      router.push("/admin");
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  async function handleCreateSection(event: FormEvent) {
    event.preventDefault();
    if (!sectionTitle.trim()) return;

    setCreatingSection(true);
    setError(null);
    try {
      await adminApi.createSection(moduleId, sectionTitle.trim());
      setSectionTitle("");
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setCreatingSection(false);
    }
  }

  async function handleRenameSection(number: number, currentTitle: string) {
    const next = prompt("Новое название секции", currentTitle);
    if (next === null || !next.trim()) return;
    try {
      await adminApi.updateSection(moduleId, number, next.trim());
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  async function handleDeleteSection(number: number) {
    if (!confirm("Удалить секцию? Это возможно, только если в ней нет заданий.")) return;
    try {
      await adminApi.deleteSection(moduleId, number);
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (!confirm("Удалить задание? Отменить будет нельзя.")) return;
    try {
      await adminApi.deleteTask(taskId);
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  if (!content) {
    return error ? <Notice tone="error">{error}</Notice> : <p className="text-ink/70">Загрузка…</p>;
  }

  const tasksBySection = new Map<number, AdminTask[]>();
  const auxiliaryTasks: AdminTask[] = [];
  for (const t of content.tasks) {
    if (t.sectionNumber === null) {
      auxiliaryTasks.push(t);
    } else {
      tasksBySection.set(t.sectionNumber, [...(tasksBySection.get(t.sectionNumber) ?? []), t]);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="text-[0.875rem] font-bold uppercase text-ink/60 underline-offset-4 hover:underline"
      >
        ← Модули
      </Link>

      <div className={panelClass}>
        <h1 className="text-[1.25rem] font-bold uppercase text-ink">Модуль</h1>
        <form onSubmit={handleSaveModule} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Название" htmlFor="module-title">
              <TextInput
                id="module-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Открытие" htmlFor="module-open-at">
              <TextInput
                id="module-open-at"
                type="datetime-local"
                value={openAt}
                onChange={(event) => setOpenAt(event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={savingModule}>
              {savingModule ? "Сохраняем…" : "Сохранить"}
            </PrimaryButton>
            <DangerButton onClick={handleDeleteModule}>Удалить</DangerButton>
          </div>
        </form>
      </div>

      <div className={panelClass}>
        <h2 className="text-[1.0625rem] font-bold uppercase text-ink">Секции</h2>

        {content.sections.length === 0 ? (
          <p className="mt-3 text-ink/70">Секций пока нет.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {content.sections.map((s) => (
              <li
                key={s.number}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border-2 border-secondary/15 px-3.5 py-2.5"
              >
                <span className="font-bold text-ink">
                  {s.number}. {s.title}
                </span>
                <div className="flex gap-2">
                  <SecondaryButton onClick={() => handleRenameSection(s.number, s.title)}>
                    Переименовать
                  </SecondaryButton>
                  <DangerButton onClick={() => handleDeleteSection(s.number)}>Удалить</DangerButton>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreateSection} className="mt-4 flex flex-wrap gap-3">
          <TextInput
            value={sectionTitle}
            onChange={(event) => setSectionTitle(event.target.value)}
            placeholder="Название новой секции"
            className="min-w-[220px] flex-1"
          />
          <PrimaryButton type="submit" disabled={creatingSection}>
            {creatingSection ? "Добавляем…" : "Добавить секцию"}
          </PrimaryButton>
        </form>
      </div>

      <div className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.0625rem] font-bold uppercase text-ink">Задания</h2>
          <Link href={`/admin/modules/${moduleId}/tasks/new`} className={secondaryButtonClass}>
            + Задание
          </Link>
        </div>

        {content.sections.map((s) => (
          <div key={s.number} className="mt-4">
            <h3 className="text-[0.9375rem] font-bold uppercase text-ink/70">{s.title}</h3>
            <TaskList
              tasks={tasksBySection.get(s.number) ?? []}
              moduleId={moduleId}
              onDelete={handleDeleteTask}
            />
          </div>
        ))}

        <div className="mt-4">
          <h3 className="text-[0.9375rem] font-bold uppercase text-ink/70">Побочные задания</h3>
          <TaskList tasks={auxiliaryTasks} moduleId={moduleId} onDelete={handleDeleteTask} />
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
