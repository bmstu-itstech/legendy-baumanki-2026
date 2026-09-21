import datetime as dt

from src.core.domain.entities import CustomModel
from src.tasks.domain.entities import MediaType, QuestionType


class AdminModuleDTO(CustomModel):
    id: int
    title: str
    open_at: dt.datetime


class AdminModuleUpsertDTO(CustomModel):
    title: str
    open_at: dt.datetime


class AdminModuleListDTO(CustomModel):
    modules: list[AdminModuleDTO]


class AdminSectionDTO(CustomModel):
    module_id: int
    number: int
    title: str


class AdminSectionUpsertDTO(CustomModel):
    title: str


class AdminQuestionDTO(CustomModel):
    number: int
    text: str
    question_type: QuestionType
    regex: str | None
    supported_ext: list[str]
    # В отличие от участницкого QuestionDTO — организаторам эталонные ответы видны.
    answers: list[str]


class AdminQuestionUpsertDTO(CustomModel):
    text: str
    question_type: QuestionType = QuestionType.TEXT
    regex: str | None = None
    supported_ext: list[str] = []
    answers: list[str] = []


class AdminMediaDTO(CustomModel):
    number: int
    media_type: MediaType
    file_id: int


class AdminMediaUpsertDTO(CustomModel):
    media_type: MediaType
    file_id: int


class AdminTaskDTO(CustomModel):
    id: int
    module_id: int
    number: int
    # None — побочное (auxiliary) задание, не входит ни в одну секцию.
    section_number: int | None
    title: str
    desc: str
    explanation: str
    max_score: int
    manual_review: bool
    require_task_id: int | None
    questions: list[AdminQuestionDTO]
    media: list[AdminMediaDTO]


class AdminTaskUpsertDTO(CustomModel):
    module_id: int
    section_number: int | None = None
    title: str
    desc: str
    explanation: str = ""
    max_score: int = 1
    manual_review: bool = False
    require_task_id: int | None = None
    questions: list[AdminQuestionUpsertDTO] = []
    media: list[AdminMediaUpsertDTO] = []


class AdminModuleContentDTO(CustomModel):
    """Полное дерево модуля для редактирования — секции и все его задания."""

    module: AdminModuleDTO
    sections: list[AdminSectionDTO]
    tasks: list[AdminTaskDTO]


class AdminReviewAnswerDTO(CustomModel):
    question_number: int
    question_text: str
    text: str


class AdminReviewItemDTO(CustomModel):
    """Ответ на ручную проверку — задание команда уже отправила, ждёт модератора."""

    team_id: int
    team_name: str
    task_id: int
    task_title: str
    module_title: str
    started_at: dt.datetime | None
    answers: list[AdminReviewAnswerDTO]


class AdminReviewListDTO(CustomModel):
    items: list[AdminReviewItemDTO]


class AdminReviewResolveDTO(CustomModel):
    approve: bool
