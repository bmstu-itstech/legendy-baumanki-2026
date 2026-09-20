// Модели данных — соответствуют lb26.openapi.json (v0.1.0).
// Поля переведены в camelCase, camel<->snake маппинг живёт в lib/api/*.

export type AuthenticatedUser = {
  id: number;
  isSuperuser: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  /** Берутся из localStorage (см. lib/utm.ts), куда попадают из query-параметров при первом заходе на сайт. */
  utmSource?: string | null;
  utmCampaign?: string | null;
};

/** GET /profiles/me — единственный эндпоинт, который отдаёт email. */
export type MyProfile = {
  userId: number;
  email: string;
  fullName: string;
  group: string;
  telegram: string;
  /** Код команды, к которой присоединился профиль при регистрации (если был). */
  teamCode: string | null;
};

export type CreateProfilePayload = {
  userId: number;
  fullName: string;
  group: string;
  telegram: string;
  /** team_code из ссылки-приглашения — бэкенд сам присоединит к команде. */
  teamCode?: string | null;
};

export type UpdateProfilePayload = {
  userId: number;
  fullName: string;
  group: string;
  telegram: string;
};

/** Профиль участника команды — без email (его отдаёт только /profiles/me). */
export type TeamMember = {
  userId: number;
  fullName: string;
  group: string;
  telegram: string;
  teamId: number;
};

export type Team = {
  id: number;
  publicCode: string;
  name: string;
  members: TeamMember[];
  leader: TeamMember;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeamPayload = {
  name: string;
};

export type UpdateTeamPayload = {
  name: string;
};

export type CreatedTeam = {
  teamId: number;
  publicCode: string;
};

// ---------------------------------------------------------------------------
// Задания и рейтинг — драфт моделей по ТЗ с доски. Бэкенда и записи в
// lb26.openapi.json под них пока нет, на фронте временно ездим на моках
// (см. lib/mocks/tasks.ts). Поля и статусы — предварительные, уточнить при
// появлении реального API.
// ---------------------------------------------------------------------------

export type TaskFormat = "offline" | "online";

/**
 * Статус задания для команды. Переходы (по мокапу с доски):
 * closed -> opened (авто, когда закрыто предыдущее)
 * opened -> skipped | started
 * started -> skipped | moderation (ручная проверка) | completed (авто-проверка)
 * moderation -> completed | failed
 */
export type TaskStatus =
  | "closed"
  | "opened"
  | "started"
  | "moderation"
  | "completed"
  | "skipped"
  | "failed";

export type TaskCheckType = "auto" | "manual";

export type Module = {
  id: number;
  name: string;
  order: number;
  sectionsCount: number;
};

export type TaskSection = {
  id: number;
  moduleId: number;
  order: number;
  title: string;
  tasksCount: number;
};

export type TaskMediaType = "image" | "video" | "audio";

export type TaskMedia = {
  id: number;
  type: TaskMediaType;
  url: string;
  /** Подпись / alt-текст. */
  caption: string | null;
};

export type Task = {
  id: number;
  sectionId: number;
  /** Номер задания в кружочке на карте раздела. */
  index: number;
  title: string;
  /** Общее описание — видно, пока задание не начато. */
  description: string;
  /** Текст самого задания (блок «Задание») — показываем после старта. */
  assignment: string;
  /** Фото / видео / аудио к заданию, от 0 до 4 штук. */
  media: TaskMedia[];
  /** Подпись над полем ответа. */
  answerLabel: string;
  /**
   * Регулярка от бэка для проверки формата ответа на клиенте (если задана).
   * Трактуется как полное совпадение — как атрибут `pattern` у input.
   */
  answerPattern: string | null;
  /**
   * Текст-пояснение. Открывается только после успешного выполнения —
   * настоящий бэкенд не должен отдавать его раньше.
   */
  explanation: string | null;
  checkType: TaskCheckType;
  timeLimitSec: number | null;
  points: number;
  status: TaskStatus;
  startedAt: string | null;
  /** Когда команда закончила (отправила ответ / получила результат) — замораживает таймер. */
  finishedAt: string | null;
};

export type RatingTaskScore = {
  taskId: number;
  points: number;
  timeSec: number | null;
};

export type RatingRow = {
  place: number;
  teamId: number;
  teamName: string;
  tasks: RatingTaskScore[];
  totalPoints: number;
  totalTimeSec: number;
};

/** Один из нескольких рейтингов, между которыми можно переключаться (см. стикер на доске). */
export type RatingBoard = {
  id: string;
  title: string;
  rows: RatingRow[];
};
