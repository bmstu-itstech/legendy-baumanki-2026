import { API_BASE_URL } from "@/lib/env";

import { apiFetch } from "./client";

type FileUploadedDto = { file_id: number };

/**
 * Загружает файл и возвращает ссылку на его скачивание — именно эту ссылку
 * (а не голый id) кладём в ответ на вопрос с questionType "file": бэкенд для
 * ответов и так ждёт строку (AnswerTaskDTO.answers), заводить отдельный тип
 * ответа под файлы не стали.
 */
export const filesApi = {
  upload: (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<FileUploadedDto>("/files/upload", {
      method: "POST",
      body: formData,
    }).then((dto) => `${API_BASE_URL}/files/${dto.file_id}`);
  },
};
