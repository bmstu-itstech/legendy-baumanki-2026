import datetime as dt
from enum import StrEnum

from src.core.domain.entities import CustomModel
from src.tasks.domain.exceptions import TaskIllegalStatusTransition

COMPLETED_TEAM_MIN_SIZE = 3  # TODO: 5


class MediaType(StrEnum):
    FILE = "file"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class QuestionType(StrEnum):
    TEXT = "text"
    FILE = "file"


class TaskStatus(StrEnum):
    CLOSED = "closed"
    OPENED = "opened"
    STARTED = "started"
    REVIEW = "review"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class Question(CustomModel):
    text: str
    question_type: QuestionType
    regex: str | None = None
    supported_ext: list[str]
    correct: list[str]
    last_answer: str | None = None

    def answer(self, s: str) -> bool:
        self.last_answer = s
        return s.lower() in self.correct


class QuestionUpdate(CustomModel):
    last_answer: str | None


class Media(CustomModel):
    file_id: int
    media_type: MediaType


class Task(CustomModel):
    id: int
    title: str
    desc: str
    explanation: str
    max_score: int
    manual_review: bool
    require_task: int | None = None
    status: TaskStatus
    score: int | None = None
    started_at: dt.datetime | None = None
    completed_at: dt.datetime | None = None
    questions: list[Question]
    media: list[Media]

    def answer(self, answers: list[str]):
        if self.status not in [
            TaskStatus.STARTED,
            TaskStatus.REVIEW,
            TaskStatus.FAILED,
        ]:
            raise TaskIllegalStatusTransition()
        if len(answers) != len(self.questions):
            raise Answer
        if self.manual_review or all(
            q.answer(s) for q, s in zip(self.questions, answers)
        ):
            self.status = TaskStatus.COMPLETED
            self.completed_at = dt.datetime.now(tz=dt.timezone.utc)
            self.score = self.max_score
        else:
            self.status = TaskStatus.FAILED
            self.score = 0

    def start(self):
        if self.status != TaskStatus.OPENED:
            raise TaskIllegalStatusTransition()
        self.status = TaskStatus.STARTED
        self.started_at = dt.datetime.now(tz=dt.timezone.utc)

    def skip(self):
        if self.status in [TaskStatus.CLOSED, TaskStatus.SKIPPED]:
            raise TaskIllegalStatusTransition()
        self.status = TaskStatus.SKIPPED
        self.completed_at = dt.datetime.now(tz=dt.timezone.utc)
        self.score = 0

    def open(self):
        if self.status != TaskStatus.CLOSED:
            raise TaskIllegalStatusTransition()
        self.status = TaskStatus.OPENED


class TaskUpdate(CustomModel):
    task_id: int
    status: TaskStatus
    score: int | None = None
    started_at: dt.datetime | None = None
    completed_at: dt.datetime | None = None
    questions: list[QuestionUpdate] | None = None


class Section(CustomModel):
    title: str
    tasks: list[Task]


class Module(CustomModel):
    id: int
    title: str
    open_at: dt.datetime
    score: int
    max_score: int


class ModuleDetails(Module):
    sections: list[Section]
    auxiliary_tasks: list[Task]


class Answer(CustomModel):
    team_id: int
    task_id: int
    created_at: dt.datetime


class TeamInfo(CustomModel):
    id: int
    size: int

    @property
    def completed(self) -> bool:
        return self.size >= COMPLETED_TEAM_MIN_SIZE
