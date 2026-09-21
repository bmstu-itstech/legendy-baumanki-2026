from src.core.domain.exceptions.exceptions import NotAuthenticated, PermissionDenied
from src.files.domain.interfaces.file_storage import IFileStorage
from src.files.domain.interfaces.file_uow import IFileUnitOfWork
from src.files.domain.interfaces.task_media_checker import ITaskMediaChecker
from src.files.domain.interfaces.team_provider import ITeamProvider
from starlette.responses import FileResponse

# Инлайн-рендер (без Content-Disposition) разрешён только для типов, которые
# реально нужно показывать в <img>/<video>/<audio> (components/tasks/task-detail-page.tsx).
# Content-Type задаёт загрузивший файл и ему нельзя доверять: отдав text/html
# с <script> инлайном, можно было бы выполнить произвольный JS в origin API.
# Явный перечень, а не префикс "image/" — иначе image/svg+xml тоже прошёл бы,
# а SVG браузер выполняет как документ (со своим <script>) при прямом переходе
# по ссылке, что и есть XSS.
_INLINE_SAFE_CONTENT_TYPES = frozenset(
    {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "audio/mpeg",
        "audio/ogg",
        "audio/wav",
    }
)


async def get_file(
    file_id: int,
    requested_by: int | None,
    is_superuser: bool,
    uow: IFileUnitOfWork,
    storage: IFileStorage,
    team_provider: ITeamProvider,
    task_media_checker: ITaskMediaChecker,
) -> FileResponse:
    if requested_by is None:
        raise NotAuthenticated()

    async with uow:
        file = await uow.files.get_by_id(file_id)

    # Прикреплённые к заданию медиа (иллюстрации/фото/видео условия) — часть
    # публичного контента задания, их видят все команды. Всё остальное
    # (например, будущие файловые ответы команд) — только суперюзер и
    # члены команды, загрузившей файл. Без этого любой самозарегистрированный
    # аккаунт с валидным токеном мог бы перебором id скачивать чужие файлы.
    if (
        not is_superuser
        and file.uploaded_by != requested_by
        and not await task_media_checker.is_task_media(file_id)
    ):
        requester_team = await team_provider.get_team_id(requested_by)
        uploader_team = await team_provider.get_team_id(file.uploaded_by)
        if requester_team is None or requester_team != uploader_team:
            raise PermissionDenied()

    is_inline_safe = file.content_type in _INLINE_SAFE_CONTENT_TYPES
    return FileResponse(
        path=storage.path_for(file.storage_key),
        media_type=file.content_type,
        filename=None if is_inline_safe else file.filename,
    )
