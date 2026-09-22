"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  adminApi,
  type AdminMediaType,
  type AdminQuestionType,
  type AdminSection,
  type AdminTask,
} from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";
import { filesApi } from "@/lib/api/files";
import { Modal } from "@/components/ui/modal";

import {
  CheckboxField,
  DangerButton,
  Field,
  Notice,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
  panelClass,
} from "./admin-ui";

const QUESTION_TYPES: { value: AdminQuestionType; label: string }[] = [
  { value: "text", label: "Текст" },
  { value: "file", label: "Файл" },
];

const MEDIA_TYPES: { value: AdminMediaType; label: string }[] = [
  { value: "image", label: "Изображение" },
  { value: "video", label: "Видео" },
  { value: "audio", label: "Аудио" },
  { value: "file", label: "Файл" },
];

const MEDIA_ACCEPT: Record<AdminMediaType, string | undefined> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  file: undefined,
};

type QuestionDraft = {
  text: string;
  questionType: AdminQuestionType;
  regex: string;
  /** через запятую, без точки: jpg, png */
  supportedExt: string;
  /** каждый вариант с новой строки */
  answers: string;
};

type MediaDraft = {
  mediaType: AdminMediaType;
  fileId: string;
  /** Локальное имя выбранного файла — только для подписи, на бэк не уходит. */
  fileName?: string;
  uploading?: boolean;
};

function emptyQuestion(): QuestionDraft {
  return { text: "", questionType: "text", regex: "", supportedExt: "", answers: "" };
}

function emptyMedia(): MediaDraft {
  return { mediaType: "image", fileId: "" };
}

function questionsFromTask(task: AdminTask): QuestionDraft[] {
  return task.questions.map((q) => ({
    text: q.text,
    questionType: q.questionType,
    regex: q.regex ?? "",
    supportedExt: q.supportedExt.join(", "),
    answers: q.answers.join("\n"),
  }));
}

function mediaFromTask(task: AdminTask): MediaDraft[] {
  return task.media.map((m) => ({ mediaType: m.mediaType, fileId: String(m.fileId) }));
}

