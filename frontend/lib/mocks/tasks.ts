// Temporary mock data for "Tasks" and "Rating" until the backend exposes real endpoints.

import type { Module, RatingBoard, Task, TaskSection, TaskStatus } from "@/lib/types";

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

function getStartedAt(status: TaskStatus, seed: number) {
  if (status !== "started" && status !== "moderation" && status !== "failed") {
    return null;
  }

  const minutesAgo = 12 + seed * 7;
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

export const MOCK_TASKS: Task[] = MOCK_SECTIONS.flatMap((section) =>
  Array.from({ length: section.tasksCount }, (_, index) => {
    const status = STATUS_SEQUENCE[(section.id + index) % STATUS_SEQUENCE.length];
    const taskNumber = index + 1;

    return {
      id: section.id * 100 + taskNumber,
      sectionId: section.id,
      index: taskNumber,
      title: `${section.title}: задание ${taskNumber}`,
      description:
        "Выполните задание команды и отправьте результат на проверку. Детальное описание появится здесь после подключения боевого API.",
      imageUrl: null,
      checkType: taskNumber % 2 === 0 ? "auto" : "manual",
      timeLimitSec: taskNumber % 3 === 0 ? 900 : 600,
      points: 5 + taskNumber * 2,
      status,
      startedAt: getStartedAt(status, section.id + taskNumber),
    };
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
