from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload
from src.profile.domain.entities import (
    Profile,
    ProfileCreate,
    Team,
    TeamCreate,
    TeamUpdate,
    TeamWithMembers,
)
from src.profile.domain.exception import (
    ProfileAlreadyExists,
    ProfileNotFound,
    TeamNotFound,
)
from src.profile.domain.interfaces.profile_repo import IProfileRepository
from src.profile.domain.interfaces.team_repo import ITeamRepository
from src.profile.infra.db.orm import ProfileModel, TeamModel


class PGProfileRepository(IProfileRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def create(self, profile: ProfileCreate) -> Profile:
        obj = ProfileModel(**profile.model_dump(mode="json"))
        self.session.add(obj)
        try:
            await self.session.flush()
        except IntegrityError as e:
            try:
                detail = (
                    "Profile can't be created. " + str(e.orig).split("\nDETAIL:  ")[1]
                )
            except IndexError:
                detail = "Profile can't be created due to integrity error."
            raise ProfileAlreadyExists(detail=detail)
        return self._to_domain(obj)

    async def get_by_id(self, user_id: int) -> Profile:
        stmt = select(ProfileModel).where(ProfileModel.user_id == user_id)
        results = await self.session.execute(stmt)
        obj: ProfileModel | None = results.scalar_one_or_none()
        if not obj:
            raise ProfileNotFound(detail=f"Profile with id {user_id} not found")
        return self._to_domain(obj)

    async def update(self, profile: Profile) -> Profile:
        stmt = select(ProfileModel).where(ProfileModel.user_id == profile.user_id)
        result = await self.session.execute(stmt)
        obj: ProfileModel | None = result.scalar_one_or_none()
        if not obj:
            raise ProfileNotFound(detail=f"Profile with id {profile.user_id} not found")
        for field, value in profile.model_dump(mode="json", exclude_unset=True).items():
            setattr(obj, field, value)
        await self.session.flush()
        return self._to_domain(obj)

    @staticmethod
    def _to_domain(obj: ProfileModel) -> Profile:
        return Profile(
            user_id=obj.user_id,
            full_name=obj.full_name,
            group=obj.group,
            telegram=obj.telegram,
            team_id=obj.team_id,
        )


class PGTeamRepository(ITeamRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def create_team(self, team_data: TeamCreate) -> Team:
        obj = TeamModel(**team_data.model_dump(mode="json"))
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj, attribute_names=["members"])
        return self._to_domain(obj)

    async def get_team_by_id(self, team_id: int) -> Team:
        stmt = (
            select(TeamModel)
            .where(TeamModel.id == team_id)
            .options(selectinload(TeamModel.members))
        )
        results = await self.session.execute(stmt)
        obj: TeamModel | None = results.scalar_one_or_none()
        if not obj:
            raise TeamNotFound(detail=f"Team with id {team_id} not found")
        return self._to_domain(obj)

    async def get_team_by_code(self, code: str) -> Team:
        stmt = (
            select(TeamModel)
            .where(TeamModel.public_code == code)
            .options(selectinload(TeamModel.members))
        )
        results = await self.session.execute(stmt)
        obj: TeamModel | None = results.scalar_one_or_none()
        if not obj:
            raise TeamNotFound(detail=f"Team with code {code} not found")
        return self._to_domain(obj)

    async def get_profile_team_or_none(self, member_id: int) -> TeamWithMembers | None:
        Member = aliased(ProfileModel)
        stmt = (
            select(TeamModel)
            .join(Member, Member.team_id == TeamModel.id)
            .join(ProfileModel, ProfileModel.user_id == TeamModel.leader_id)
            .where(Member.user_id == member_id)
            .options(selectinload(TeamModel.members))
        )
        results = await self.session.execute(stmt)
        obj: TeamModel | None = results.scalar_one_or_none()
        if not obj:
            return None
        return self._to_domain_with_members(obj)

    async def update_team(self, team_data: TeamUpdate) -> Team:
        stmt = (
            select(TeamModel)
            .where(TeamModel.id == team_data.id)
            .options(selectinload(TeamModel.members))
        )
        result = await self.session.execute(stmt)
        obj: TeamModel | None = result.scalar_one_or_none()
        if not obj:
            raise TeamNotFound(detail=f"Team with id {team_data.id} not found")
        for field, value in team_data.model_dump(
            mode="json", exclude_unset=True
        ).items():
            setattr(obj, field, value)
        await self.session.flush()
        return self._to_domain(obj)

    async def delete_team(self, team_id: int) -> None:
        stmt = delete(TeamModel).where(TeamModel.id == team_id)
        await self.session.execute(stmt)

    @staticmethod
    def _to_domain(obj: TeamModel) -> Team:
        return Team(
            id=obj.id,
            public_code=obj.public_code,
            name=obj.name,
            leader_id=obj.leader_id,
            members=[m.user_id for m in obj.members],
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )

    @staticmethod
    def _to_domain_with_members(obj: TeamModel) -> TeamWithMembers:
        profile_to_domain = lambda p: Profile(
            user_id=p.user_id,
            full_name=p.full_name,
            group=p.group,
            telegram=p.telegram,
            team_id=p.team_id,
        )
        return TeamWithMembers(
            id=obj.id,
            public_code=obj.public_code,
            name=obj.name,
            leader=profile_to_domain(obj.leader),
            members=[profile_to_domain(m) for m in obj.members],
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )
