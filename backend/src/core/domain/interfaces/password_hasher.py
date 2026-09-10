import abc


class IPasswordHasher(abc.ABC):
    @abc.abstractmethod
    def hash(self, password: str) -> str:
        """Generates password hash"""

    @abc.abstractmethod
    def verify(self, password: str, hashed_password: str) -> bool:
        """Verify if a password matches the hashed one"""
