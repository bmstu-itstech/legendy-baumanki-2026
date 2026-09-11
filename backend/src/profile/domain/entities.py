import datetime as dt

from src.core.domain.entities import CustomModel
from src.profile.domain.exception import TeamIsFull, UserAlreadyInTeam, UserIsNotInTeam

MAX_TEAM_SIZE: int = 8


class ProfileCreate(CustomModel):
    user_id: int
    full_name: str
    group: str
    telegram: str


class Profile(CustomModel):
    user_id: int
    full_name: str
    group: str
    telegram: str
    team_id: int | None = None


class ProfileUpdate(CustomModel):
    user_id: int
    full_name: str | None = None
    group: str | None = None
    telegram: str | None = None
    team_id: int | None = None


class TeamCreate(CustomModel):
    name: str
    public_code: str
    leader_id: int


class Team(CustomModel):
    id: int
    public_code: str
    name: str
    members: list[int]
    leader_id: int
    created_at: dt.datetime
    updated_at: dt.datetime

    def join(self, member_id: int):
        if len(self.members) >= MAX_TEAM_SIZE:
            raise TeamIsFull()
        if member_id in self.members:
            raise UserAlreadyInTeam()
        self.members.append(member_id)

    def kick(self, member_id: int):
        if not member_id in self.members:
            raise UserIsNotInTeam()
        self.members.remove(member_id)
        if len(self.members) == 0:
            return
        if member_id == self.leader_id:
            self.leader_id = self.members[0]


class TeamWithMembers(CustomModel):
    id: int
    public_code: str
    name: str
    members: list[Profile]
    leader: Profile
    created_at: dt.datetime
    updated_at: dt.datetime

    def downgrade(self) -> Team:
        return Team(
            id=self.id,
            public_code=self.public_code,
            name=self.name,
            leader_id=self.leader.user_id,
            members=[m.user_id for m in self.members],
            created_at=self.created_at,
            updated_at=self.updated_at,
        )


class TeamUpdate(CustomModel):
    id: int
    name: str | None = None
    leader_id: int | None = None
