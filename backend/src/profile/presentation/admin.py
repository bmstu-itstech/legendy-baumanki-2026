from sqladmin import ModelView
from src.profile.infra.db.orm import ProfileModel, TeamModel


class ProfileAdmin(ModelView, model=ProfileModel):
    column_list = (
        ProfileModel.user_id,
        ProfileModel.full_name,
        ProfileModel.group,
        ProfileModel.telegram,
        ProfileModel.team,
        ProfileModel.updated_at,
    )
    column_sortable_list = (
        ProfileModel.user_id,
        ProfileModel.full_name,
        ProfileModel.group,
        ProfileModel.telegram,
        ProfileModel.team,
        ProfileModel.updated_at,
    )
    column_searchable_list = (
        ProfileModel.user_id,
        ProfileModel.full_name,
        ProfileModel.group,
        ProfileModel.telegram,
    )


class TeamAdmin(ModelView, model=TeamModel):
    column_list = (
        TeamModel.id,
        TeamModel.public_code,
        TeamModel.name,
        TeamModel.leader,
        TeamModel.created_at,
        TeamModel.updated_at,
    )
    column_sortable_list = (
        TeamModel.id,
        TeamModel.public_code,
        TeamModel.name,
        TeamModel.leader,
        TeamModel.created_at,
        TeamModel.updated_at,
    )
    column_searchable_list = (
        TeamModel.id,
        TeamModel.public_code,
        TeamModel.name,
    )
