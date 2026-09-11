"use client";

import { useState, type FormEvent } from "react";

import { Field, inputClass } from "@/components/ui/form-fields";
import { Modal } from "@/components/ui/modal";
import { GroupFilledIcon } from "@/components/ui/icons";

export function TeamEditModal({
  open,
  onClose,
  teamName,
  onRenameTeam,
}: {
  open: boolean;
  onClose: () => void;
  teamName: string;
  onRenameTeam: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(teamName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onRenameTeam(name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось переименовать команду");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать команду">
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] text-ink/70">Название команды</span>
          <Field>
            <GroupFilledIcon className="h-5 w-auto shrink-0 text-ink" />
            <input
              type="text"
              aria-label="Название команды"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </Field>
        </label>

        {error && (
          <p role="alert" className="text-[0.8125rem] text-error">
            {error}
          </p>
        )}

        <p className="text-[0.75rem] text-ink/60">
          Состав команды меняется только через вступление или выход участников по коду — здесь
          можно только переименовать команду.
        </p>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="h-12 flex-1 cursor-pointer rounded-[14px] bg-ink font-hand text-[1.125rem] uppercase text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Сохраняем…" : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 flex-1 cursor-pointer rounded-[14px] border border-ink font-hand text-[1.125rem] uppercase text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  );
}
