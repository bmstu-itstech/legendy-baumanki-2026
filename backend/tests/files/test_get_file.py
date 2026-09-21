import datetime as dt

import pytest
from src.core.domain.exceptions.exceptions import NotAuthenticated, PermissionDenied
from src.files.domain.entities import File
from src.files.usecases.get_file import get_file
from tests.files.fakes import (
    FakeFileStorage,
    FakeFileUoW,
    FakeTaskMediaChecker,
    FakeTeamProvider,
)

UPLOADER_ID = 10
FILE_ID = 1


def make_file(content_type: str = "image/jpeg") -> File:
    return File(
        id=FILE_ID,
        filename="photo.jpg",
        content_type=content_type,
        size=123,
        storage_key="abc.jpg",
        uploaded_by=UPLOADER_ID,
        created_at=dt.datetime.now(dt.timezone.utc),
    )


async def call_get_file(
    *,
    requested_by: int | None,
    is_superuser: bool = False,
    file: File | None = None,
    teams: dict[int, int | None] | None = None,
    public_file_ids: set[int] = frozenset(),
):
    return await get_file(
        FILE_ID,
        requested_by,
        is_superuser,
        FakeFileUoW(file or make_file()),
        FakeFileStorage(),
        FakeTeamProvider(teams or {}),
        FakeTaskMediaChecker(public_file_ids),
    )


async def test_anonymous_is_rejected():
    with pytest.raises(NotAuthenticated):
        await call_get_file(requested_by=None)


async def test_owner_can_view_own_file():
    response = await call_get_file(requested_by=UPLOADER_ID)
    assert response.status_code == 200


async def test_superuser_can_view_any_file():
    response = await call_get_file(requested_by=999, is_superuser=True)
    assert response.status_code == 200


async def test_task_media_is_public_to_any_authenticated_user():
    response = await call_get_file(
        requested_by=999,
        teams={999: None},
        public_file_ids={FILE_ID},
    )
    assert response.status_code == 200


async def test_teammate_of_uploader_can_view():
    response = await call_get_file(
        requested_by=20,
        teams={UPLOADER_ID: 7, 20: 7},
    )
    assert response.status_code == 200


async def test_member_of_different_team_is_denied():
    with pytest.raises(PermissionDenied):
        await call_get_file(
            requested_by=20,
            teams={UPLOADER_ID: 7, 20: 8},
        )


async def test_user_without_team_is_denied():
    with pytest.raises(PermissionDenied):
        await call_get_file(
            requested_by=20,
            teams={UPLOADER_ID: 7, 20: None},
        )


async def test_inline_safe_content_type_has_no_content_disposition():
    response = await call_get_file(
        requested_by=UPLOADER_ID, file=make_file(content_type="image/png")
    )
    assert response.filename is None
    assert "content-disposition" not in response.headers


async def test_unsafe_content_type_is_forced_to_attachment():
    response = await call_get_file(
        requested_by=UPLOADER_ID, file=make_file(content_type="text/html")
    )
    assert response.filename == "photo.jpg"
    assert response.headers["content-disposition"].startswith("attachment")


async def test_svg_is_forced_to_attachment_despite_image_prefix():
    # image/svg+xml начинается с "image/", но браузер выполняет встроенный
    # <script> при прямом переходе по ссылке — должен уйти как attachment.
    response = await call_get_file(
        requested_by=UPLOADER_ID, file=make_file(content_type="image/svg+xml")
    )
    assert response.filename == "photo.jpg"
    assert response.headers["content-disposition"].startswith("attachment")
