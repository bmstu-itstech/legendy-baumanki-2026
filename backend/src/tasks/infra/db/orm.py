import datetime as dt

from sqlalchemy import (
    ARRAY,
    DateTime,
    Enum,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import BaseModel
from src.tasks.domain.entities import MediaType, QuestionType, TaskStatus


class ModuleModel(BaseModel):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    open_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    sections: Mapped[list["SectionModel"]] = relationship(
        back_populates="module",
        order_by="SectionModel.number",
        lazy="selectin",
    )

    tasks: Mapped[list["TaskModel"]] = relationship(
        back_populates="module",
        order_by="TaskModel.number",
        lazy="selectin",
        foreign_keys="TaskModel.module_id",
    )


class SectionModel(BaseModel):
    __tablename__ = "sections"

    module_id: Mapped[int] = mapped_column(ForeignKey(ModuleModel.id), primary_key=True)
    number: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    module: Mapped[ModuleModel] = relationship(back_populates="sections")

    tasks: Mapped[list["TaskModel"]] = relationship(
        back_populates="section",
        order_by="TaskModel.number",
        lazy="selectin",
        foreign_keys="[TaskModel.module_id, TaskModel.section_number]",
        overlaps="tasks",
    )


class TaskModel(BaseModel):
    __tablename__ = "tasks"
    __table_args__ = (
        ForeignKeyConstraint(
            ["module_id", "section_number"],
            [SectionModel.module_id, SectionModel.number],
            name="tasks_section_fkey",
        ),
        UniqueConstraint("module_id", "number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey(ModuleModel.id), nullable=False)
    number: Mapped[int] = mapped_column(nullable=False)
    # NULL — побочное (auxiliary) задание, не входит ни в одну секцию.
    section_number: Mapped[int | None] = mapped_column(nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    max_score: Mapped[int] = mapped_column(nullable=False)
    manual_review: Mapped[bool] = mapped_column(nullable=False, default=False)
    require_task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.id"), nullable=True
    )

    # lazy="selectin" — как и в profile/infra/db/orm.py: доступ к этим связям
    # неявный (в _to_domain), а lazy="select" по умолчанию требует
    # синхронного greenlet-контекста и падает с MissingGreenlet на AsyncSession.
    module: Mapped[ModuleModel] = relationship(
        back_populates="tasks",
        foreign_keys=[module_id],
        lazy="selectin",
        overlaps="tasks",
    )
    section: Mapped[SectionModel | None] = relationship(
        back_populates="tasks",
        foreign_keys=[module_id, section_number],
        lazy="selectin",
        overlaps="module,tasks",
    )

    # cascade="all, delete-orphan" — без него SQLAlchemy при удалении задания
    # (или question.py: session.delete на отдельный вопрос) пытается
    # обнулить task_questions.task_id/task_media.task_id, а они часть
    # первичного ключа и NOT NULL — падает AssertionError вместо каскадного
    # удаления. Дочерние записи всегда часть самого задания, отдельно не живут.
    questions: Mapped[list["TaskQuestionModel"]] = relationship(
        back_populates="task",
        order_by="TaskQuestionModel.number",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    media: Mapped[list["TaskMediaModel"]] = relationship(
        back_populates="task",
        order_by="TaskMediaModel.number",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class TaskQuestionModel(BaseModel):
    __tablename__ = "task_questions"

    task_id: Mapped[int] = mapped_column(ForeignKey(TaskModel.id), primary_key=True)
    number: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type"), nullable=False
    )
    regex: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supported_exts: Mapped[list[str]] = mapped_column(
        ARRAY(String(15)), nullable=False, default=list
    )

    task: Mapped[TaskModel] = relationship(back_populates="questions")

    answers: Mapped[list["TaskAnswerModel"]] = relationship(
        back_populates="question",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class TaskAnswerModel(BaseModel):
    """Правильные варианты ответа на вопрос — эталон для проверки."""

    __tablename__ = "task_answers"
    __table_args__ = (
        ForeignKeyConstraint(
            ["task_id", "question_number"],
            [TaskQuestionModel.task_id, TaskQuestionModel.number],
        ),
        UniqueConstraint("task_id", "question_number", "text"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(nullable=False)
    question_number: Mapped[int] = mapped_column(nullable=False)
    text: Mapped[str] = mapped_column(String(255), nullable=False)

    question: Mapped[TaskQuestionModel] = relationship(back_populates="answers")


class TaskMediaModel(BaseModel):
    __tablename__ = "task_media"

    task_id: Mapped[int] = mapped_column(ForeignKey(TaskModel.id), primary_key=True)
    number: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    media_type: Mapped[MediaType] = mapped_column(
        Enum(MediaType, name="media_type"), nullable=False
    )
    # Файловое хранилище (модуль files) пока не реализовано, поэтому без FK.
    file_id: Mapped[int] = mapped_column(nullable=False)

    task: Mapped[TaskModel] = relationship(back_populates="media")


class StateModel(BaseModel):
    """Состояние выполнения задания командой."""

    __tablename__ = "states"

    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey(TaskModel.id), primary_key=True)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status"), nullable=False
    )
    score: Mapped[int | None] = mapped_column(nullable=True)
    started_at: Mapped[dt.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[dt.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class TeamAnswerModel(BaseModel):
    """Последний отправленный командой ответ на конкретный вопрос."""

    __tablename__ = "team_answers"
    __table_args__ = (
        ForeignKeyConstraint(
            ["task_id", "question_number"],
            [TaskQuestionModel.task_id, TaskQuestionModel.number],
        ),
    )

    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), primary_key=True)
    task_id: Mapped[int] = mapped_column(primary_key=True)
    question_number: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
