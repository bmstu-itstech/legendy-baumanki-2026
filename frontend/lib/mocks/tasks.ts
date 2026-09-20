// Temporary mock data for "Tasks" and "Rating" until the backend exposes real endpoints.

import type {
  Module,
  RatingBoard,
  RatingRow,
  Task,
  TaskMedia,
  TaskSection,
  TaskStatus,
} from "@/lib/types";

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

const MOCK_TEAM_NAMES = [
  "Команда Организаторы",
  "Легенды 2.0",
  "Бауманский десант",
  "Сопромат и точка",
  "Ночные инженеры",
  "Кафедра приключений",
  "Пятый угол",
  "Второй корпус",
];

/** Детерминированный «шум» 0..1 (FNV-1a) — моки не должны меняться от рендера к рендеру. */
function noise(...seeds: number[]) {
  let hash = 2_166_136_261;

  for (const seed of seeds) {
    hash = Math.imul(hash ^ seed, 16_777_619);
    hash = (hash ^ (hash >>> 13)) >>> 0;
  }

  return ((hash ^ (hash >>> 16)) >>> 0) / 4_294_967_296;
}

function buildBoard(section: TaskSection): RatingBoard {
  const parentModule = MOCK_MODULES.find((item) => item.id === section.moduleId);
  const tasks = MOCK_TASKS.filter((task) => task.sectionId === section.id);

  const rows: RatingRow[] = MOCK_TEAM_NAMES.map((teamName, teamIndex) => {
    // Чем ниже команда в списке, тем реже она закрывает задания и тем дольше идёт.
    const skill = 0.95 - teamIndex * 0.09;

    const scores = tasks.map((task) => {
      const roll = noise(section.id, teamIndex, task.id);

      if (roll > skill) {
        return { taskId: task.id, points: 0, timeSec: null };
      }

      return {
        taskId: task.id,
        points: task.points,
        timeSec: 120 + Math.round(roll * 600) + teamIndex * 45,
      };
    });

    return {
      place: 0,
      teamId: teamIndex + 1,
      teamName,
      tasks: scores,
      totalPoints: scores.reduce((sum, score) => sum + score.points, 0),
      totalTimeSec: scores.reduce((sum, score) => sum + (score.timeSec ?? 0), 0),
    };
  });

  // Ранжирование: сначала сумма баллов, при равенстве — суммарное время.
  rows.sort((a, b) => b.totalPoints - a.totalPoints || a.totalTimeSec - b.totalTimeSec);
  rows.forEach((row, index) => {
    row.place = index + 1;
  });

  return {
    id: `section-${section.id}`,
    moduleId: section.moduleId,
    moduleName: parentModule?.name ?? `Модуль ${section.moduleId}`,
    sectionId: section.id,
    sectionTitle: section.title,
    columns: tasks.map((task) => ({
      taskId: task.id,
      index: task.index,
      title: task.title,
      maxPoints: task.points,
    })),
    rows,
  };
}

/** По рейтингу на каждый раздел: 4 модуля × очный / дистанционный. */
export const MOCK_RATING_BOARDS: RatingBoard[] = MOCK_SECTIONS.map(buildBoard);
