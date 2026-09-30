import logging

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.tasks.domain.admin_dtos import (
    AdminQuestionDTO,
    AdminTaskDTO,
    AdminTaskUpsertDTO,
)
from src.tasks.domain.entities import QuestionType
from src.tasks.domain.interfaces.admin_repo import IAdminContentRepository
from src.tasks.domain.interfaces.admin_uow import IAdminContentUnitOfWork
from src.tasks.presentation.admin_api import admin_content_api_router
from src.tasks.presentation.admin_dependencies import get_admin_content_uow

ACTOR_ID = 3
TASK_ID = 19
SECRET_ANSWER = "correct-answer-17"


class _FakeUser:
    id = ACTOR_ID
    is_superuser = True


def _task(max_score: int, answers: list[str]) -> AdminTaskDTO:
    return AdminTaskDTO(
        id=TASK_ID,
        module_id=1,
        number=5,
        section_number=None,
        title="Диспетчерская",
        desc="desc",
        explanation="",
        max_score=max_score,
        manual_review=False,
        require_task_id=None,
        questions=[
            AdminQuestionDTO(
                number=1,
                text="q",
                question_type=QuestionType.TEXT,
                regex=None,
                supported_ext=[],
                answers=answers,
            )
        ],
        media=[],
    )


class FakeAdminContentRepository(IAdminContentRepository):
    def __init__(self, task: AdminTaskDTO):
        self.task = task

    async def get_task(self, task_id: int) -> AdminTaskDTO:
        return self.task

    async def update_task(self, task_id: int, data: AdminTaskUpsertDTO) -> AdminTaskDTO:
        self.task = _task(data.max_score, data.questions[0].answers)
        return self.task

    async def delete_task(self, task_id: int) -> None:
        pass

    async def list_modules(self):
        raise NotImplementedError

    async def create_module(self, data):
        raise NotImplementedError

    async def update_module(self, module_id, data):
        raise NotImplementedError

    async def delete_module(self, module_id):
        raise NotImplementedError

    async def get_module_content(self, module_id):
        raise NotImplementedError

    async def create_section(self, module_id, data):
        raise NotImplementedError

    async def update_section(self, module_id, number, data):
        raise NotImplementedError

    async def delete_section(self, module_id, number):
        raise NotImplementedError

    async def create_task(self, data):
        raise NotImplementedError

    async def list_pending_reviews(self):
        raise NotImplementedError


class FakeAdminContentUoW(IAdminContentUnitOfWork):
    def __init__(self, repo: FakeAdminContentRepository):
        self.content = repo

    async def rollback(self) -> None:
        pass

    async def _commit(self) -> None:
        pass


@pytest.fixture
def client() -> TestClient:
    repo = FakeAdminContentRepository(_task(3000, [SECRET_ANSWER]))
    app = FastAPI()

    @app.middleware("http")
    async def inject_user(request, call_next):
        request.state.user = _FakeUser()
        return await call_next(request)

    app.include_router(admin_content_api_router, prefix="/admin/content")
    app.dependency_overrides[get_admin_content_uow] = lambda: FakeAdminContentUoW(
        repo
    )
    return TestClient(app)


def _body(max_score: int, answers: list[str]) -> dict:
    return {
        "module_id": 1,
        "section_number": None,
        "title": "Диспетчерская",
        "desc": "desc",
        "max_score": max_score,
        "questions": [{"text": "q", "answers": answers}],
    }


def test_update_task_logs_actor_and_max_score_change(client, caplog):
    caplog.set_level(logging.INFO, logger="admin")

    response = client.patch(
        f"/admin/content/tasks/{TASK_ID}", json=_body(1, ["new-answer"])
    )

    assert response.status_code == 200
    [record] = [r for r in caplog.records if r.name == "admin"]
    message = record.getMessage()
    assert message.startswith(f"update_task actor_id={ACTOR_ID} ")
    assert "'max_score': {'from': 3000, 'to': 1}" in message
    assert "'questions': 'changed'" in message
    assert "'title'" not in message  # не менялся — в diff не попадает
    assert SECRET_ANSWER not in message
    assert "new-answer" not in message


def test_delete_task_logs_snapshot_without_answers(client, caplog):
    caplog.set_level(logging.INFO, logger="admin")

    response = client.delete(f"/admin/content/tasks/{TASK_ID}")

    assert response.status_code == 204
    [record] = [r for r in caplog.records if r.name == "admin"]
    message = record.getMessage()
    assert message.startswith(f"delete_task actor_id={ACTOR_ID} ")
    assert "'max_score': 3000" in message
    assert SECRET_ANSWER not in message
