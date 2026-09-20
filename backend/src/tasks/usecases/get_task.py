from src.tasks.domain.dtos import TaskDTO
from src.tasks.domain.exceptions import TeamIsNotCompleted, UserIsNotInTeam
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork
from src.tasks.domain.interfaces.team_provider import ITeamProvider


async def get_task(
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
    return TaskDTO.from_domain(task)
