import { API_BASE_URL } from "@/lib/env";

import { apiFetch } from "./client";

type FileUploadedDto = { file_id: number };

/** Ссылка на скачивание — по ней и отдаёт файл бэкенд (GET /files/{id}). */
export function fileDownloadUrl(fileId: number): string {
  return `${API_BASE_URL}/files/${fileId}`;
}

export const filesApi = {
  upload: (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<FileUploadedDto>("/files/upload", {
      method: "POST",
      body: formData,
    }).then((dto) => dto.file_id);
  },
};
