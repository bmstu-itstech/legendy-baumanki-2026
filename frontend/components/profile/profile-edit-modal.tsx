"use client";

import { useState, type FormEvent } from "react";

import { Field, GroupIcon, MailIcon, TelegramIcon, UserIcon, inputClass } from "@/components/ui/form-fields";
import { Modal } from "@/components/ui/modal";

export type ProfileFormData = {
  name: string;
  group: string;
  telegram: string;
};

const iconClass = "h-5 w-auto shrink-0 text-ink sm:h-6";

export function ProfileEditModal({
  open,
  onClose,
  initialData,
  email,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialData: ProfileFormData;
  /** Email нельзя изменить через API — показываем только для справки. */
  email: string;
  onSave: (data: ProfileFormData) => void | Promise<void>;
}) {
  // Компонент монтируется заново при каждом открытии (см. key в
  // ProfileCard), поэтому черновик всегда стартует с сохранённых данных —
  // «Отмена» просто закрывает модалку, не оставляя следов правок.
  const [draft, setDraft] = useState(initialData);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSave(draft);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать профиль">
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <Field>
          <UserIcon className={iconClass} />
          <input
            name="fullName"
            type="text"
            autoComplete="name"
            aria-label="ФИО"
            placeholder="ФИО"
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field>
          <GroupIcon className={iconClass} />
          <input
            name="studyGroup"
            type="text"
            autoComplete="off"
            aria-label="Учебная группа"
            placeholder="Учебная группа"
            required
            value={draft.group}
            onChange={(event) => setDraft({ ...draft, group: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field>
          <TelegramIcon className={iconClass} />
          <input
            name="telegram"
            type="text"
            autoComplete="off"
            aria-label="Телеграм"
            placeholder="Телеграм"
            required
            value={draft.telegram}
            onChange={(event) => setDraft({ ...draft, telegram: event.target.value })}
            className={inputClass}
          />
        </Field>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] text-ink/70">
            Почта (нельзя изменить)
          </span>
          <Field>
            <MailIcon className={`${iconClass} text-ink/40`} />
            <input
              type="email"
              aria-label="Почта"
              disabled
              value={email}
              className={`${inputClass} cursor-not-allowed text-ink/50`}
            />
          </Field>
        </label>

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
