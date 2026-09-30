from src.core.logging import log_usecase
from src.tasks.domain.dtos import TaskDTO
from src.tasks.domain.entities import TaskUpdate
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork


@log_usecase
async def resolve_review(
    actor_id: int, team_id: int, task_id: int, approved: bool, uow: ITaskUnitOfWork
) -> TaskDTO:
    """actor_id — суперюзер, принявший решение; нужен только для аудит-лога
    (@log_usecase), в саму бизнес-логику не участвует."""
    async with uow:
        task = await uow.tasks.get_task_by_id(team_id, task_id)
        task.resolve_review(approved)
        task = await uow.tasks.update_task(
            team_id,
            TaskUpdate(
                task_id=task.id,
                status=task.status,
                score=task.score,
                completed_at=task.completed_at,
            ),
        )
        await uow.commit()
    return TaskDTO.from_domain(task)
