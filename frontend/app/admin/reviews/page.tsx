"use client";

import { useEffect, useState } from "react";

import { adminApi, type AdminReviewItem } from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import { DangerButton, Notice, PrimaryButton, panelClass } from "@/components/admin/admin-ui";

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReviewItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await adminApi.listReviews());
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  useEffect(() => {
    adminApi
      .listReviews()
      .then(setItems)
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  async function handleResolve(teamId: number, taskId: number, approve: boolean) {
    const key = `${teamId}-${taskId}`;
    setResolvingKey(key);
    setError(null);
    try {
      await adminApi.resolveReview(teamId, taskId, approve);
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setResolvingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[1.25rem] font-bold uppercase text-ink">Модерация</h1>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {items === null ? (
        <p className="text-ink/70">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className={panelClass}>
          <p className="text-ink/70">Ничего не ждёт проверки.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const key = `${item.teamId}-${item.taskId}`;
            const busy = resolvingKey === key;

            return (
              <div key={key} className={panelClass}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{item.teamName}</p>
                    <p className="text-[0.875rem] text-ink/60">
                      {item.moduleTitle} — {item.taskTitle}
                    </p>
                  </div>
                  {item.startedAt ? (
                    <p className="text-[0.8125rem] text-ink/50">
                      начато {new Date(item.startedAt).toLocaleString("ru-RU")}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3">
                  {item.answers.map((a) => (
                    <div key={a.questionNumber}>
                      <p className="text-[0.8125rem] font-bold uppercase text-ink/60">
                        {a.questionText}
                      </p>
                      <p className="text-[0.9375rem] break-words text-ink">{a.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <PrimaryButton
                    disabled={busy}
                    onClick={() => handleResolve(item.teamId, item.taskId, true)}
                  >
                    {busy ? "Сохраняем…" : "Зачесть"}
                  </PrimaryButton>
                  <DangerButton
                    disabled={busy}
                    onClick={() => handleResolve(item.teamId, item.taskId, false)}
                  >
                    Отклонить
                  </DangerButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
