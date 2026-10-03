import datetime as dt

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from src.core.domain.exceptions.exceptions import AppException
from src.profile.domain.entities import Profile, TeamWithMembers
from src.profile.domain.exception import TeamNotFound
from src.profile.domain.interfaces.email_provider import IEmailProvider
from src.profile.domain.interfaces.profile_uow import IProfileUnitOfWork
from src.profile.domain.interfaces.team_repo import ITeamRepository
from src.profile.presentation.admin_api import admin_teams_api_router
from src.profile.presentation.dependencies import get_email_provider, get_profile_uow
from src.profile.usecases import admin_get_team

TEAM_ID = 7
LEADER_ID = 2


def _profile(user_id: int, name: str) -> Profile:
    return Profile(
        user_id=user_id,
        full_name=name,
        group="ИУ7-11Б",
        telegram=f"tg{user_id}",
        team_id=TEAM_ID,
    )


class FakeTeamRepository(ITeamRepository):
    async def get_team_with_members(self, team_id: int) -> TeamWithMembers:
        if team_id != TEAM_ID:
            raise TeamNotFound()
        leader = _profile(LEADER_ID, "Яков Капитанов")
        now = dt.datetime(2026, 9, 20, tzinfo=dt.UTC)
        return TeamWithMembers(
            id=TEAM_ID,
            public_code="ABC123",
            name="Хранители",
            leader=leader,
            members=[_profile(3, "Борис"), leader, _profile(1, "Анна")],
            created_at=now,
            updated_at=now,
        )

    async def create_team(self, team_data):
        raise NotImplementedError

    async def get_team_by_id(self, team_id):
        raise NotImplementedError

    async def get_team_by_code(self, code):
        raise NotImplementedError

    async def get_profile_team_or_none(self, member_id):
        raise NotImplementedError

    async def update_team(self, team_data):
        raise NotImplementedError

    async def delete_team(self, team_id):
        raise NotImplementedError


class FakeProfileUoW(IProfileUnitOfWork):
    def __init__(self):
        self.teams = FakeTeamRepository()

    async def rollback(self) -> None:
        pass

    async def _commit(self) -> None:
        pass


class FakeEmailProvider(IEmailProvider):
    async def get_user_email(self, user_id: int) -> str:
        return f"user{user_id}@test.ru"


async def test_captain_first_then_by_name_with_emails():
    team = await admin_get_team(TEAM_ID, FakeProfileUoW(), FakeEmailProvider())
    assert team.leader_id == LEADER_ID
    assert [m.user_id for m in team.members] == [LEADER_ID, 1, 3]
    assert team.members[1].email == "user1@test.ru"
    assert team.members[1].group == "ИУ7-11Б"
    assert team.members[1].telegram == "tg1"


async def test_unknown_team():
    with pytest.raises(TeamNotFound):
        await admin_get_team(999, FakeProfileUoW(), FakeEmailProvider())


class _FakeUser:
    id = 1

    def __init__(self, is_superuser: bool):
        self.is_superuser = is_superuser


def _client(is_superuser: bool) -> TestClient:
    app = FastAPI()

    @app.exception_handler(AppException)
    async def app_exception_handler(_, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code, content={"error_code": exc.error_code}
        )

    @app.middleware("http")
    async def inject_user(request, call_next):
        request.state.user = _FakeUser(is_superuser)
        return await call_next(request)

    app.include_router(admin_teams_api_router, prefix="/admin/teams")
    app.dependency_overrides[get_profile_uow] = FakeProfileUoW
    app.dependency_overrides[get_email_provider] = FakeEmailProvider
    return TestClient(app)


def test_non_superuser_cannot_see_emails():
    response = _client(is_superuser=False).get(f"/admin/teams/{TEAM_ID}")
    assert response.status_code == 403
    assert "@test.ru" not in response.text


def test_superuser_gets_team():
    response = _client(is_superuser=True).get(f"/admin/teams/{TEAM_ID}")
    assert response.status_code == 200
    assert response.json()["members"][0]["email"] == "user2@test.ru"


def test_unknown_team_is_404():
    response = _client(is_superuser=True).get("/admin/teams/999")
    assert response.status_code == 404
    assert response.json()["error_code"] == "team_not_found"
