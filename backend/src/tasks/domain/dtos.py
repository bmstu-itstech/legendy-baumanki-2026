import datetime as dt
from typing import Self

from src.core.domain.entities import CustomModel
from src.tasks.domain.entities import (
    Media,
    Module,
    ModuleDetails,
    Question,
    QuestionType,
    Section,
    Task,
    TaskStatus,
)


class QuestionDTO(CustomModel):
    """
    Вопрос без чувствительных полей — без списка правильных ответов, иначе
    их можно прочитать прямо в ответе API.
    """

    text: str
    question_type: QuestionType
    regex: str | None
    supported_ext: list[str]
    last_answer: str | None

    @classmethod
    def from_domain(cls, q: Question) -> Self:
        return cls(
            text=q.text,
            question_type=q.question_type,
            regex=q.regex,
            supported_ext=q.supported_ext,
            last_answer=q.last_answer,
        )


class TaskDTO(CustomModel):
    """
    Задание в рамках модуля.

    Задание может иметь несколько полей для ответа (несколько вопросов), но
    несмотря на это является атомарным.
    """

    id: int
    title: str
    desc: str
    explanation: str
    score: int | None
    manual_review: bool
    status: TaskStatus
    questions: list[QuestionDTO]
    media: list[Media]

    @classmethod
    def from_domain(cls, t: Task) -> Self:
        return cls(
            id=t.id,
            title=t.title,
            desc=t.desc,
            explanation=t.explanation,
            score=t.score,
            manual_review=t.manual_review,
            status=t.status,
            questions=[QuestionDTO.from_domain(q) for q in t.questions],
            media=t.media,
        )


class SectionDTO(CustomModel):
    title: str
    tasks: list[TaskDTO]

    @classmethod
    def from_domain(cls, s: Section) -> Self:
        return cls(
            title=s.title,
            tasks=[TaskDTO.from_domain(t) for t in s.tasks],
        )


class ModuleDTO(CustomModel):
    id: int
    title: str
    open_at: dt.datetime
    score: int
    max_score: int

    @classmethod
    def from_domain(cls, m: Module) -> Self:
        return cls(
            id=m.id,
            title=m.title,
            open_at=m.open_at,
            score=m.score,
            max_score=m.max_score,
        )


class ModuleDetailsDTO(ModuleDTO):
    sections: list[SectionDTO]
    auxiliary_tasks: list[TaskDTO]

    @classmethod
    def from_domain(cls, m: ModuleDetails) -> Self:
        return cls(
            id=m.id,
            title=m.title,
            open_at=m.open_at,
            score=m.score,
            max_score=m.max_score,
            sections=[SectionDTO.from_domain(s) for s in m.sections],
            auxiliary_tasks=[TaskDTO.from_domain(t) for t in m.auxiliary_tasks],
        )


class ModulesListDTO(CustomModel):
    modules: list[ModuleDTO]


class RatingDTO(CustomModel):
    id: int
    # None — сводный рейтинг побочных заданий, не привязан к одному модулю.
    module_id: int | None
    title: str


class RatingsListDTO(CustomModel):
    ratings: list[RatingDTO]


class RatingCell(CustomModel):
    task_id: int
    score: int
    time: dt.timedelta


class RatingRow(CustomModel):
    position: int
    team_id: int
    team_name: str
    cells: list[RatingCell]
    total_score: int | None
    total_time: dt.timedelta | None


class RatingDetailDTO(RatingDTO):
    rows: list[RatingRow]


class AnswerTaskDTO(CustomModel):
    """Массив ответов как строк или ссылок на загруженные ресурсы"""

    answers: list[str]
