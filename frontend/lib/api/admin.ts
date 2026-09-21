import { apiFetch } from "./client";

export type AdminQuestionType = "text" | "file";
export type AdminMediaType = "file" | "image" | "video" | "audio";

export type AdminModule = {
  id: number;
  title: string;
  openAt: string;
};

export type AdminModuleInput = {
  title: string;
  openAt: string;
};

export type AdminSection = {
  moduleId: number;
  number: number;
  title: string;
};

export type AdminQuestion = {
  number: number;
  text: string;
  questionType: AdminQuestionType;
  regex: string | null;
  supportedExt: string[];
  /** Эталонные варианты ответа — видны только организаторам. */
  answers: string[];
};

export type AdminQuestionInput = {
  text: string;
  questionType: AdminQuestionType;
  regex: string | null;
  supportedExt: string[];
  answers: string[];
};

export type AdminMedia = {
  number: number;
  mediaType: AdminMediaType;
  fileId: number;
};

export type AdminMediaInput = {
  mediaType: AdminMediaType;
  fileId: number;
};

export type AdminTask = {
  id: number;
  moduleId: number;
  number: number;
  /** null — побочное (auxiliary) задание, не входит ни в одну секцию. */
  sectionNumber: number | null;
  title: string;
  desc: string;
  explanation: string;
  maxScore: number;
  manualReview: boolean;
  requireTaskId: number | null;
  questions: AdminQuestion[];
  media: AdminMedia[];
};

export type AdminTaskInput = {
  moduleId: number;
  sectionNumber: number | null;
  title: string;
  desc: string;
  explanation: string;
  maxScore: number;
  manualReview: boolean;
  requireTaskId: number | null;
  questions: AdminQuestionInput[];
  media: AdminMediaInput[];
};

export type AdminModuleContent = {
  module: AdminModule;
  sections: AdminSection[];
  tasks: AdminTask[];
};

export type AdminReviewAnswer = {
  questionNumber: number;
  questionText: string;
  text: string;
};

export type AdminReviewItem = {
  teamId: number;
  teamName: string;
  taskId: number;
  taskTitle: string;
  moduleTitle: string;
  startedAt: string | null;
  answers: AdminReviewAnswer[];
};

type ModuleDto = { id: number; title: string; open_at: string };
type SectionDto = { module_id: number; number: number; title: string };

type QuestionDto = {
  number: number;
  text: string;
  question_type: AdminQuestionType;
  regex: string | null;
  supported_ext: string[];
  answers: string[];
};

type MediaDto = { number: number; media_type: AdminMediaType; file_id: number };

type TaskDto = {
  id: number;
  module_id: number;
  number: number;
  section_number: number | null;
  title: string;
  desc: string;
  explanation: string;
  max_score: number;
  manual_review: boolean;
  require_task_id: number | null;
  questions: QuestionDto[];
  media: MediaDto[];
};

type ModuleContentDto = { module: ModuleDto; sections: SectionDto[]; tasks: TaskDto[] };

type ReviewAnswerDto = { question_number: number; question_text: string; text: string };

type ReviewItemDto = {
  team_id: number;
  team_name: string;
  task_id: number;
  task_title: string;
  module_title: string;
  started_at: string | null;
  answers: ReviewAnswerDto[];
};

function moduleFromDto(dto: ModuleDto): AdminModule {
  return { id: dto.id, title: dto.title, openAt: dto.open_at };
}

function moduleToDto(input: AdminModuleInput) {
  return { title: input.title, open_at: input.openAt };
}

function sectionFromDto(dto: SectionDto): AdminSection {
  return { moduleId: dto.module_id, number: dto.number, title: dto.title };
}

function questionFromDto(dto: QuestionDto): AdminQuestion {
  return {
    number: dto.number,
    text: dto.text,
    questionType: dto.question_type,
    regex: dto.regex,
    supportedExt: dto.supported_ext,
    answers: dto.answers,
  };
}

function questionToDto(input: AdminQuestionInput) {
  return {
    text: input.text,
    question_type: input.questionType,
    regex: input.regex,
    supported_ext: input.supportedExt,
    answers: input.answers,
  };
}

function mediaFromDto(dto: MediaDto): AdminMedia {
  return { number: dto.number, mediaType: dto.media_type, fileId: dto.file_id };
}