export function TaskEditorForm({
  moduleId,
  sections,
  task,
}: {
  moduleId: number;
  sections: AdminSection[];
  /** Если задан — режим редактирования, иначе создание нового задания. */
  task?: AdminTask;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(task?.title ?? "");
  const [desc, setDesc] = useState(task?.desc ?? "");
  const [explanation, setExplanation] = useState(task?.explanation ?? "");
  const [maxScore, setMaxScore] = useState(String(task?.maxScore ?? 1));
  const [manualReview, setManualReview] = useState(task?.manualReview ?? false);
  const [sectionNumber, setSectionNumber] = useState(
    task?.sectionNumber !== undefined ? String(task.sectionNumber ?? "") : "",
  );
  const [requireTaskId, setRequireTaskId] = useState(
    task?.requireTaskId != null ? String(task.requireTaskId) : "",
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    task ? questionsFromTask(task) : [emptyQuestion()],
  );
  const [media, setMedia] = useState<MediaDraft[]>(task ? mediaFromTask(task) : []);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((current) => current.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateMedia(index: number, patch: Partial<MediaDraft>) {
    setMedia((current) => current.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  async function handleMediaFileChange(index: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    updateMedia(index, { uploading: true, fileName: file.name });
    try {
      const fileId = await filesApi.upload(file);
      updateMedia(index, { fileId: String(fileId) });
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      updateMedia(index, { uploading: false });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const maxScoreNum = Number(maxScore);
    if (!Number.isInteger(maxScoreNum) || maxScoreNum < 0) {
      setError("Баллы должны быть целым неотрицательным числом");
      return;
    }
    if (requireTaskId.trim() && !Number.isInteger(Number(requireTaskId))) {
      setError("ID требуемого задания должен быть числом");
      return;
    }

    setSaving(true);
    try {
      const input = {
        moduleId,
        sectionNumber: sectionNumber === "" ? null : Number(sectionNumber),
        title: title.trim(),
        desc: desc.trim(),
        explanation: explanation.trim(),
        maxScore: maxScoreNum,
        manualReview,
        requireTaskId: requireTaskId.trim() ? Number(requireTaskId) : null,
        questions: questions
          .filter((q) => q.text.trim())
          .map((q) => ({
            text: q.text.trim(),
            questionType: q.questionType,
            regex: q.regex.trim() || null,
            supportedExt: q.supportedExt
              .split(",")
              .map((ext) => ext.trim())
              .filter(Boolean),
            answers: q.answers
              .split("\n")
              .map((a) => a.trim())
              .filter(Boolean),
          })),
        media: media
          .filter((m) => m.fileId.trim())
          .map((m) => ({ mediaType: m.mediaType, fileId: Number(m.fileId) })),
      };

      const saved = task
        ? await adminApi.updateTask(task.id, input)
        : await adminApi.createTask(input);

      router.push(`/admin/modules/${moduleId}`);
      router.refresh();
      void saved;
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;

    setDeleting(true);
    setError(null);
    try {
      await adminApi.deleteTask(task.id);
      router.push(`/admin/modules/${moduleId}`);
      router.refresh();
    } catch (err) {
      setError(toErrorMessage(err));
      setDeleting(false);
    } finally {
      setDeleteConfirmOpen(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className={panelClass}>
        <h1 className="text-[1.25rem] font-bold uppercase text-ink">
          {task ? `Задание №${task.number}` : "Новое задание"}
        </h1>

        <div className="mt-4 flex flex-col gap-4">
          <Field label="Название" htmlFor="task-title">
            <TextInput
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </Field>

          <Field label="Описание задания" htmlFor="task-desc">
            <TextArea
              id="task-desc"
              rows={4}
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              required
            />
          </Field>

          <Field label="Пояснение (открывается после выполнения)" htmlFor="task-explanation">
            <TextArea
              id="task-explanation"
              rows={3}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Баллы" htmlFor="task-max-score">
              <TextInput
                id="task-max-score"
                type="number"
                min={0}
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                required
              />
            </Field>

            <Field label="Секция" htmlFor="task-section">
              <select
                id="task-section"
                value={sectionNumber}
                onChange={(event) => setSectionNumber(event.target.value)}
                className="h-11 w-full rounded-[10px] border-2 border-secondary/25 bg-white px-3.5 text-[0.9375rem] text-ink outline-none focus-visible:border-secondary"
              >
                <option value="">Побочное (без секции)</option>
                {sections.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ID требуемого задания" htmlFor="task-require">
              <TextInput
                id="task-require"
                type="number"
                value={requireTaskId}
                onChange={(event) => setRequireTaskId(event.target.value)}
                disabled={sectionNumber === ""}
                placeholder={
                  sectionNumber === ""
                    ? "у побочных заданий нет требований"
                    : "пусто — сцепится с предыдущим основным"
                }
              />
            </Field>
          </div>

          <CheckboxField
            label="Ручная проверка (ответ уходит модератору, а не проверяется автоматически)"
            checked={manualReview}
            onChange={(event) => setManualReview(event.target.checked)}
          />
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-[1.0625rem] font-bold uppercase text-ink">Вопросы</h2>
          <SecondaryButton onClick={() => setQuestions((current) => [...current, emptyQuestion()])}>
            + Вопрос
          </SecondaryButton>
        </div>

        <div className="mt-4 flex flex-col gap-5">
          {questions.map((q, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[12px] border-2 border-secondary/15 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.8125rem] font-bold uppercase text-ink/60">
                  Вопрос {index + 1}
                </span>
                {questions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setQuestions((current) => current.filter((_, i) => i !== index))}
                    className="text-[0.8125rem] font-bold uppercase text-error hover:underline"
                  >
                    Убрать
                  </button>
                ) : null}
              </div>

              <Field label="Текст вопроса">
                <TextArea
                  rows={2}
                  value={q.text}
                  onChange={(event) => updateQuestion(index, { text: event.target.value })}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Тип ответа">
                  <select
                    value={q.questionType}
                    onChange={(event) =>
                      updateQuestion(index, {
                        questionType: event.target.value as AdminQuestionType,
                      })
                    }
                    className="h-11 w-full rounded-[10px] border-2 border-secondary/25 bg-white px-3.5 text-[0.9375rem] text-ink outline-none focus-visible:border-secondary"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Регулярка формата ответа">
                  <TextInput
                    value={q.regex}
                    onChange={(event) => updateQuestion(index, { regex: event.target.value })}
                    placeholder="необязательно"
                  />
                </Field>
              </div>

              {q.questionType === "file" ? (
                <Field label="Разрешённые расширения файла (через запятую)">
                  <TextInput
                    value={q.supportedExt}
                    onChange={(event) =>
                      updateQuestion(index, { supportedExt: event.target.value })
                    }
                    placeholder="jpg, png, mp4"
                  />
                </Field>
              ) : null}

              <Field label="Правильные варианты ответа (каждый с новой строки, для авто-проверки)">
                <TextArea
                  rows={2}
                  value={q.answers}
                  onChange={(event) => updateQuestion(index, { answers: event.target.value })}
                  disabled={manualReview}
                  placeholder={manualReview ? "При ручной проверке не нужны" : "501ю"}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-[1.0625rem] font-bold uppercase text-ink">Медиа</h2>
          <SecondaryButton onClick={() => setMedia((current) => [...current, emptyMedia()])}>
            + Медиа
          </SecondaryButton>
        </div>

        {media.length === 0 ? <p className="mt-3 text-[0.875rem] text-ink/60">Медиа нет.</p> : null}

        <div className="mt-3 flex flex-col gap-3">
          {media.map((m, index) => (
            <div key={index} className="flex flex-wrap items-start gap-3">
              <div className="w-40">
                <Field label="Тип">
                  <select
                    value={m.mediaType}
                    onChange={(event) =>
                      updateMedia(index, { mediaType: event.target.value as AdminMediaType })
                    }
                    className="h-11 w-full rounded-[10px] border-2 border-secondary/25 bg-white px-3.5 text-[0.9375rem] text-ink outline-none focus-visible:border-secondary"
                  >
                    {MEDIA_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="min-w-[260px] flex-1">
                <Field label="Файл">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept={MEDIA_ACCEPT[m.mediaType]}
                      disabled={m.uploading}
                      onChange={(event) => handleMediaFileChange(index, event.target.files)}
                      className="min-w-0 flex-1 truncate text-[0.9375rem] text-ink/75 file:mr-3 file:h-10 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:font-hand file:text-[0.9375rem] file:uppercase file:text-white disabled:opacity-60"
                    />
                    <TextInput
                      type="number"
                      value={m.fileId}
                      onChange={(event) => updateMedia(index, { fileId: event.target.value })}
                      placeholder="ID файла"
                      className="w-28"
                    />
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] text-ink/55">
                    {m.uploading
                      ? "Загружаем…"
                      : m.fileId
                        ? `ID: ${m.fileId}${m.fileName ? ` (${m.fileName})` : ""}`
                        : "Загрузите файл или укажите ID вручную"}
                  </p>
                </Field>
              </div>
              {/* Field с невидимым лейблом — чтобы кнопка встала вровень со строкой
                  инпутов, а не с подписями "Тип"/"Файл" над ними. */}
              <Field label=" ">
                <button
                  type="button"
                  onClick={() => setMedia((current) => current.filter((_, i) => i !== index))}
                  className="flex h-11 items-center text-[0.8125rem] font-bold uppercase text-error hover:underline"
                >
                  Убрать
                </button>
              </Field>
            </div>
          ))}
        </div>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-wrap gap-3">
        <PrimaryButton type="submit" disabled={saving || media.some((m) => m.uploading)}>
          {saving ? "Сохраняем…" : task ? "Сохранить" : "Создать задание"}
        </PrimaryButton>
        {task ? (
          <DangerButton onClick={() => setDeleteConfirmOpen(true)} disabled={deleting}>
            {deleting ? "Удаляем…" : "Удалить задание"}
          </DangerButton>
        ) : null}
      </div>
    </form>

    {task ? (
      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          if (!deleting) setDeleteConfirmOpen(false);
        }}
        title="Удалить задание?"
      >
        <p className="mt-4 text-[1rem] leading-6 text-ink/75">Отменить будет нельзя.</p>
        <div className="mt-6 flex gap-3">
          <DangerButton disabled={deleting} onClick={handleDelete} className="flex-1">
            {deleting ? "Удаляем…" : "Удалить"}
          </DangerButton>
          <SecondaryButton
            disabled={deleting}
            onClick={() => setDeleteConfirmOpen(false)}
            className="flex-1"
          >
            Отмена
          </SecondaryButton>
        </div>
      </Modal>
    ) : null}
    </>
  );
}
