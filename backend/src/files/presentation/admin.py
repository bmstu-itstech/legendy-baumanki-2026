from sqladmin import ModelView
from src.files.infra.db.orm import FileModel


class FileAdmin(ModelView, model=FileModel):
    column_list = (
        FileModel.id,
        FileModel.filename,
        FileModel.content_type,
        FileModel.size,
        FileModel.uploaded_by,
        FileModel.created_at,
    )
    column_sortable_list = (FileModel.id, FileModel.created_at)
    column_searchable_list = (FileModel.filename,)