function mediaToDto(input: AdminMediaInput) {
  return { media_type: input.mediaType, file_id: input.fileId };
}

function taskFromDto(dto: TaskDto): AdminTask {
  return {
    id: dto.id,
    moduleId: dto.module_id,
    number: dto.number,
    sectionNumber: dto.section_number,
    title: dto.title,
    desc: dto.desc,
    explanation: dto.explanation,
    maxScore: dto.max_score,
    manualReview: dto.manual_review,
    requireTaskId: dto.require_task_id,
    questions: dto.questions.map(questionFromDto),
    media: dto.media.map(mediaFromDto),
  };
}

function taskToDto(input: AdminTaskInput) {
  return {
    module_id: input.moduleId,
    section_number: input.sectionNumber,
    title: input.title,
    desc: input.desc,
    explanation: input.explanation,
    max_score: input.maxScore,
    manual_review: input.manualReview,
    require_task_id: input.requireTaskId,
    questions: input.questions.map(questionToDto),
    media: input.media.map(mediaToDto),
  };
}

function reviewFromDto(dto: ReviewItemDto): AdminReviewItem {
  return {
    teamId: dto.team_id,
    teamName: dto.team_name,
    taskId: dto.task_id,
    taskTitle: dto.task_title,
    moduleTitle: dto.module_title,
    startedAt: dto.started_at,
    answers: dto.answers.map((a) => ({
      questionNumber: a.question_number,
      questionText: a.question_text,
      text: a.text,
    })),
  };
}

const BASE = "/admin/content";

export const adminApi = {
  listModules: () =>
    apiFetch<{ modules: ModuleDto[] }>(`${BASE}/modules`).then((dto) =>
      dto.modules.map(moduleFromDto),
    ),

  createModule: (input: AdminModuleInput) =>
    apiFetch<ModuleDto>(`${BASE}/modules`, {
      method: "POST",
      body: JSON.stringify(moduleToDto(input)),
    }).then(moduleFromDto),

  updateModule: (id: number, input: AdminModuleInput) =>
    apiFetch<ModuleDto>(`${BASE}/modules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(moduleToDto(input)),
    }).then(moduleFromDto),

  deleteModule: (id: number) => apiFetch<void>(`${BASE}/modules/${id}`, { method: "DELETE" }),

  getModuleContent: (id: number) =>
    apiFetch<ModuleContentDto>(`${BASE}/modules/${id}`).then(
      (dto): AdminModuleContent => ({
        module: moduleFromDto(dto.module),
        sections: dto.sections.map(sectionFromDto),
        tasks: dto.tasks.map(taskFromDto),
      }),
    ),

  createSection: (moduleId: number, title: string) =>
    apiFetch<SectionDto>(`${BASE}/modules/${moduleId}/sections`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }).then(sectionFromDto),

  updateSection: (moduleId: number, number: number, title: string) =>
    apiFetch<SectionDto>(`${BASE}/modules/${moduleId}/sections/${number}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }).then(sectionFromDto),

  deleteSection: (moduleId: number, number: number) =>
    apiFetch<void>(`${BASE}/modules/${moduleId}/sections/${number}`, { method: "DELETE" }),

  getTask: (id: number) => apiFetch<TaskDto>(`${BASE}/tasks/${id}`).then(taskFromDto),

  createTask: (input: AdminTaskInput) =>
    apiFetch<TaskDto>(`${BASE}/tasks`, {
      method: "POST",
      body: JSON.stringify(taskToDto(input)),
    }).then(taskFromDto),

  updateTask: (id: number, input: AdminTaskInput) =>
    apiFetch<TaskDto>(`${BASE}/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(taskToDto(input)),
    }).then(taskFromDto),

  deleteTask: (id: number) => apiFetch<void>(`${BASE}/tasks/${id}`, { method: "DELETE" }),

  listReviews: () =>
    apiFetch<{ items: ReviewItemDto[] }>(`${BASE}/reviews`).then((dto) =>
      dto.items.map(reviewFromDto),
    ),

  resolveReview: (teamId: number, taskId: number, approve: boolean) =>
    apiFetch<unknown>(`${BASE}/reviews/${teamId}/${taskId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ approve }),
    }),
};
