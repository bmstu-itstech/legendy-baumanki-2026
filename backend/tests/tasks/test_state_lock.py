import pytest

from src.tasks.domain.dtos import AnswerTaskDTO
from src.tasks.domain.entities import (
    Question,
    QuestionType,
    Task,
    TaskStatus,
    TaskUpdate,
    TeamInfo,
)
from src.tasks.domain.interfaces.task_repo import ITaskRepository
from src.tasks.domain.interfaces.task_uow import ITaskUnitOfWork
from src.tasks.domain.interfaces.team_provider import ITeamProvider
from src.tasks.usecases import answer_task, resolve_review, skip_task, start_task

TEAM_ID = 7
TASK_ID = 19
USER_ID = 42


class RecordingTaskRepository(ITaskRepository):
    def __init__(self, status: TaskStatus):
        self.calls: list[tuple] = []
        self._task = Task(
            id=TASK_ID,
            title="t",
            desc="d",
            explanation="",
            max_score=1,
            manual_review=False,
            status=status,
            questions=[
                Question(
                    text="q",
                    question_type=QuestionType.TEXT,
                    supported_ext=[],
                    correct=["17"],
                )
            ],
            media=[],
        )

    async def lock_task_state(self, team_id: int, task_id: int) -> None:
        self.calls.append(("lock", team_id, task_id))

    async def get_task_by_id(self, team_id: int, task_id: int) -> Task:
        self.calls.append(("get", team_id, task_id))
        return self._task

    async def update_task(self, team_id: int, task: TaskUpdate) -> Task:
        self.calls.append(("update", team_id, task.task_id))
        return self._task

    async def get_all(self, team_id):
        raise NotImplementedError

    async def get_by_id(self, team_id, module_id):
        raise NotImplementedError

    async def get_ratings(self):
        raise NotImplementedError

    async def get_rating(self, rating_id):
        raise NotImplementedError


class FakeTaskUoW(ITaskUnitOfWork):
    def __init__(self, repo: RecordingTaskRepository):
        self.tasks = repo

    async def rollback(self) -> None:
        pass

    async def _commit(self) -> None:
        pass


class FakeTeamProvider(ITeamProvider):
    async def get_team_id(self, user_id: int) -> TeamInfo | None:
        return TeamInfo(id=TEAM_ID, size=5)


EXPECTED = [
    ("lock", TEAM_ID, TASK_ID),
    ("get", TEAM_ID, TASK_ID),
    ("update", TEAM_ID, TASK_ID),
]


async def test_start_task_locks_before_read():
    repo = RecordingTaskRepository(TaskStatus.OPENED)
    await start_task(TASK_ID, USER_ID, FakeTaskUoW(repo), FakeTeamProvider())
    assert repo.calls == EXPECTED


async def test_answer_task_locks_before_read():
    repo = RecordingTaskRepository(TaskStatus.STARTED)
    await answer_task(
        TASK_ID,
        USER_ID,
        AnswerTaskDTO(answers=["17"]),
        FakeTaskUoW(repo),
        FakeTeamProvider(),
    )
    assert repo.calls == EXPECTED


async def test_skip_task_locks_before_read():
    repo = RecordingTaskRepository(TaskStatus.STARTED)
    await skip_task(TASK_ID, USER_ID, FakeTaskUoW(repo), FakeTeamProvider())
    assert repo.calls == EXPECTED


async def test_resolve_review_locks_before_read():
    repo = RecordingTaskRepository(TaskStatus.REVIEW)
    await resolve_review(USER_ID, TEAM_ID, TASK_ID, True, FakeTaskUoW(repo))
    assert repo.calls == EXPECTED


async def test_start_after_completion_is_rejected():
    """Запоздавший start после ответа должен падать, а не откатывать статус."""
    from src.tasks.domain.exceptions import TaskIllegalStatusTransition

    repo = RecordingTaskRepository(TaskStatus.COMPLETED)
    with pytest.raises(TaskIllegalStatusTransition):
        await start_task(TASK_ID, USER_ID, FakeTaskUoW(repo), FakeTeamProvider())
    assert ("update", TEAM_ID, TASK_ID) not in repo.calls
