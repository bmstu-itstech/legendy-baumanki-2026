from src.tasks.domain.dtos import TaskDTO
from src.tasks.domain.entities import TaskUpdate
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork


async def resolve_review(
    team_id: int, task_id: int, approved: bool, uow: ITaskUnitOfWork
) -> TaskDTO:
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
