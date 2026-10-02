from src.final.domain.entities import TeamInfo
from src.final.domain.exceptions import UserIsNotInTeam, UserIsNotTeamLeader
from src.final.domain.interfaces.team_provider import ITeamProvider


async def get_captain_team(user_id: int, team_provider: ITeamProvider) -> TeamInfo:
    """Команда пользователя, если он её капитан — только он записывает команду."""
    team = await team_provider.get_team(user_id)
    if team is None:
        raise UserIsNotInTeam()
    if team.leader_id != user_id:
        raise UserIsNotTeamLeader()
    return team
