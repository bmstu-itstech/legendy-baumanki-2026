from src.tasks.domain.dtos import TaskDTO
from src.tasks.domain.entities import TaskUpdate
from src.tasks.domain.exceptions import TeamIsNotCompleted, UserIsNotInTeam
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork
from src.tasks.domain.interfaces.team_provider import ITeamProvider


async def start_task(
    task_id: int,
    user_id: int,
    uow: ITaskUnitOfWork,
    team_provider: ITeamProvider,
) -> TaskDTO:
    team = await team_provider.get_team_id(user_id)
    if team is None:
        raise UserIsNotInTeam()
    if not team.completed:
        raise TeamIsNotCompleted()
    async with uow:
        task = await uow.tasks.get_task_by_id(team.id, task_id)
        task.start()
        task = await uow.tasks.update_task(
            team.id,
            TaskUpdate(
                task_id=task.id,
                status=task.status,
                started_at=task.started_at,
            ),
        )
        await uow.commit()
    return TaskDTO.from_domain(task)
