from typing import Self

from pydantic import Field
from src.core.domain.entities import CustomModel
from src.profile.domain.entities import Profile, ProfileUpdate, TeamWithMembers

PROFILE_FULL_NAME_REGEX = r"^[А-я ]*$"
PROFILE_GROUP_REGEX = (
    r"^(ИУ|ИБМ|МТ|СМ|БМТ|РЛ|Э|РК|ФН|Л|СГН|РКТ|АК|ПС|РТ|ЛТ|К|ЮР|ЮР.ДК|МК|ИУК)"
    r"([1-9]\d?)?[КИЦ]?"
    r"-"
    r"1([1-9]|(\.1\d))"
    r"[АМБ]?В?"
    r"(\/\d)?$"
)
PROFILE_TELEGRAM_REGEX = r"^[A-z0-9_]*$"
TEAM_CODE_REGEX = r"^[A-Z1-9]{6}$"


class ProfileCreateDTO(CustomModel):
    # user_id НЕ берём из тела запроса — иначе любой аноним мог бы создать
    # профиль на чужой user_id (см. api_create_profile: id берётся из токена).
    full_name: str = Field(
        pattern=PROFILE_FULL_NAME_REGEX, min_length=2, max_length=128
    )
    group: str = Field(pattern=PROFILE_GROUP_REGEX)
    telegram: str = Field(pattern=PROFILE_TELEGRAM_REGEX, min_length=2, max_length=32)
    team_code: str | None = Field(None, pattern=TEAM_CODE_REGEX)


class ProfileReadDTO(CustomModel):
    user_id: int
    email: str
    full_name: str
    group: str
    telegram: str
    team_code: str | None = None


class ProfileUpdateDTO(CustomModel):
    full_name: str | None = Field(
        None, pattern=PROFILE_FULL_NAME_REGEX, min_length=2, max_length=128
    )
    group: str | None = Field(None, pattern=PROFILE_GROUP_REGEX)
    telegram: str | None = Field(
        None, pattern=PROFILE_TELEGRAM_REGEX, min_length=2, max_length=32
    )

    def to_domain(self) -> ProfileUpdate:
        return ProfileUpdate(**self.model_dump(mode="json"))


class TeamCreateDTO(CustomModel):
    name: str = Field(min_length=3, max_length=128)


class TeamCreatedDTO(CustomModel):
    id: int
    public_code: str


class TeamMemberDTO(CustomModel):
    user_id: int
    full_name: str
    group: str
    telegram: str

    @classmethod
    def from_profile(cls, profile: Profile, email: str):
        return TeamMemberDTO(**profile.model_dump(mode="json"))


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
    name: str = Field(min_length=3, max_length=128)
