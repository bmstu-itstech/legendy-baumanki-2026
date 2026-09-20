// Temporary mock data for "Tasks" and "Rating" until the backend exposes real endpoints.

import type { Module, RatingBoard, Task, TaskMedia, TaskSection, TaskStatus } from "@/lib/types";

const MODULE_NAMES = ["Мужество", "Воля", "Труд", "Упорство"] as const;
const SECTION_TITLES = ["Очный", "Дистанционный"] as const;
const STATUS_SEQUENCE: TaskStatus[] = [
  "completed",
  "opened",
  "started",
  "moderation",
  "closed",
  "skipped",
  "failed",
  "opened",
  "closed",
];

export const MOCK_MODULES: Module[] = MODULE_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  order: index + 1,
  sectionsCount: SECTION_TITLES.length,
}));

export const MOCK_SECTIONS: TaskSection[] = MOCK_MODULES.flatMap((module) =>
  SECTION_TITLES.map((title, index) => ({
    id: module.id * 10 + index + 1,
    moduleId: module.id,
    order: index + 1,
    title,
    tasksCount: 6 + ((module.id + index) % 4),
  })),
);

const STARTED_STATUSES: TaskStatus[] = ["started", "moderation", "failed", "completed"];
const FINISHED_STATUSES: TaskStatus[] = ["moderation", "failed", "completed"];

function getStartedAt(status: TaskStatus, seed: number) {
  if (!STARTED_STATUSES.includes(status)) {
    return null;
  }

  // Правдоподобные значения: обычно в пределах лимита времени задания.
  const minutesAgo = 2 + (seed % 8);
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function getFinishedAt(status: TaskStatus, startedAt: string | null, seed: number) {
  if (!startedAt || !FINISHED_STATUSES.includes(status)) {
    return null;
  }

  const spentMinutes = 3 + (seed % 9);
  return new Date(new Date(startedAt).getTime() + spentMinutes * 60 * 1000 + 34_000).toISOString();
}

const MOCK_MEDIA_URLS = [
  "/gallery/2mLAIJQBBfOR3zW1k6G0n8aoS6A_WQJPgpa8FlXMBqDrvTLkgsvD7S7HyREWfbS8ZZ4XdgpPn9av1_83z7Kn1SQ-.jpg",
  "/gallery/UW6EfF6VStY2csUKHA0hdYAzFQFGlxUr--rA1c-6xrZ-Owso_jZ2YQgkcfxqQtDQemHlLZwX5ENa_mJ78p8zinki.jpg",
  "/gallery/i2pKYxbQ8d8k95_twL5X9TyP2jiSrADJV_AfwL3SpQ-f9D5j9L2VxUmGbYY0fuMCtdytsYIaP7hNKP4XnrZVXHNd.jpg",
  "/gallery/rZjO36gCCcswL2zK5WOHsZqYmPW8WBdn8g0VqhxpYSSCF9w82idU2n8d1oKNU5rEiaG0S25petG1qP5UgtUSXLRm.jpg",
];

/** Для наглядности у соседних заданий разное число медиа: 0..4. */
function getMockMedia(taskId: number, taskNumber: number): TaskMedia[] {
  return Array.from({ length: taskNumber % 5 }, (_, index) => ({
    id: taskId * 10 + index + 1,
    type: "image" as const,
    url: MOCK_MEDIA_URLS[index % MOCK_MEDIA_URLS.length],
    caption: `Иллюстрация ${index + 1} к заданию`,
  }));
}

export const MOCK_TASKS: Task[] = MOCK_SECTIONS.flatMap((section) =>
  Array.from({ length: section.tasksCount }, (_, index) => {
    const status = STATUS_SEQUENCE[(section.id + index) % STATUS_SEQUENCE.length];
    const taskNumber = index + 1;
    const id = section.id * 100 + taskNumber;
    const startedAt = getStartedAt(status, section.id + taskNumber);

    return {
      id,
      sectionId: section.id,
      index: taskNumber,
      title: `${section.title}: задание ${taskNumber}`,
      description:
        "Выполните задание команды и отправьте результат на проверку. Детальное описание появится здесь после подключения боевого API.",
      assignment:
        "Найдите указанное место на территории университета и введите кодовое слово, которое вы там обнаружите. Подробный текст задания появится здесь после подключения боевого API.",
      media: getMockMedia(id, taskNumber),
      answerLabel: "Кодовое слово",
      answerPattern: taskNumber % 2 === 0 ? "[A-Za-zА-Яа-яЁё0-9-]{3,32}" : null,
      explanation:
        "Именно здесь много лет назад начиналась история этого места. Пояснение к заданию откроется после успешного выполнения.",
      checkType: taskNumber % 2 === 0 ? "auto" : "manual",
      timeLimitSec: taskNumber % 3 === 0 ? 900 : 600,
      points: 5 + taskNumber * 2,
      status,
      startedAt,
      finishedAt: getFinishedAt(status, startedAt, section.id + taskNumber),
    } satisfies Task;
  }),
);

export const MOCK_RATING_BOARDS: RatingBoard[] = [
  {
    id: "overall",
    title: "Общий",
    rows: [
      {
        place: 1,
        teamId: 1,
        teamName: "Команда Организаторы",
        tasks: [
          { taskId: 111, points: 10, timeSec: 934 },
          { taskId: 112, points: 5, timeSec: 61 },
        ],
        totalPoints: 15,
        totalTimeSec: 995,
      },
      {
        place: 2,
        teamId: 2,
        teamName: "Легенды 2.0",
        tasks: [
          { taskId: 111, points: 10, timeSec: 1200 },
          { taskId: 112, points: 0, timeSec: null },
        ],
        totalPoints: 10,
        totalTimeSec: 1200,
      },
    ],
  },
  {
    id: "offline",
    title: "Очный формат",
    rows: [
      {
        place: 1,
        teamId: 2,
        teamName: "Легенды 2.0",
        tasks: [{ taskId: 111, points: 10, timeSec: 1200 }],
        totalPoints: 10,
        totalTimeSec: 1200,
      },
    ],
  },
];
