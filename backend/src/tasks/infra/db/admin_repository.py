from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from src.profile.infra.db.orm import TeamModel
from src.tasks.domain.admin_dtos import (
    AdminMediaDTO,
    AdminMediaUpsertDTO,
    AdminModuleContentDTO,
    AdminModuleDTO,
    AdminModuleUpsertDTO,
    AdminQuestionDTO,
    AdminQuestionUpsertDTO,
    AdminReviewAnswerDTO,
    AdminReviewItemDTO,
    AdminSectionDTO,
    AdminSectionUpsertDTO,
    AdminTaskDTO,
    AdminTaskUpsertDTO,
)
from src.tasks.domain.entities import TaskStatus
from src.tasks.domain.exceptions import (
    ContentIntegrityError,
    ModuleNotFound,
    SectionNotFound,
    TaskNotFound,
)
from src.tasks.domain.interfaces.admin_repo import IAdminContentRepository
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


class PGAdminContentRepository(IAdminContentRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def list_modules(self) -> list[AdminModuleDTO]:
        stmt = select(ModuleModel).order_by(ModuleModel.id)
        modules = (await self.session.execute(stmt)).scalars().all()
        return [
            AdminModuleDTO(id=m.id, title=m.title, open_at=m.open_at) for m in modules
        ]

    async def create_module(self, data: AdminModuleUpsertDTO) -> AdminModuleDTO:
        m = ModuleModel(title=data.title, open_at=data.open_at)
        self.session.add(m)
        await self._flush_checked()
        return AdminModuleDTO(id=m.id, title=m.title, open_at=m.open_at)

    async def update_module(
        self, module_id: int, data: AdminModuleUpsertDTO
    ) -> AdminModuleDTO:
        m = await self._get_module_or_404(module_id)
        m.title = data.title
        m.open_at = data.open_at
        await self._flush_checked()
        return AdminModuleDTO(id=m.id, title=m.title, open_at=m.open_at)

    async def delete_module(self, module_id: int) -> None:
        m = await self._get_module_or_404(module_id)
        await self.session.delete(m)
        await self._flush_checked()

    async def get_module_content(self, module_id: int) -> AdminModuleContentDTO:
        m = await self._get_module_or_404(module_id)
        return AdminModuleContentDTO(
            module=AdminModuleDTO(id=m.id, title=m.title, open_at=m.open_at),
            sections=[
                AdminSectionDTO(module_id=m.id, number=s.number, title=s.title)
                for s in m.sections
            ],
            tasks=[self._to_admin_task(t) for t in m.tasks],
        )

    async def create_section(
        self, module_id: int, data: AdminSectionUpsertDTO
    ) -> AdminSectionDTO:
        await self._get_module_or_404(module_id)
        number = await self._next_number(
            SectionModel.number, SectionModel.module_id, module_id
        )
        s = SectionModel(module_id=module_id, number=number, title=data.title)
        self.session.add(s)
        await self._flush_checked()
        return AdminSectionDTO(module_id=module_id, number=s.number, title=s.title)

    async def update_section(
        self, module_id: int, number: int, data: AdminSectionUpsertDTO
    ) -> AdminSectionDTO:
        s = await self._get_section_or_404(module_id, number)
        s.title = data.title
        await self._flush_checked()
        return AdminSectionDTO(module_id=module_id, number=number, title=s.title)

    async def delete_section(self, module_id: int, number: int) -> None:
        s = await self._get_section_or_404(module_id, number)
        await self.session.delete(s)
        await self._flush_checked()

    async def get_task(self, task_id: int) -> AdminTaskDTO:
        tm = await self._get_task_or_404(task_id)
        return self._to_admin_task(tm)

    async def create_task(self, data: AdminTaskUpsertDTO) -> AdminTaskDTO:
        await self._get_module_or_404(data.module_id)
        number = await self._next_number(
            TaskModel.number, TaskModel.module_id, data.module_id
        )

        tm = TaskModel(
            module_id=data.module_id,
            number=number,
            section_number=data.section_number,
            title=data.title,
            desc=data.desc,
            explanation=data.explanation,
            max_score=data.max_score,
            manual_review=data.manual_review,
            require_task_id=data.require_task_id,
        )
        self.session.add(tm)
        await self._flush_checked()

        await self._sync_questions(tm.id, data.questions)
        await self._sync_media(tm.id, data.media)
        await self.session.refresh(tm, attribute_names=["questions", "media"])
        return self._to_admin_task(tm)

    async def update_task(self, task_id: int, data: AdminTaskUpsertDTO) -> AdminTaskDTO:
        tm = await self._get_task_or_404(task_id)
        tm.module_id = data.module_id
        tm.section_number = data.section_number
        tm.title = data.title
        tm.desc = data.desc
        tm.explanation = data.explanation
        tm.max_score = data.max_score
        tm.manual_review = data.manual_review
        tm.require_task_id = data.require_task_id
        await self._flush_checked()

        await self._sync_questions(tm.id, data.questions)
        await self._sync_media(tm.id, data.media)
        await self.session.refresh(tm, attribute_names=["questions", "media"])
        return self._to_admin_task(tm)

    async def delete_task(self, task_id: int) -> None:
        tm = await self._get_task_or_404(task_id)
        await self.session.delete(tm)
        await self._flush_checked()

    async def list_pending_reviews(self) -> list[AdminReviewItemDTO]:
        stmt = (
            select(StateModel)
            .where(StateModel.status == TaskStatus.REVIEW)
            .order_by(StateModel.started_at)
        )
        states = (await self.session.execute(stmt)).scalars().all()
        if not states:
            return []

        task_ids = {s.task_id for s in states}
        team_ids = {s.team_id for s in states}

        tasks_stmt = select(TaskModel).where(TaskModel.id.in_(task_ids))
        tasks = {
            t.id: t for t in (await self.session.execute(tasks_stmt)).scalars().all()
        }

        teams_stmt = select(TeamModel).where(TeamModel.id.in_(team_ids))
        teams = {
            t.id: t for t in (await self.session.execute(teams_stmt)).scalars().all()
        }

        answers_stmt = select(TeamAnswerModel).where(
            TeamAnswerModel.team_id.in_(team_ids), TeamAnswerModel.task_id.in_(task_ids)
        )
        answers_by_key: dict[tuple[int, int], list[TeamAnswerModel]] = {}
        for a in (await self.session.execute(answers_stmt)).scalars().all():
            answers_by_key.setdefault((a.team_id, a.task_id), []).append(a)

        items = []
        for s in states:
            task = tasks.get(s.task_id)
            team = teams.get(s.team_id)
            if task is None or team is None:
                continue
            questions_by_number = {q.number: q for q in task.questions}
            team_answers = sorted(
                answers_by_key.get((s.team_id, s.task_id), []),
                key=lambda a: a.question_number,
            )
            items.append(
                AdminReviewItemDTO(
                    team_id=s.team_id,
                    team_name=team.name,
                    task_id=task.id,
                    task_title=task.title,
                    module_title=task.module.title,
                    started_at=s.started_at,
                    answers=[
                        AdminReviewAnswerDTO(
                            question_number=a.question_number,
                            question_text=questions_by_number[a.question_number].text
                            if a.question_number in questions_by_number
                            else "",
                            text=a.text,
                        )
                        for a in team_answers
                    ],
                )
            )
        return items

    async def _sync_questions(
        self, task_id: int, items: list[AdminQuestionUpsertDTO]
    ) -> None:
        stmt = (
            select(TaskQuestionModel)
            .where(TaskQuestionModel.task_id == task_id)
            .order_by(TaskQuestionModel.number)
        )
        existing = (await self.session.execute(stmt)).scalars().all()

        for index, item in enumerate(items, start=1):
            if index <= len(existing):
                qm = existing[index - 1]
                qm.text = item.text
                qm.question_type = item.question_type
                qm.regex = item.regex
                qm.supported_exts = item.supported_ext
            else:
                qm = TaskQuestionModel(
                    task_id=task_id,
                    number=index,
                    text=item.text,
                    question_type=item.question_type,
                    regex=item.regex,
                    supported_exts=item.supported_ext,
                )
                self.session.add(qm)
            await self._flush_checked()
            await self._sync_answers(task_id, index, item.answers)

        for extra in existing[len(items) :]:
            await self.session.delete(extra)
        await self._flush_checked()

    async def _sync_answers(
        self, task_id: int, question_number: int, answers: list[str]
    ) -> None:
        await self.session.execute(
            delete(TaskAnswerModel).where(
                TaskAnswerModel.task_id == task_id,
                TaskAnswerModel.question_number == question_number,
            )
        )
        for text in answers:
            self.session.add(
                TaskAnswerModel(
                    task_id=task_id, question_number=question_number, text=text
                )
            )
        await self._flush_checked()

    async def _sync_media(self, task_id: int, items: list[AdminMediaUpsertDTO]) -> None:
        stmt = (
            select(TaskMediaModel)
            .where(TaskMediaModel.task_id == task_id)
            .order_by(TaskMediaModel.number)
        )
        existing = (await self.session.execute(stmt)).scalars().all()

        for index, item in enumerate(items, start=1):
            if index <= len(existing):
                mm = existing[index - 1]
                mm.media_type = item.media_type
                mm.file_id = item.file_id
            else:
                self.session.add(
                    TaskMediaModel(
                        task_id=task_id,
                        number=index,
                        media_type=item.media_type,
                        file_id=item.file_id,
                    )
                )

        for extra in existing[len(items) :]:
            await self.session.delete(extra)
        await self._flush_checked()

    async def _next_number(self, number_col, scope_col, scope_value: int) -> int:
        stmt = select(func.max(number_col)).where(scope_col == scope_value)
        max_number = (await self.session.execute(stmt)).scalar()
        return (max_number or 0) + 1

    async def _get_module_or_404(self, module_id: int) -> ModuleModel:
        stmt = select(ModuleModel).where(ModuleModel.id == module_id)
        m = (await self.session.execute(stmt)).scalar_one_or_none()
        if m is None:
            raise ModuleNotFound(detail=f"Module with id {module_id} not found")
        return m

    async def _get_section_or_404(self, module_id: int, number: int) -> SectionModel:
        stmt = select(SectionModel).where(
            SectionModel.module_id == module_id, SectionModel.number == number
        )
        s = (await self.session.execute(stmt)).scalar_one_or_none()
        if s is None:
            raise SectionNotFound(detail=f"Section {module_id}/{number} not found")
        return s

    async def _get_task_or_404(self, task_id: int) -> TaskModel:
        stmt = select(TaskModel).where(TaskModel.id == task_id)
        tm = (await self.session.execute(stmt)).scalar_one_or_none()
        if tm is None:
            raise TaskNotFound(detail=f"Task with id {task_id} not found")
        return tm

    async def _flush_checked(self) -> None:
        try:
            await self.session.flush()
        except IntegrityError as e:
            try:
                detail = str(e.orig).split("\nDETAIL:  ")[1].strip()
            except IndexError:
                detail = "Нарушена ссылочная целостность данных."
            raise ContentIntegrityError(detail=detail)

    @staticmethod
    def _to_admin_task(tm: TaskModel) -> AdminTaskDTO:
        return AdminTaskDTO(
            id=tm.id,
            module_id=tm.module_id,
            number=tm.number,
            section_number=tm.section_number,
            title=tm.title,
            desc=tm.desc,
            explanation=tm.explanation,
            max_score=tm.max_score,
            manual_review=tm.manual_review,
            require_task_id=tm.require_task_id,
            questions=[
                AdminQuestionDTO(
                    number=q.number,
                    text=q.text,
                    question_type=q.question_type,
                    regex=q.regex,
                    supported_ext=q.supported_exts,
                    answers=[a.text for a in q.answers],
                )
                for q in tm.questions
            ],
            media=[
                AdminMediaDTO(
                    number=m.number, media_type=m.media_type, file_id=m.file_id
                )
                for m in tm.media
            ],
        )
