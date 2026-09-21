import datetime as dt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.profile.infra.db.orm import TeamModel
from src.tasks.domain.dtos import (
    RatingCell,
    RatingColumnDTO,
    RatingDetailDTO,
    RatingDTO,
    RatingRow,
)
from src.tasks.domain.entities import (
    Media,
    Module,
    ModuleDetails,
    Question,
    QuestionUpdate,
    Section,
    Task,
    TaskStatus,
    TaskUpdate,
)
from src.tasks.domain.exceptions import ModuleNotFound, RatingNotFound, TaskNotFound
from src.tasks.domain.interfaces.task_repo import ITaskRepository
from src.tasks.infra.db.orm import (
    ModuleModel,
    StateModel,
    TaskModel,
    TaskQuestionModel,
    TeamAnswerModel,
)

SIDE_RATING_ID = 0
SIDE_RATING_TITLE = "Побочные задания"


class PGTaskRepository(ITaskRepository):
    def __init__(self, session: AsyncSession):
        super().__init__()
        self.session = session

    async def get_all(self, team_id: int) -> list[Module]:
        stmt = select(ModuleModel).order_by(ModuleModel.id)
        modules = (await self.session.execute(stmt)).scalars().all()
        states = await self._states_for_team(team_id)
        result = []
        for m in modules:
            score, max_score = self._module_totals(m.tasks, states)
            result.append(
                Module(
                    id=m.id,
                    title=m.title,
                    open_at=m.open_at,
                    score=score,
                    max_score=max_score,
                )
            )
        return result

    async def get_by_id(self, team_id: int, module_id: int) -> ModuleDetails:
        stmt = select(ModuleModel).where(ModuleModel.id == module_id)
        m = (await self.session.execute(stmt)).scalar_one_or_none()
        if m is None:
            raise ModuleNotFound(detail=f"Module with id {module_id} not found")

        states = await self._states_for_team(team_id)
        answers = await self._answers_for_team(team_id, [t.id for t in m.tasks])
        now = dt.datetime.now(tz=dt.UTC)

        sections = [
            Section(
                title=s.title,
                tasks=[
                    self._build_task(t, states, answers, m.open_at, now)
                    for t in m.tasks
                    if t.section_number == s.number
                ],
            )
            for s in m.sections
        ]
        auxiliary_tasks = [
            self._build_task(t, states, answers, m.open_at, now)
            for t in m.tasks
            if t.section_number is None
        ]
        score, max_score = self._module_totals(m.tasks, states)
        return ModuleDetails(
            id=m.id,
            title=m.title,
            open_at=m.open_at,
            score=score,
            max_score=max_score,
            sections=sections,
            auxiliary_tasks=auxiliary_tasks,
        )

    async def get_task_by_id(self, team_id: int, task_id: int) -> Task:
        stmt = select(TaskModel).where(TaskModel.id == task_id)
        tm = (await self.session.execute(stmt)).scalar_one_or_none()
        if tm is None:
            raise TaskNotFound(detail=f"Task with id {task_id} not found")

        states = await self._states_for_team(team_id)
        answers = await self._answers_for_team(team_id, [task_id])
        now = dt.datetime.now(tz=dt.UTC)
        return self._build_task(tm, states, answers, tm.module.open_at, now)

    async def update_task(self, team_id: int, task: TaskUpdate) -> Task:
        stmt = select(StateModel).where(
            StateModel.team_id == team_id, StateModel.task_id == task.task_id
        )
        state = (await self.session.execute(stmt)).scalar_one_or_none()
        if state is None:
            state = StateModel(
                team_id=team_id, task_id=task.task_id, status=task.status
            )
            self.session.add(state)
        else:
            state.status = task.status
        if task.score is not None:
            state.score = task.score
        if task.started_at is not None:
            state.started_at = task.started_at
        if task.completed_at is not None:
            state.completed_at = task.completed_at
        await self.session.flush()

        if task.questions is not None:
            await self._save_answers(team_id, task.task_id, task.questions)

        return await self.get_task_by_id(team_id, task.task_id)

    async def get_ratings(self) -> list[RatingDTO]:
        stmt = select(ModuleModel).order_by(ModuleModel.id)
        modules = (await self.session.execute(stmt)).scalars().all()
        ratings = [RatingDTO(id=m.id, module_id=m.id, title=m.title) for m in modules]
        ratings.append(
            RatingDTO(id=SIDE_RATING_ID, module_id=None, title=SIDE_RATING_TITLE)
        )
        return ratings

    async def get_rating(self, rating_id: int) -> RatingDetailDTO:
        if rating_id == SIDE_RATING_ID:
            stmt = (
                select(TaskModel)
                .where(TaskModel.section_number.is_(None))
                .order_by(TaskModel.module_id, TaskModel.number)
            )
            title = SIDE_RATING_TITLE
            module_id = None
        else:
            module_stmt = select(ModuleModel).where(ModuleModel.id == rating_id)
            module = (await self.session.execute(module_stmt)).scalar_one_or_none()
            if module is None:
                raise RatingNotFound(detail=f"Rating with id {rating_id} not found")
            stmt = (
                select(TaskModel)
                .where(TaskModel.module_id == rating_id)
                .order_by(TaskModel.number)
            )
            title = module.title
            module_id = module.id

        tasks = (await self.session.execute(stmt)).scalars().all()
        columns = [
            RatingColumnDTO(task_id=t.id, index=i, title=t.title, max_score=t.max_score)
            for i, t in enumerate(tasks, start=1)
        ]
        if not tasks:
            return RatingDetailDTO(
                id=rating_id, module_id=module_id, title=title, columns=[], rows=[]
            )

        task_ids = [t.id for t in tasks]
        states_stmt = select(StateModel).where(StateModel.task_id.in_(task_ids))
        states = (await self.session.execute(states_stmt)).scalars().all()

        by_team: dict[int, dict[int, StateModel]] = {}
        for st in states:
            by_team.setdefault(st.team_id, {})[st.task_id] = st

        if not by_team:
            return RatingDetailDTO(
                id=rating_id, module_id=module_id, title=title, columns=columns, rows=[]
            )

        teams_stmt = select(TeamModel).where(TeamModel.id.in_(by_team.keys()))
        team_rows = (await self.session.execute(teams_stmt)).scalars().all()
        teams = {t.id: t for t in team_rows}

        rows = [
            self._build_rating_row(team_id, team_states, tasks, teams)
            for team_id, team_states in by_team.items()
        ]
        rows.sort(key=lambda r: (-r.total_score, r.total_time))
        for position, row in enumerate(rows, start=1):
            row.position = position

        return RatingDetailDTO(
            id=rating_id, module_id=module_id, title=title, columns=columns, rows=rows
        )

    @staticmethod
    def _build_rating_row(
        team_id: int,
        team_states: dict[int, StateModel],
        tasks: list[TaskModel],
        teams: dict[int, TeamModel],
    ) -> RatingRow:
        cells = []
        total_score = 0
        total_time = 0
        for t in tasks:
            s = team_states.get(t.id)
            score = s.score or 0 if s else 0
            time = (
                int((s.completed_at - s.started_at).total_seconds())
                if s and s.completed_at and s.started_at
                else 0
            )
            cells.append(RatingCell(task_id=t.id, score=score, time=time))
            total_score += score
            total_time += time
        team = teams.get(team_id)
        return RatingRow(
            position=0,
            team_id=team_id,
            team_name=team.name if team else "",
            cells=cells,
            total_score=total_score,
            total_time=total_time,
        )

    async def _save_answers(
        self, team_id: int, task_id: int, questions: list[QuestionUpdate]
    ) -> None:
        stmt = (
            select(TaskQuestionModel)
            .where(TaskQuestionModel.task_id == task_id)
            .order_by(TaskQuestionModel.number)
        )
        question_models = (await self.session.execute(stmt)).scalars().all()
        for qm, update in zip(question_models, questions):
            if update.last_answer is None:
                continue
            stmt = select(TeamAnswerModel).where(
                TeamAnswerModel.team_id == team_id,
                TeamAnswerModel.task_id == task_id,
                TeamAnswerModel.question_number == qm.number,
            )
            answer = (await self.session.execute(stmt)).scalar_one_or_none()
            if answer is None:
                self.session.add(
                    TeamAnswerModel(
                        team_id=team_id,
                        task_id=task_id,
                        question_number=qm.number,
                        text=update.last_answer,
                    )
                )
            else:
                answer.text = update.last_answer
        await self.session.flush()

    async def _states_for_team(self, team_id: int) -> dict[int, StateModel]:
        stmt = select(StateModel).where(StateModel.team_id == team_id)
        rows = (await self.session.execute(stmt)).scalars().all()
        return {r.task_id: r for r in rows}

    async def _answers_for_team(
        self, team_id: int, task_ids: list[int]
    ) -> dict[tuple[int, int], str]:
        if not task_ids:
            return {}
        stmt = select(TeamAnswerModel).where(
            TeamAnswerModel.team_id == team_id,
            TeamAnswerModel.task_id.in_(task_ids),
        )
        rows = (await self.session.execute(stmt)).scalars().all()
        return {(r.task_id, r.question_number): r.text for r in rows}

    @staticmethod
    def _module_totals(
        tasks: list[TaskModel], states: dict[int, StateModel]
    ) -> tuple[int, int]:
        max_score = sum(t.max_score for t in tasks)
        score = sum(
            states[t.id].score or 0 for t in tasks if states.get(t.id) is not None
        )
        return score, max_score

    @staticmethod
    def _build_task(
        tm: TaskModel,
        states: dict[int, StateModel],
        answers: dict[tuple[int, int], str],
        module_open_at: dt.datetime,
        now: dt.datetime,
    ) -> Task:
        state = states.get(tm.id)
        if state is not None:
            status = state.status
            score = state.score
            started_at = state.started_at
            completed_at = state.completed_at
        else:
            status = PGTaskRepository._default_status(tm, states, module_open_at, now)
            score = None
            started_at = None
            completed_at = None

        questions = [
            Question(
                text=q.text,
                question_type=q.question_type,
                regex=q.regex,
                supported_ext=q.supported_exts,
                correct=[a.text for a in q.answers],
                last_answer=answers.get((tm.id, q.number)),
            )
            for q in tm.questions
        ]
        media = [Media(file_id=m.file_id, media_type=m.media_type) for m in tm.media]

        return Task(
            id=tm.id,
            title=tm.title,
            desc=tm.desc,
            explanation=tm.explanation,
            max_score=tm.max_score,
            manual_review=tm.manual_review,
            require_task=tm.require_task_id,
            status=status,
            score=score,
            started_at=started_at,
            completed_at=completed_at,
            questions=questions,
            media=media,
        )

    @staticmethod
    def _default_status(
        tm: TaskModel,
        states: dict[int, StateModel],
        module_open_at: dt.datetime,
        now: dt.datetime,
    ) -> TaskStatus:
        if module_open_at > now:
            return TaskStatus.CLOSED
        if tm.require_task_id is not None:
            prereq = states.get(tm.require_task_id)
            # REVIEW считаем достаточным для разблокировки следующего задания —
            # команда уже сдала предыдущее и не должна простаивать, пока
            # модератор его проверяет (иногда это не быстро). Если ручную
            # проверку в итоге отклонят (FAILED), команда всё равно продолжит
            # идти по цепочке — это осознанный компромисс, не откатываем назад.
            allowed = (TaskStatus.COMPLETED, TaskStatus.REVIEW)
            if prereq is None or prereq.status not in allowed:
                return TaskStatus.CLOSED
        return TaskStatus.OPENED
