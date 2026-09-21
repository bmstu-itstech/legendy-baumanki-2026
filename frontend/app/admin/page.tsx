"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { adminApi, type AdminModule } from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import { Field, Notice, PrimaryButton, TextInput, panelClass } from "@/components/admin/admin-ui";

export default function AdminModulesPage() {
  const [modules, setModules] = useState<AdminModule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setModules(await adminApi.listModules());
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }

  useEffect(() => {
    adminApi
      .listModules()
      .then(setModules)
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !openAt) return;

    setCreating(true);
    setError(null);
    try {
      await adminApi.createModule({ title: title.trim(), openAt: new Date(openAt).toISOString() });
      setTitle("");
      setOpenAt("");
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={panelClass}>
        <h1 className="text-[1.25rem] font-bold uppercase text-ink">Модули</h1>

        {modules === null ? (
          <p className="mt-4 text-ink/70">Загрузка…</p>
        ) : modules.length === 0 ? (
          <p className="mt-4 text-ink/70">Модулей пока нет — создайте первый ниже.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {modules.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/modules/${m.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border-2 border-secondary/15 px-4 py-3 transition-colors hover:border-secondary"
                >
                  <span className="font-bold text-ink">{m.title}</span>
                  <span className="text-[0.875rem] text-ink/60">
                    открытие {new Date(m.openAt).toLocaleString("ru-RU")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={panelClass}>
        <h2 className="text-[1.0625rem] font-bold uppercase text-ink">Новый модуль</h2>
        <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Название" htmlFor="new-module-title">
              <TextInput
                id="new-module-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Мужество"
                required
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Открытие" htmlFor="new-module-open-at">
              <TextInput
                id="new-module-open-at"
                type="datetime-local"
                value={openAt}
                onChange={(event) => setOpenAt(event.target.value)}
                required
              />
            </Field>
          </div>
          <PrimaryButton type="submit" disabled={creating}>
            {creating ? "Создаём…" : "Создать"}
          </PrimaryButton>
        </form>

        {error ? (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}
      </div>
    </div>
  );
}
