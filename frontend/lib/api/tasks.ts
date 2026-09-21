import { API_BASE_URL } from "@/lib/env";
import type { Module, Task, TaskMedia, TaskMediaType, TaskSection, TaskStatus } from "@/lib/types";

import { apiFetch } from "./client";

type QuestionDto = {
  text: string;
  question_type: "text" | "file";
  regex: string | null;
  supported_ext: string[];
  last_answer: string | null;
};

type MediaDto = {
  file_id: number;
  media_type: "file" | "image" | "video" | "audio";
};

type TaskDto = {
  id: number;
  title: string;
  desc: string;
  explanation: string | null;
  max_score: number;
  score: number | null;
  manual_review: boolean;
  status: TaskStatus;
  started_at: string | null;
  completed_at: string | null;
  questions: QuestionDto[];
  media: MediaDto[];
};

type SectionDto = {
  title: string;
  tasks: TaskDto[];
};

type ModuleDto = {
  id: number;
  title: string;
  open_at: string;
  score: number;
  max_score: number;
};

type ModuleDetailsDto = ModuleDto & {
  sections: SectionDto[];
  auxiliary_tasks: TaskDto[];
};

type ModulesListDto = {
  modules: ModuleDto[];
};

/** Поля задания, которые меняются в ходе его жизненного цикла (start/answer/skip). */
export type TaskProgress = Pick<Task, "status" | "startedAt" | "finishedAt" | "explanation">;

/**
 * Синтетический id секции — у бэкенда секции не имеют собственного id, только
 * порядок внутри модуля. Множитель с запасом на количество секций в модуле.
 */
function sectionId(moduleId: number, sectionIndex: number) {
  return moduleId * 1000 + sectionIndex;
}

// Модуль files ещё не реализован на бэкенде (GET /files/{id} — заглушка),
// но собираем ссылку заранее: заработает без правок фронта, когда появится.
function mediaFromDto(dto: MediaDto, index: number): TaskMedia | null {
  if (dto.media_type === "file" || !API_BASE_URL) return null;
  return {
    id: dto.file_id * 10 + index,
    type: dto.media_type as TaskMediaType,
    url: `${API_BASE_URL}/files/${dto.file_id}`,
    caption: null,
  };
}

function taskFromDto(
  dto: TaskDto,
  { sectionId: sectionIdValue, kind, index }: { sectionId: number; kind: Task["kind"]; index: number },
): Task {
  return {
    id: dto.id,
    sectionId: sectionIdValue,
    kind,
    index,
    title: dto.title,
    // У бэкенда один общий текст задания — до и после старта он один и тот же.
    description: dto.desc,
    assignment: dto.desc,
    media: dto.media
      .map((item, mediaIndex) => mediaFromDto(item, mediaIndex))
      .filter((item): item is TaskMedia => item !== null),
    questions: dto.questions.map((question) => ({
      text: question.text,
      pattern: question.regex,
    })),
    explanation: dto.explanation,
    points: dto.max_score,
    status: dto.status,
    startedAt: dto.started_at,
    finishedAt: dto.completed_at,
  };
}

function progressFromDto(dto: TaskDto): TaskProgress {
  return {
    status: dto.status,
    startedAt: dto.started_at,
    finishedAt: dto.completed_at,
    explanation: dto.explanation,
  };
}

function moduleFromDto(dto: ModuleDto, order: number): Module {
  return {
    id: dto.id,
    name: dto.title,
    order,
    openAt: dto.open_at,
  };
}

/** Разбирает детали модуля в плоские секции + задания для tasks-store. */
function moduleDetailsFromDto(dto: ModuleDetailsDto) {
  const sections: TaskSection[] = dto.sections.map((section, index) => ({
    id: sectionId(dto.id, index + 1),
    moduleId: dto.id,
    order: index + 1,
    title: section.title,
  }));

  const mainTasks = dto.sections.flatMap((section, sIndex) =>
    section.tasks.map((task, tIndex) =>
      taskFromDto(task, { sectionId: sections[sIndex].id, kind: "main", index: tIndex + 1 }),
    ),
  );

  // Побочные задания формально привязываем к первой секции модуля (как и в
  // разметке карты) — если секций нет вовсе, используют синтетический id
  // без записи в sections (группы на карте у них всё равно нет).
  const sideSectionId = sections[0]?.id ?? sectionId(dto.id, 0);
  const sideTasks = dto.auxiliary_tasks.map((task, index) =>
    taskFromDto(task, { sectionId: sideSectionId, kind: "side", index: index + 1 }),
  );

  return { sections, tasks: [...mainTasks, ...sideTasks] };
}

export const tasksApi = {
  getModules: () =>
    apiFetch<ModulesListDto>("/modules/").then((dto) =>
      dto.modules.map((module, index) => moduleFromDto(module, index + 1)),
    ),

  getModuleDetails: (id: number) =>
    apiFetch<ModuleDetailsDto>(`/modules/${id}`).then(moduleDetailsFromDto),

  start: (taskId: number) =>
    apiFetch<TaskDto>(`/tasks/${taskId}/start`, { method: "POST" }).then(progressFromDto),

  answer: (taskId: number, answers: string[]) =>
    apiFetch<TaskDto>(`/tasks/${taskId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }).then(progressFromDto),

  skip: (taskId: number) =>
    apiFetch<TaskDto>(`/tasks/${taskId}/skip`, { method: "PUT" }).then(progressFromDto),
};
