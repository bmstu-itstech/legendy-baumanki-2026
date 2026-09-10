from sqladmin import ModelView
from sqladmin.authentication import AuthenticationBackend
from src.auth.domain.exceptions import UserNotFound
from src.auth.infra.db.orm import UserModel
from src.auth.infra.db.uow import PGUserUnitOfWork
from src.core.domain.interfaces.password_hasher import IPasswordHasher
from src.core.infra.services.bcrypt_password_hasher import BcryptPasswordHasher
from starlette.requests import Request

SESSION_USER_KEY = "admin_user_id"


class AdminAuth(AuthenticationBackend):
    """
    Бэкенд авторизации админки sqladmin.

    Пускает только пользователей с `is_superuser=True`, используя те же
    email/пароль, что и для обычного логина через API.
    """

    def __init__(self, secret_key: str, pwd_hasher: IPasswordHasher | None = None):
        super().__init__(secret_key=secret_key)
        self.pwd_hasher = pwd_hasher or BcryptPasswordHasher()

    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")
        if not email or not password:
            return False

        async with PGUserUnitOfWork() as uow:
            try:
                user = await uow.users.get_by_email(email)
            except UserNotFound:
                return False

        if not user.is_superuser or not self.pwd_hasher.verify(password, user.passhash):
            return False

        request.session[SESSION_USER_KEY] = user.id
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        user_id = request.session.get(SESSION_USER_KEY)
        if user_id is None:
            return False

        async with PGUserUnitOfWork() as uow:
            try:
                user = await uow.users.get_by_id(user_id)
            except UserNotFound:
                return False

        return user.is_superuser


class UserAdmin(ModelView, model=UserModel):
    column_list = (
        UserModel.id,
        UserModel.email,
        UserModel.is_superuser,
        UserModel.created_at,
        UserModel.updated_at,
    )
    column_sortable_list = (
        UserModel.id,
        UserModel.email,
        UserModel.is_superuser,
        UserModel.created_at,
        UserModel.updated_at,
    )
    column_searchable_list = (
        UserModel.id,
        UserModel.email,
    )
