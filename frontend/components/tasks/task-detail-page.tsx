"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";

import { Modal } from "@/components/ui/modal";
import { toErrorMessage } from "@/lib/api/errors";
import { fileDownloadUrl, filesApi } from "@/lib/api/files";
import { formatDuration } from "@/lib/format";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { Task, TaskMedia, TaskQuestion } from "@/lib/types";

import { formatOpenAt, isModuleOpen, useNow } from "./module-access";
import { TaskStatusBadge } from "./task-status-badge";
import { useElapsedSeconds } from "./use-elapsed";

const cardClass = "rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9";

const primaryButtonClass =
  "h-12 cursor-pointer rounded-[14px] bg-ink px-8 font-hand text-[1.125rem] uppercase text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "h-12 cursor-pointer rounded-[14px] border border-ink px-8 font-hand text-[1.125rem] uppercase text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

type PendingAction = "start" | "submit" | "skip";

function formatTaskNumber(id: number) {
  return `#${String(id).padStart(4, "0")}`;
}

/** Формат ответа проверяем регуляркой от бэка (полное совпадение, как у атрибута pattern). */
function validateAnswer(value: string, question: TaskQuestion) {
  const trimmed = value.trim();
  if (!trimmed) return question.questionType === "file" ? "Загрузите файл" : "Введите ответ";

  const { pattern } = question;
  if (pattern) {
    try {
      if (!new RegExp(`^(?:${pattern})$`).test(trimmed)) {
        return "Ответ не соответствует ожидаемому формату";
      }
    } catch {
      // Регулярку от бэка не удалось разобрать в JS — решение за сервером.
    }
  }

  return null;
}

