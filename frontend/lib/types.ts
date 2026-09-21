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
// Задания и рейтинг — модели поверх модулей tasks/ratings бэкенда (см.
// lb26.openapi.json). Сборка модулей/секций/заданий в плоские списки с
// синтетическими id секций происходит в lib/api/tasks.ts, маппинг рейтинга —
// в lib/api/rating.ts.
// ---------------------------------------------------------------------------

/**
 * Статус задания для команды. Переходы:
 * closed -> opened (авто, когда открылся модуль и/или выполнено требуемое задание)
 * opened -> skipped | started
 * started -> skipped | review (ручная проверка) | completed | failed (авто-проверка)
 * review -> completed | failed
 */
export type TaskStatus =
  | "closed"
  | "opened"
  | "started"
  | "review"
  | "completed"
  | "skipped"
  | "failed";

/**
 * main — основное задание на «змейке» модуля; side — побочное (вспомогательное):
 * на карте рисуется звездой в изгибе змейки, а в рейтинге идёт отдельным зачётом.
 * В API побочные задания приходят отдельным списком `auxiliary_tasks` модуля.
 */
export type TaskKind = "main" | "side";

export type Module = {
  id: number;
  name: string;
  order: number;
  /** ISO-дата открытия (`open_at` в API). Модули открываются постепенно: до этой даты задания недоступны. */
  openAt: string;
};

export type TaskSection = {
  id: number;
  moduleId: number;
  order: number;
  title: string;
};

export type TaskMediaType = "image" | "video" | "audio";

export type TaskMedia = {
  id: number;
  type: TaskMediaType;
  url: string;
  /** Подпись / alt-текст. Бэкенд подписи не отдаёт. */
  caption: string | null;
};

/** Один вопрос задания — у большинства заданий он единственный. */
export type TaskQuestion = {
  text: string;
  /**
   * Регулярка от бэка для проверки формата ответа на клиенте (если задана).
   * Трактуется как полное совпадение — как атрибут `pattern` у input.
   */
  pattern: string | null;
  /** "file" — вместо текстового поля показываем загрузку файла. */
  questionType: "text" | "file";
  /** Разрешённые расширения для questionType "file", без точки (["jpg", "png"]). */
  supportedExt: string[];
};

export type Task = {
  id: number;
  /** Раздел модуля. Побочные задания привязаны к первому разделу, но на карте живут отдельно. */
  sectionId: number;
  kind: TaskKind;
  /** Номер задания в кружочке на карте раздела (у побочных не показывается). */
  index: number;
  title: string;
  /**
   * Описание задания. У бэкенда один общий текст на teaser (до старта) и
   * сам текст задания (после старта) — поэтому description и assignment совпадают.
   */
  description: string;
  assignment: string;
  /** Фото / видео / аудио к заданию, от 0 до 4 штук. */
  media: TaskMedia[];
  questions: TaskQuestion[];
  /**
   * Текст-пояснение. Бэкенд отдаёт его только при status: "completed" —
   * до этого поле null, чтобы не спойлерить решение через сетевые запросы.
   */
  explanation: string | null;
  /** Баллы за задание: в большинстве случаев 1. */
  points: number;
  status: TaskStatus;
  startedAt: string | null;
  /** Когда команда закончила (отправила ответ / получила результат) — замораживает таймер. */
  finishedAt: string | null;
};

export type RatingTaskScore = {
  taskId: number;
  /** Баллы за задание; 0 — задание не зачтено. */
  points: number;
  /** Время выполнения, null — команда за задание не бралась либо не закрыла его. */
  timeSec: number | null;
};

/** Колонка «Задание N» — общая шапка для всех строк рейтинга. */
export type RatingTaskColumn = {
  taskId: number;
  /** Порядковый номер колонки в рейтинге — подпись «Задание N». */
  index: number;
  /** Полное название — уходит в подсказку над колонкой. */
  title: string;
  maxPoints: number;
};

export type RatingRow = {
  place: number;
  teamId: number;
  teamName: string;
  /** Результаты в том же порядке, что и columns у борды. */
  tasks: RatingTaskScore[];
  totalPoints: number;
  totalTimeSec: number;
};

/**
 * Один рейтинг из пяти: по модулю (Мужество, Воля, Труд, Упорство — очные и
 * дистанционные задания вместе, без деления на форматы) либо особый рейтинг
 * побочных заданий. Между бордами переключает селект на странице.
 */
export type RatingBoard = {
  id: string;
  /** «Мужество» … «Побочные задания» — подпись в селекте и таблице. */
  title: string;
  kind: "module" | "side";
  /** Только для kind: "module". */
  moduleId?: number;
  columns: RatingTaskColumn[];
  /** Уже отсортированы: по сумме баллов, при равенстве — по суммарному времени. */
  rows: RatingRow[];
};
