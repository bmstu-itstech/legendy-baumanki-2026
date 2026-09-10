from sqladmin import ModelView
from src.auth.infra.db.orm import UserModel


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
