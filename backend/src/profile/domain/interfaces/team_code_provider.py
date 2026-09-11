import abc


class ITeamCodeProvider(abc.ABC):
    @abc.abstractmethod
    def generate_code(self) -> str:
        """Создаёт случайный человеко-читаемый код команды"""
