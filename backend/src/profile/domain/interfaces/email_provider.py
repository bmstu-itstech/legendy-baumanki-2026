import abc


class IEmailProvider(abc.ABC):
    @abc.abstractmethod
    async def get_user_email(self, user_id: int) -> str:
        pass
