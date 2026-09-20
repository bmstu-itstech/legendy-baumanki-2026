from sqladmin import ModelView
from src.tasks.infra.db.orm import (
    ModuleModel,
    SectionModel,
    StateModel,
    TaskAnswerModel,
    TaskMediaModel,
    TaskModel,
    TaskQuestionModel,
    TeamAnswerModel,
)


class ModuleAdmin(ModelView, model=ModuleModel):
    column_list = (ModuleModel.id, ModuleModel.title, ModuleModel.open_at)
    column_sortable_list = (ModuleModel.id, ModuleModel.title, ModuleModel.open_at)
    column_searchable_list = (ModuleModel.title,)


class SectionAdmin(ModelView, model=SectionModel):
    column_list = (SectionModel.module_id, SectionModel.number, SectionModel.title)
    column_sortable_list = (SectionModel.module_id, SectionModel.number)
    column_searchable_list = (SectionModel.title,)


class TaskAdmin(ModelView, model=TaskModel):
    column_list = (
        TaskModel.id,
        TaskModel.module_id,
        TaskModel.number,
        TaskModel.section_number,
        TaskModel.title,
        TaskModel.max_score,
        TaskModel.manual_review,
        TaskModel.require_task_id,
    )
    column_sortable_list = (
        TaskModel.id,
        TaskModel.module_id,
        TaskModel.number,
        TaskModel.section_number,
    )
    column_searchable_list = (TaskModel.title,)


class TaskQuestionAdmin(ModelView, model=TaskQuestionModel):
    column_list = (
        TaskQuestionModel.task_id,
        TaskQuestionModel.number,
        TaskQuestionModel.text,
        TaskQuestionModel.question_type,
        TaskQuestionModel.regex,
        TaskQuestionModel.supported_exts,
    )
    column_sortable_list = (TaskQuestionModel.task_id, TaskQuestionModel.number)
    column_searchable_list = (TaskQuestionModel.text,)
    name = "Task question"
    name_plural = "Task questions"


class TaskAnswerAdmin(ModelView, model=TaskAnswerModel):
    """Эталонные (правильные) варианты ответов — для автопроверки."""

    column_list = (
        TaskAnswerModel.id,
        TaskAnswerModel.task_id,
        TaskAnswerModel.question_number,
        TaskAnswerModel.text,
    )
    column_sortable_list = (TaskAnswerModel.task_id, TaskAnswerModel.question_number)
    column_searchable_list = (TaskAnswerModel.text,)
    name = "Task answer"
    name_plural = "Task answers"


class TaskMediaAdmin(ModelView, model=TaskMediaModel):
    column_list = (
        TaskMediaModel.task_id,
        TaskMediaModel.number,
        TaskMediaModel.media_type,
        TaskMediaModel.file_id,
    )
    column_sortable_list = (TaskMediaModel.task_id, TaskMediaModel.number)
    name = "Task media"
    name_plural = "Task media"


class StateAdmin(ModelView, model=StateModel):
    """
    Состояние команды по заданию. Создаётся/закрывается командой через API;
    отсюда организаторы правят статус и баллы для заданий с ручной проверкой
    (manual_review) — отдельного эндпоинта для этого пока нет.
    """

    can_create = False
    can_delete = False

    column_list = (
        StateModel.team_id,
        StateModel.task_id,
        StateModel.status,
        StateModel.score,
        StateModel.started_at,
        StateModel.completed_at,
    )
    column_sortable_list = (
        StateModel.team_id,
        StateModel.task_id,
        StateModel.status,
        StateModel.started_at,
        StateModel.completed_at,
    )
    name = "Task state"
    name_plural = "Task states"


class TeamAnswerAdmin(ModelView, model=TeamAnswerModel):
    """Последние ответы команд — только для просмотра при разборе споров."""

    can_create = False
    can_edit = False
    can_delete = False

    column_list = (
        TeamAnswerModel.team_id,
        TeamAnswerModel.task_id,
        TeamAnswerModel.question_number,
        TeamAnswerModel.text,
    )
    column_sortable_list = (TeamAnswerModel.team_id, TeamAnswerModel.task_id)
    column_searchable_list = (TeamAnswerModel.text,)
    name = "Team answer"
    name_plural = "Team answers"