function Notice({
  tone,
  children,
}: {
  tone: "info" | "success" | "error";
  children: ReactNode;
}) {
  const toneClass = {
    info: "border-secondary/40 bg-mist",
    success: "border-success bg-success/15",
    error: "border-error bg-error/10",
  }[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[12px] border-2 px-4 py-3 text-[1rem] leading-6 text-ink ${toneClass}`}
    >
      {children}
    </div>
  );
}

function MediaItem({ item, single }: { item: TaskMedia; single: boolean }) {
  const frameClass = "overflow-hidden rounded-[12px] border-2 border-ink/10 bg-mist";

  if (item.type === "image") {
    return (
      <figure className={frameClass}>
        {/* Медиа приходят с бэкенда с произвольных адресов — next/image здесь не подходит. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption ?? "Иллюстрация к заданию"}
          loading="lazy"
          className={`w-full object-cover ${single ? "max-h-[420px]" : "aspect-[4/3]"}`}
        />
      </figure>
    );
  }

  if (item.type === "video") {
    return (
      <div className={frameClass}>
        <video controls preload="metadata" src={item.url} className="w-full bg-ink">
          <track kind="captions" />
        </video>
      </div>
    );
  }

  return (
    <div className={`${frameClass} flex flex-col justify-center gap-2 p-3`}>
      {item.caption ? <span className="text-[0.875rem] text-ink/70">{item.caption}</span> : null}
      <audio controls preload="metadata" src={item.url} className="w-full" />
    </div>
  );
}

function MediaGrid({ media }: { media: TaskMedia[] }) {
  if (media.length === 0) return null;

  return (
    <div className={`mt-5 grid gap-3 ${media.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {media.map((item) => (
        <MediaItem key={item.id} item={item} single={media.length === 1} />
      ))}
    </div>
  );
}

function TimerPanel({ task }: { task: Task }) {
  const elapsed = useElapsedSeconds(task.startedAt, task.finishedAt);

  let timerText = "—";
  let caption = "Задание не запускалось";

  if (task.status === "opened") {
    timerText = formatDuration(0);
    caption = "Отсчёт начнётся после старта";
  } else if (elapsed !== null) {
    timerText = formatDuration(elapsed);
    caption = task.finishedAt ? "Время зафиксировано" : "Идёт отсчёт";
  }

  return (
    <aside className="order-first rounded-[18px] border-2 border-secondary bg-white p-5 xl:order-none xl:sticky xl:top-16 xl:self-start">
      <h2 className="text-[1rem] font-bold uppercase leading-tight text-ink">
        Время выполнения задания
      </h2>

      <p
        className="mt-3 text-[2.25rem] font-bold leading-none tabular-nums text-ink"
        aria-live="off"
      >
        {timerText}
      </p>
      <p className="mt-2 text-[0.875rem] text-ink/60">{caption}</p>

      <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-[0.9375rem] text-ink/70">
        <div className="flex justify-between gap-3">
          <dt>Баллы</dt>
          <dd className="font-bold text-ink">{task.points}</dd>
        </div>
      </dl>
    </aside>
  );
}

function BackLink() {
  return (
    <Link
      href="/profile/tasks"
      className="inline-flex text-[1rem] font-bold uppercase text-ink underline-offset-4 hover:underline"
    >
      ← К заданиям
    </Link>
  );
}

function TaskView({ task, moduleName }: { task: Task; moduleName: string }) {
  const start = useTasksStore((state) => state.start);
  const submitAnswer = useTasksStore((state) => state.submitAnswer);
  const skip = useTasksStore((state) => state.skip);

  const answerId = useId();
  // Пересоздаются при смене задания: TaskDetailPage монтирует TaskView с key={task.id}.
  const [answers, setAnswers] = useState<string[]>(() => task.questions.map(() => ""));
  const [fieldErrors, setFieldErrors] = useState<(string | null)[]>(() =>
    task.questions.map(() => null),
  );
  // Для вопросов с questionType "file": имя выбранного файла (для подписи)
  // и флаг "идёт загрузка" — answers[index] заполняется только по её итогу.
  const [fileNames, setFileNames] = useState<(string | null)[]>(() =>
    task.questions.map(() => null),
  );
  const [uploading, setUploading] = useState<boolean[]>(() => task.questions.map(() => false));
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

  const { status } = task;
  const anyUploading = uploading.some(Boolean);
  const busy = pending !== null || anyUploading;

  async function handleFileChange(index: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setFileNames((current) => current.map((item, i) => (i === index ? file.name : item)));
    setFieldErrors((current) => current.map((item, i) => (i === index ? null : item)));
    setUploading((current) => current.map((item, i) => (i === index ? true : item)));
    try {
      const fileId = await filesApi.upload(file);
      const link = fileDownloadUrl(fileId);
      setAnswers((current) => current.map((item, i) => (i === index ? link : item)));
    } catch (err) {
      setFieldErrors((current) => current.map((item, i) => (i === index ? toErrorMessage(err) : item)));
    } finally {
      setUploading((current) => current.map((item, i) => (i === index ? false : item)));
    }
  }
  const showAssignment =
    status === "started" || status === "review" || status === "completed" || status === "failed";
  const canSkip = status === "opened" || status === "started" || status === "failed";
  const isFinal = status === "completed" || status === "skipped" || status === "failed" || status === "review";

  async function run(action: PendingAction, fn: () => Promise<void>) {
    setPending(action);
    setActionError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось выполнить действие");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = task.questions.map((question, index) =>
      validateAnswer(answers[index] ?? "", question),
    );
    setFieldErrors(errors);
    if (errors.some((error) => error !== null)) return;

    await run("submit", () =>
      submitAnswer(
        task.id,
        answers.map((value) => value.trim()),
      ),
    );
  }

  async function handleSkipConfirm() {
    const ok = await run("skip", () => skip(task.id));
    if (ok) setSkipConfirmOpen(false);
  }

  return (
    <>
      <nav aria-label="Навигация по заданию" className="text-[0.9375rem] text-ink/60">
        <Link href="/profile/tasks" className="underline-offset-4 hover:underline">
          {moduleName}
        </Link>
        <span aria-hidden="true" className="px-2">
          ›
        </span>
        <span aria-current="page" className="text-ink">
          Задание {formatTaskNumber(task.id)}
        </span>
      </nav>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <article className={cardClass}>
          <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <h1 className="min-w-0 text-[1.375rem] font-bold uppercase text-ink sm:text-h3">
              {task.title}
            </h1>
            <TaskStatusBadge status={status} />
          </header>

          {/* description и assignment — один и тот же текст с бэка (desc):
              teaser до старта и он же после. Показываем только одну копию —
              либо тизер здесь, либо тот же текст ниже в блоке «Задание». */}
          {!showAssignment ? (
            <p className="mt-4 text-[1.0625rem] leading-7 text-ink/75">{task.description}</p>
          ) : null}

          {showAssignment ? (
            <section aria-labelledby={`${answerId}-assignment`} className="mt-8 border-t border-ink/10 pt-6">
              <h2
                id={`${answerId}-assignment`}
                className="text-[1.25rem] font-bold uppercase text-ink sm:text-[1.375rem]"
              >
                Задание
              </h2>
              <p className="mt-3 text-[1.0625rem] leading-7 text-ink/75">{task.assignment}</p>

              <MediaGrid media={task.media} />

              {/* Попытки не ограничены: бэкенд принимает answer() и из FAILED
                  (см. Task.answer в backend/src/tasks/domain/entities.py) —
                  просто повторно показываем форму вместо тупика. */}
              {status === "started" || status === "failed" ? (
                <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
                  {task.questions.map((question, index) => {
                    const fieldId = `${answerId}-${index}`;
                    const error = fieldErrors[index];

                    return (
                      <div key={fieldId} className="flex flex-col gap-2">
                        <label htmlFor={fieldId} className="text-[0.9375rem] font-bold text-ink">
                          {question.text}
                        </label>

                        {question.questionType === "file" ? (
                          <>
                            <input
                              id={fieldId}
                              type="file"
                              accept={
                                question.supportedExt.length
                                  ? question.supportedExt.map((ext) => `.${ext}`).join(",")
                                  : undefined
                              }
                              disabled={busy}
                              aria-invalid={error ? true : undefined}
                              aria-describedby={error ? `${fieldId}-error` : undefined}
                              onChange={(event) => handleFileChange(index, event.target.files)}
                              className="max-w-[440px] text-[0.9375rem] text-ink/75 file:mr-4 file:h-11 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-5 file:font-hand file:text-[1rem] file:uppercase file:text-white disabled:opacity-60"
                            />
                            <p className="text-[0.8125rem] text-ink/55">
                              {uploading[index]
                                ? "Загружаем…"
                                : answers[index]
                                  ? `Загружено: ${fileNames[index] ?? "файл"}`
                                  : question.supportedExt.length
                                    ? `Форматы: ${question.supportedExt.join(", ")}`
                                    : null}
                            </p>
                          </>
                        ) : (
                          <input
                            id={fieldId}
                            type="text"
                            autoComplete="off"
                            value={answers[index] ?? ""}
                            disabled={busy}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `${fieldId}-error` : undefined}
                            onChange={(event) => {
                              const { value } = event.target;
                              setAnswers((current) =>
                                current.map((item, i) => (i === index ? value : item)),
                              );
                              if (error) {
                                setFieldErrors((current) =>
                                  current.map((item, i) => (i === index ? null : item)),
                                );
                              }
                            }}
                            className={`h-12 w-full max-w-[440px] rounded-full bg-mist px-5 text-[1.0625rem] font-medium text-ink outline-none ring-2 transition-shadow placeholder:text-ink/40 focus-visible:ring-secondary disabled:opacity-60 ${
                              error ? "ring-error" : "ring-transparent"
                            }`}
                          />
                        )}

                        {error ? (
                          <p id={`${fieldId}-error`} role="alert" className="text-[0.875rem] text-error">
                            {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={busy} className={primaryButtonClass}>
                      {pending === "submit" ? "Отправляем…" : "Отправить"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setSkipConfirmOpen(true)}
                      className={secondaryButtonClass}
                    >
                      Пропустить
                    </button>
                  </div>
                </form>
              ) : null}
            </section>
          ) : null}

          {status === "opened" ? (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-ink/10 pt-6">
              <button
                type="button"
                disabled={busy}
                onClick={() => run("start", () => start(task.id))}
                className={primaryButtonClass}
              >
                {pending === "start" ? "Запускаем…" : "Начать"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSkipConfirmOpen(true)}
                className={secondaryButtonClass}
              >
                Пропустить
              </button>
            </div>
          ) : null}

          {status === "review" ? (
            <div className="mt-6">
              <Notice tone="info">
                Ваш ответ отправлен и находится на проверке. Результат появится здесь после
                проверки модератором.
              </Notice>
            </div>
          ) : null}

          {status === "failed" ? (
            <div className="mt-6">
              <Notice tone="error">
                Ответ не принят — баллы за это задание не начислены. Можете попробовать ещё раз.
              </Notice>
            </div>
          ) : null}

          {status === "skipped" ? (
            <div className="mt-6">
              <Notice tone="info">Вы пропустили это задание — баллы за него не начисляются.</Notice>
            </div>
          ) : null}

          {status === "completed" ? (
            <div className="mt-6 flex flex-col gap-5">
              <Notice tone="success">Задание выполнено! Начислено баллов: {task.points}.</Notice>

              {task.explanation ? (
                <section aria-labelledby={`${answerId}-explanation`}>
                  <h2
                    id={`${answerId}-explanation`}
                    className="text-[1.0625rem] font-bold uppercase text-ink"
                  >
                    Пояснение
                  </h2>
                  <p className="mt-2 text-[1.0625rem] leading-7 text-ink/75">{task.explanation}</p>
                </section>
              ) : null}
            </div>
          ) : null}

          {actionError ? (
            <div className="mt-4">
              <Notice tone="error">{actionError}</Notice>
            </div>
          ) : null}

          {isFinal ? (
            <div className="mt-6 border-t border-ink/10 pt-5">
              <BackLink />
            </div>
          ) : null}
        </article>

        <TimerPanel task={task} />
      </div>

      {canSkip ? (
        <Modal
          open={skipConfirmOpen}
          onClose={() => {
            if (!busy) setSkipConfirmOpen(false);
          }}
          title="Пропустить задание?"
        >
          <p className="mt-4 text-[1rem] leading-6 text-ink/75">
            Если вы пропустите задание, то не получите за него баллов. Отменить пропуск будет
            нельзя.
          </p>

          {actionError ? (
            <p role="alert" className="mt-3 text-[0.875rem] text-error">
              {actionError}
            </p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={handleSkipConfirm}
              className={`${primaryButtonClass} flex-1 px-4`}
            >
              {pending === "skip" ? "Пропускаем…" : "Пропустить"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setSkipConfirmOpen(false)}
              className={`${secondaryButtonClass} flex-1 px-4`}
            >
              Отмена
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function StateCard({ children, tone = "text-ink/70" }: { children: ReactNode; tone?: string }) {
  return (
    <div className={cardClass}>
      <div className={`flex flex-col items-start gap-4 text-[1rem] ${tone}`}>{children}</div>
    </div>
  );
}

export function TaskDetailPage({ taskId }: { taskId: number }) {
  const modules = useTasksStore((state) => state.modules);
  const sections = useTasksStore((state) => state.sections);
  const tasks = useTasksStore((state) => state.tasks);
  const status = useTasksStore((state) => state.status);
  const error = useTasksStore((state) => state.error);
  const fetchTasks = useTasksStore((state) => state.fetch);
  const now = useNow();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (status === "idle" || status === "loading") {
    return (
      <StateCard>
        <p>Загружаем задание…</p>
      </StateCard>
    );
  }

  if (status === "error") {
    return (
      <StateCard tone="text-error">
        <p role="alert">{error ?? "Не удалось загрузить задание"}</p>
        <BackLink />
      </StateCard>
    );
  }

  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return (
      <StateCard>
        <p>Такого задания нет.</p>
        <BackLink />
      </StateCard>
    );
  }

  const section = sections.find((item) => item.id === task.sectionId);
  const parentModule = modules.find((item) => item.id === section?.moduleId);

  // Модули открываются постепенно: ссылку на задание ещё не открытого модуля не показываем.
  if (parentModule && !isModuleOpen(parentModule, now)) {
    return (
      <StateCard>
        <h1 className="text-[1.375rem] font-bold uppercase text-ink sm:text-h3">
          {parentModule.name}
        </h1>
        <p>Модуль откроется {formatOpenAt(parentModule.openAt)} — тогда станут доступны его задания.</p>
        <BackLink />
      </StateCard>
    );
  }

  if (task.status === "closed") {
    return (
      <StateCard>
        <h1 className="text-[1.375rem] font-bold uppercase text-ink sm:text-h3">{task.title}</h1>
        <p>Это задание пока закрыто — оно откроется, когда вы завершите предыдущее.</p>
        <BackLink />
      </StateCard>
    );
  }

  return <TaskView key={task.id} task={task} moduleName={parentModule?.name ?? "Задания"} />;
}
