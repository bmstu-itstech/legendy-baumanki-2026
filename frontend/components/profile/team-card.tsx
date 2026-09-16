"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Field, inputClass } from "@/components/ui/form-fields";
import { CopyIcon, GroupFilledIcon, LogoutIcon, PencilIcon } from "@/components/ui/icons";
import { useProfileStore } from "@/lib/store/profile-store";
import { useTeamStore } from "@/lib/store/team-store";

import { TeamEditModal } from "./team-edit-modal";

const TEAM_MIN_SIZE = 5;
const TEAM_CAPACITY = 8;

function CreateOrJoinTeam() {
  const create = useTeamStore((state) => state.create);
  const join = useTeamStore((state) => state.join);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        await create({ name: value });
      } else {
        await join(value);
      }
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось выполнить действие");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 max-w-[440px] flex-col rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9 xl:max-w-[468px]">
      <h2 className="text-[1.375rem] font-bold uppercase text-ink sm:text-[1.625rem]">
        Моя команда
      </h2>

      <p className="mt-3 text-[1rem] text-ink/70">
        У вас пока нет команды — создайте свою или вступите по коду.
      </p>

      <p className="mt-1 text-[1rem] text-ink/60">
        Размер команды должен быть от {TEAM_MIN_SIZE} до {TEAM_CAPACITY} человек.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 cursor-pointer rounded-[10px] border-2 px-3 py-2 text-[1rem] font-bold uppercase transition-colors ${
            mode === "create" ? "border-ink bg-ink text-white" : "border-ink/20 text-ink"
          }`}
        >
          Создать
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 cursor-pointer rounded-[10px] border-2 px-3 py-2 text-[1rem] font-bold uppercase transition-colors ${
            mode === "join" ? "border-ink bg-ink text-white" : "border-ink/20 text-ink"
          }`}
        >
          Вступить по коду
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <Field>
          <GroupFilledIcon className="h-5 w-auto shrink-0 text-ink" />
          <input
            type="text"
            required
            aria-label={mode === "create" ? "Название команды" : "Код команды"}
            placeholder={mode === "create" ? "Название команды" : "Код команды"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-[1rem] text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 cursor-pointer rounded-[14px] bg-ink font-hand text-[1.125rem] uppercase text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Секунду…" : mode === "create" ? "Создать команду" : "Вступить"}
        </button>
      </form>
    </div>
  );
}

export function TeamCard() {
  const team = useTeamStore((state) => state.team);
  const status = useTeamStore((state) => state.status);
  const error = useTeamStore((state) => state.error);
  const fetchMine = useTeamStore((state) => state.fetchMine);
  const rename = useTeamStore((state) => state.rename);
  const leave = useTeamStore((state) => state.leave);
  const currentUserId = useProfileStore((state) => state.profile?.userId);

  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex w-full min-w-0 max-w-[440px] flex-col rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9 xl:max-w-[468px]">
        <p className="text-[1rem] text-ink/70">Загружаем команду…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex w-full min-w-0 max-w-[440px] flex-col rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9 xl:max-w-[468px]">
        <p role="alert" className="text-[1rem] text-error">
          {error ?? "Не удалось загрузить команду"}
        </p>
      </div>
    );
  }

  if (status === "none" || !team) {
    return <CreateOrJoinTeam />;
  }

  const isCaptain = currentUserId != null && currentUserId === team.leader.userId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(team.publicCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен — молча игнорируем.
    }
  };

  const handleRename = async (name: string) => {
    await rename({ name });
  };

  const handleLeave = async () => {
    setActionError(null);
    setLeaving(true);
    try {
      await leave();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось выйти из команды");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 max-w-[440px] flex-col rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9 xl:max-w-[468px]">
      <h2 className="text-[1.375rem] font-bold uppercase text-ink sm:text-[1.625rem]">
        Моя команда
      </h2>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist">
          <GroupFilledIcon className="h-5 w-auto text-ink" />
        </div>
        <span className="text-[1.125rem] font-bold text-ink">{team.name}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[1rem] text-ink">
        <span>Код команды:</span>
        <span className="inline-flex items-center gap-2 rounded-[7px] border border-ink px-2.5 py-1">
          {team.publicCode}
          <span className="h-4 w-px bg-ink/30" aria-hidden="true" />
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Скопировать код команды"
            className="flex size-4 shrink-0 cursor-pointer items-center justify-center text-ink transition-opacity hover:opacity-70"
          >
            <CopyIcon className="h-full w-auto" />
          </button>
        </span>
        {copied && <span className="text-[1rem] text-accent">Скопировано!</span>}
      </div>

      <p className="mt-2 text-[1rem] text-ink/60">
        Поделитесь кодом — новый участник вступает по нему в профиле или по ссылке-приглашению.
      </p>

      <hr className="mt-5 border-ink/15" />

      <p className="mt-4 text-[1.125rem] text-ink">
        Состав команды ({team.members.length}/{TEAM_CAPACITY})
      </p>

      <p className="mt-1 text-[1rem] text-ink/60">
        Размер команды должен быть от {TEAM_MIN_SIZE} до {TEAM_CAPACITY} человек.
      </p>

      {team.members.length < TEAM_MIN_SIZE && (
        <p role="alert" className="mt-2 text-[1rem] text-error">
          Для участия в основном этапе необходимо {TEAM_MIN_SIZE} человек в команде.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {team.members.map((member) => {
          const memberIsCaptain = member.userId === team.leader.userId;
          return (
            <div
              key={member.userId}
              className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 ${
                memberIsCaptain ? "border border-ink" : ""
              }`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist">
                <GroupFilledIcon className="h-5 w-auto text-muted" />
              </div>
              <span className="text-[1rem] text-ink">{member.fullName}</span>
              {memberIsCaptain && (
                <span className="ml-auto shrink-0 rounded-[7px] border border-ink px-2 py-0.5 text-[1rem] font-bold uppercase text-ink">
                  Капитан
                </span>
              )}
            </div>
          );
        })}
      </div>

      {actionError && (
        <p role="alert" className="mt-3 text-[1rem] text-error">
          {actionError}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {isCaptain && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-ink px-3 text-[1rem] text-white transition-transform hover:scale-[1.01]"
          >
            <PencilIcon className="size-4 shrink-0" />
            Редактировать команду
          </button>
        )}
        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-ink px-3 text-[1rem] text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogoutIcon className="size-4 shrink-0" />
          {leaving ? "Выходим…" : "Выйти из команды"}
        </button>
      </div>

      {isCaptain && (
        <TeamEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          teamName={team.name}
          onRenameTeam={handleRename}
        />
      )}
    </div>
  );
}
