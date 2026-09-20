from src.tasks.domain.dtos import ModuleDTO, ModulesListDTO
from src.tasks.domain.exceptions import TeamIsNotCompleted, UserIsNotInTeam
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork
from src.tasks.domain.interfaces.team_provider import ITeamProvider


async def get_modules(
    user_id: int,
    uow: ITaskUnitOfWork,
    team_provider: ITeamProvider,
) -> ModulesListDTO:
    team = await team_provider.get_team_id(user_id)
    if team is None:
        raise UserIsNotInTeam()
    if not team.completed:
        raise TeamIsNotCompleted()
    async with uow:
        modules = await uow.tasks.get_all(team.id)
    return ModulesListDTO(modules=[ModuleDTO.from_domain(m) for m in modules])
