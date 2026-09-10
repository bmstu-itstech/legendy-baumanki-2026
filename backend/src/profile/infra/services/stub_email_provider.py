from src.profile.domain.interfaces.email_provider import IEmailProvider


class StubEmailProvider(IEmailProvider):
    async def get_user_email(self, _: int) -> str:
        return ""
