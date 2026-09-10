import secrets

from src.profile.domain.interfaces.team_code_provider import ITeamCodeProvider


class HashlibTeamCodeProvider(ITeamCodeProvider):
    def __init__(
        self, length: int, alphabet: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
    ):
        self.length = length
        self.alphabet = alphabet

    def generate_code(self) -> str:
        return "".join(secrets.choice(self.alphabet) for _ in range(self.length))
