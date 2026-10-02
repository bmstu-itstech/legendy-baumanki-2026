import datetime as dt

import pytest

from src.profile.domain.dtos import ProfileCreateDTO
from src.profile.domain.entities import (
    MAX_TEAM_SIZE,
    Profile,
    ProfileCreate,
    ProfileUpdate,
    Team,
    TeamCreate,
    TeamUpdate,
    TeamWithMembers,
)
from src.profile.domain.exception import TeamIsFull, TeamNotFound
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_repo import IProfileRepository
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork
from src.profile.domain.interfaces.team_repo import ITeamRepository
from src.profile.usecases import create_profile

TEAM_ID = 5
TEAM_CODE = "ABC123"
LEADER_ID = 1
NEW_USER_ID = 2


class FakeProfileRepository(IProfileRepository):
    def __init__(self):
        self.profiles: dict[int, Profile] = {}

    async def create(self, profile: ProfileCreate) -> Profile:
        self.profiles[profile.user_id] = Profile(**profile.model_dump())
        return self.profiles[profile.user_id]

    async def get_by_id(self, user_id: int) -> Profile:
        return self.profiles[user_id]

    async def update(self, profile: ProfileUpdate) -> Profile:
        current = self.profiles[profile.user_id]
        self.profiles[profile.user_id] = current.model_copy(
            update=profile.model_dump(exclude_unset=True)
        )
        return self.profiles[profile.user_id]


class FakeTeamRepository(ITeamRepository):
    """Состав команды, как и в PG-репозитории, берётся из profiles.team_id."""

    def __init__(self, profiles: FakeProfileRepository):
        self.profiles = profiles

    async def get_team_by_code(self, code: str) -> Team:
        if code != TEAM_CODE:
            raise TeamNotFound()
        now = dt.datetime.now(dt.UTC)
        return Team(
            id=TEAM_ID,
            public_code=TEAM_CODE,
            name="team",
            leader_id=LEADER_ID,
            members=[
                p.user_id
                for p in self.profiles.profiles.values()
                if p.team_id == TEAM_ID
            ],
            created_at=now,
            updated_at=now,
        )

    async def update_team(self, team_data: TeamUpdate) -> Team:
        return await self.get_team_by_code(TEAM_CODE)

    async def create_team(self, team_data: TeamCreate) -> Team:
        raise NotImplementedError

    async def get_team_by_id(self, team_id: int) -> Team:
        raise NotImplementedError

    async def get_profile_team_or_none(self, member_id: int) -> TeamWithMembers | None:
        raise NotImplementedError

    async def get_team_with_members(self, team_id: int) -> TeamWithMembers:
        raise NotImplementedError

    async def delete_team(self, team_id: int) -> None:
        raise NotImplementedError


class FakeProfileUoW(IProfileUnitOfWork):
    def __init__(self):
        self.profiles = FakeProfileRepository()
        self.teams = FakeTeamRepository(self.profiles)
        self.committed = False

    async def rollback(self) -> None:
        pass

    async def _commit(self) -> None:
        self.committed = True


class FakeEmailProvider(IEmailProvider):
    async def get_user_email(self, user_id: int) -> str:
        return f"user{user_id}@test.ru"


def add_member(uow: FakeProfileUoW, user_id: int) -> None:
    uow.profiles.profiles[user_id] = Profile(
        user_id=user_id,
        full_name="Тест",
        group="ИУ7-11Б",
        telegram="tg",
        team_id=TEAM_ID,
    )


def dto(team_code: str | None) -> ProfileCreateDTO:
    return ProfileCreateDTO(
        full_name="Новый Участник",
        group="ИУ7-11Б",
        telegram="new_member",
        team_code=team_code,
    )


@pytest.fixture
def uow() -> FakeProfileUoW:
    uow = FakeProfileUoW()
    add_member(uow, LEADER_ID)
    return uow


async def test_invite_code_puts_profile_into_team(uow):
    await create_profile(NEW_USER_ID, dto(TEAM_CODE), uow, FakeEmailProvider())
    assert uow.committed
    assert uow.profiles.profiles[NEW_USER_ID].team_id == TEAM_ID
    team = await uow.teams.get_team_by_code(TEAM_CODE)
    assert sorted(team.members) == [LEADER_ID, NEW_USER_ID]


async def test_without_invite_code_profile_has_no_team(uow):
    await create_profile(NEW_USER_ID, dto(None), uow, FakeEmailProvider())
    assert uow.profiles.profiles[NEW_USER_ID].team_id is None


async def test_full_team_rejects_invite(uow):
    for user_id in range(100, 100 + MAX_TEAM_SIZE - 1):
        add_member(uow, user_id)
    with pytest.raises(TeamIsFull):
        await create_profile(NEW_USER_ID, dto(TEAM_CODE), uow, FakeEmailProvider())
    assert not uow.committed
