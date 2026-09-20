import datetime as dt

from src.tasks.domain.entities import (
    Module,
    ModuleDetails,
    Question,
    QuestionType,
    Section,
    Task,
    TaskStatus,
    TaskUpdate,
)
from src.tasks.domain.interfaces.task_repo import ITaskRepository


class MockTaskRepository(ITaskRepository):
    async def get_all(self, team_id: int) -> list[Module]:
        return [
            Module(
                id=1,
                title="Мужество",
                open_at=dt.datetime.now(tz=dt.timezone.utc),
                score=0,
                max_score=72,
            ),
            Module(
                id=2,
                title="Воля",
                open_at=dt.datetime.now(tz=dt.timezone.utc) + dt.timedelta(days=1),
                score=0,
                max_score=72,
            ),
            Module(
                id=3,
                title="Труд",
                open_at=dt.datetime.now(tz=dt.timezone.utc) + dt.timedelta(days=1),
                score=0,
                max_score=72,
            ),
            Module(
                id=4,
                title="Упорство",
                open_at=dt.datetime.now(tz=dt.timezone.utc) + dt.timedelta(days=1),
                score=0,
                max_score=72,
            ),
        ]

    async def get_by_id(self, team_id: int, module_id: int) -> ModuleDetails:
        return ModuleDetails(
            id=1,
            title="Мужество",
            open_at=dt.datetime.now(tz=dt.timezone.utc),
            score=0,
            max_score=72,
            sections=[
                Section(
                    title="Очные задания",
                    tasks=[
                        Task(
                            id=1,
                            title="Найти таинственную аудиторию",
                            desc="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim aeque doleamus animo, cum corpore dolemus, fieri tamen permagna.",
                            explanation="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem.",
                            max_score=1,
                            manual_review=False,
                            status=TaskStatus.STARTED,
                            started_at=dt.datetime.now(tz=dt.timezone.utc),
                            questions=[
                                Question(
                                    text="Как называется та таинственная аудитория?",
                                    question_type=QuestionType.TEXT,
                                    correct=["501ю"],
                                ),
                            ],
                        )
                    ],
                )
            ],
            auxiliary_tasks=[
                Task(
                    id=2,
                    title="Найти таинственную аудиторию",
                    desc="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim aeque doleamus animo, cum corpore dolemus, fieri tamen permagna.",
                    explanation="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem.",
                    max_score=1,
                    manual_review=False,
                    status=TaskStatus.OPENED,
                    questions=[
                        Question(
                            text="Как называется та таинственная аудитория?",
                            question_type=QuestionType.TEXT,
                            correct=["501ю"],
                        ),
                    ],
                )
            ],
        )

    async def get_task_by_id(self, team_id: int, task_id: int) -> Task:
        return Task(
            id=1,
            title="Найти таинственную аудиторию",
            desc="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim aeque doleamus animo, cum corpore dolemus, fieri tamen permagna.",
            explanation="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem.",
            max_score=1,
            manual_review=False,
            status=TaskStatus.STARTED,
            started_at=dt.datetime.now(tz=dt.timezone.utc),
            questions=[
                Question(
                    text="Как называется та таинственная аудитория?",
                    question_type=QuestionType.TEXT,
                    correct=["501ю"],
                ),
            ],
        )

    async def update_task(self, team_id: int, task: TaskUpdate) -> Task:
        return Task(
            id=1,
            title="Найти таинственную аудиторию",
            desc="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim aeque doleamus animo, cum corpore dolemus, fieri tamen permagna.",
            explanation="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magnam aliquam quaerat voluptatem.",
            max_score=1,
            manual_review=False,
            status=TaskStatus.STARTED,
            started_at=dt.datetime.now(tz=dt.timezone.utc),
            questions=[
                Question(
                    text="Как называется та таинственная аудитория?",
                    question_type=QuestionType.TEXT,
                    correct=["501ю"],
                ),
            ],
        )
