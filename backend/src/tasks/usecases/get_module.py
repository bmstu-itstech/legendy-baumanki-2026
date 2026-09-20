from src.tasks.domain.dtos import ModuleDetailsDTO
from src.tasks.domain.exceptions import TeamIsNotCompleted, UserIsNotInTeam
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork
from src.tasks.domain.interfaces.team_provider import ITeamProvider


async def get_module(
    module_id: int,
    user_id: int,
    uow: ITaskUnitOfWork,
    team_provider: ITeamProvider,
) -> ModuleDetailsDTO:
    team = await team_provider.get_team_id(user_id)
    if team is None:
        raise UserIsNotInTeam()
    if not team.completed:
        raise TeamIsNotCompleted()
    async with uow:
        module = await uow.tasks.get_by_id(team.id, module_id)
    return ModuleDetailsDTO.from_domain(module)
