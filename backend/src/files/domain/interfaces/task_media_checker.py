import abc


class ITaskMediaChecker(abc.ABC):
    @abc.abstractmethod
    async def is_task_media(self, file_id: int) -> bool:
        """True, если файл прикреплён как медиа к заданию — такой контент публичный."""
