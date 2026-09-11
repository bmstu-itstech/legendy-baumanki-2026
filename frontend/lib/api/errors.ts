export class ApiError extends Error {
  status: number;
  /** Стабильный код ошибки от бэкенда (AppException.error_code), если есть. */
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Технический текст ошибки (message/detail) — это язык бэкенда: английский,
// иногда с сырыми деталями вроде "Key (email)=(...) already exists." из
// Postgres. Показывать его пользователю в формах нельзя, поэтому здесь
// переводим по стабильному error_code, а не по тексту.
const ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: "Пользователь с такой почтой уже зарегистрирован",
  user_not_found: "Пользователь не найден",
  invalid_credentials: "Неверная почта или пароль",
  email_taken: "Эта почта уже занята",
  auth_required: "Нужно войти в аккаунт",
  authorization_failed: "Недостаточно прав для этого действия",
  invalid_token: "Сессия истекла — войдите снова",
  refresh_token_required: "Сессия истекла — войдите снова",
  refresh_token_not_valid: "Сессия истекла — войдите снова",
  not_authenticated: "Нужно войти в аккаунт",
  profile_not_found: "Профиль не найден",
  profile_already_exists: "Профиль уже создан",
  team_is_full: "В команде уже максимум участников",
  user_already_in_team: "Вы уже состоите в команде",
  user_is_not_in_team: "Вы не состоите ни в одной команде",
  user_is_not_team_leader: "Это может сделать только капитан команды",
  team_not_found: "Команда с таким кодом не найдена",
  not_found: "Не найдено",
  already_exists: "Уже существует",
  bad_request: "Некорректный запрос",
  permission_denied: "Недостаточно прав",
};

// Если error_code неизвестен (или бэкенд его не прислал — например,
// FastAPI-валидация тела запроса), подбираем нейтральный текст по статусу,
// но никогда не показываем сырой detail из ответа.
const STATUS_FALLBACKS: Record<number, string> = {
  400: "Некорректный запрос. Проверьте введённые данные",
  401: "Нужно войти в аккаунт",
  403: "Недостаточно прав для этого действия",
  404: "Не найдено",
  409: "Конфликт данных",
  422: "Проверьте правильность заполнения формы",
};

const GENERIC_ERROR_MESSAGE = "Что-то пошло не так. Попробуйте ещё раз";

export function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code && ERROR_MESSAGES[err.code]) return ERROR_MESSAGES[err.code];
    if (err.status === 0) return "Не удалось связаться с сервером";
    return STATUS_FALLBACKS[err.status] ?? GENERIC_ERROR_MESSAGE;
  }
  // Сетевой сбой (offline, CORS, сервер недоступен) приходит сюда как
  // обычный Error с технической английской message ("Failed to fetch") —
  // её тоже не показываем как есть.
  return GENERIC_ERROR_MESSAGE;
}
