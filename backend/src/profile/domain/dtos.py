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
    team_id: int
    public_code: str


class TeamMemberDTO(CustomModel):
    user_id: int
    email: str
    full_name: str
    group: str
    telegram: str

    @classmethod
    def from_profile(cls, profile: Profile, email: str):
        return TeamMemberDTO(**profile.model_dump(mode="json"), email=email)


class TeamWithMembersDTO(CustomModel):
    id: int
    public_code: str
    name: str
    members: list[TeamMemberDTO]
    leader: TeamMemberDTO

    @classmethod
    def from_domain(cls, team: TeamWithMembers, emails: dict[int, str]) -> Self:
        return cls(
            id=team.id,
            public_code=team.public_code,
            name=team.name,
            leader=TeamMemberDTO.from_profile(team.leader, emails[team.leader.user_id]),
            members=[
                TeamMemberDTO.from_profile(member, emails[member.user_id])
                for member in team.members
            ],
        )


class TeamUpdateDTO(CustomModel):
    name: str
