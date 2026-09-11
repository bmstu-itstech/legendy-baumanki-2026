from typing import Self

from src.core.domain.entities import CustomModel
from src.profile.domain.entities import Profile, ProfileUpdate, TeamWithMembers


class ProfileCreateDTO(CustomModel):
    user_id: int
    full_name: str
    group: str
    telegram: str
    team_code: str | None = None


class ProfileReadDTO(CustomModel):
    user_id: int
    email: str
    full_name: str
    group: str
    telegram: str
    team_code: str | None = None


class ProfileUpdateDTO(CustomModel):
    user_id: int
    full_name: str | None = None
    group: str | None = None
    telegram: str | None = None

    def to_domain(self) -> ProfileUpdate:
        return ProfileUpdate(**self.model_dump(mode="json"))


class TeamCreateDTO(CustomModel):
    name: str


class TeamCreatedDTO(CustomModel):
    id: int
    public_code: str


class TeamMemberDTO(CustomModel):
    user_id: int
    full_name: str
    group: str
    telegram: str

    @classmethod
    def from_profile(cls, profile: Profile):
        return TeamMemberDTO(**profile.model_dump(mode="json"))


class TeamWithMembersDTO(CustomModel):
    id: int
    public_code: str
    name: str
    members: list[TeamMemberDTO]
    leader: TeamMemberDTO

    @classmethod
    def from_domain(cls, team: TeamWithMembers) -> Self:
        return cls(
            id=team.id,
            public_code=team.public_code,
            name=team.name,
            leader=TeamMemberDTO.from_profile(team.leader),
            members=[TeamMemberDTO.from_profile(member) for member in team.members],
        )


class TeamUpdateDTO(CustomModel):
    name: str
