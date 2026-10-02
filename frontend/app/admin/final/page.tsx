"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  adminApi,
  type AdminFinal,
  type AdminFinalSlot,
  type AdminFinalTeam,
} from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import {
  DangerButton,
  Notice,
  PrimaryButton,
  SecondaryButton,
  TextInput,
  panelClass,
} from "@/components/admin/admin-ui";
import { TeamDetailsModal } from "@/components/admin/team-details-modal";

// Слоты — московское время, независимо от часового пояса браузера.
const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});
const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

function slotTime(slot: AdminFinalSlot) {
  return `${timeFormat.format(new Date(slot.startsAt))}–${timeFormat.format(new Date(slot.endsAt))}`;
}

/** Название команды-ссылка: открывает состав команды с контактами. */
function TeamNameLink({ team, onOpen }: { team: AdminFinalTeam; onOpen: (teamId: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(team.id)}
      className="cursor-pointer text-left font-bold break-words text-secondary underline underline-offset-2 hover:text-ink"
    >
      {team.name}
    </button>
  );
}

/** Размер команды; меньше порога — красным: капитан такую не записал бы сам. */
function TeamSize({ size, minSize }: { size: number; minSize: number }) {
  if (size >= minSize) return <>{size} чел.</>;
  return (
    <span className="font-bold text-error" title={`Капитан может записать команду только от ${minSize} чел.`}>
      {size} чел. &lt; {minSize}
    </span>
  );
}

function teamLabel(team: AdminFinalTeam) {
  return `${team.name} (${team.publicCode})`;
}

/** Ищем по подписи из подсказки или по голому коду команды. */
function findTeam(teams: AdminFinalTeam[], value: string) {
  const query = value.trim();
  const code = query.toUpperCase();
  return teams.find((team) => teamLabel(team) === query || team.publicCode === code);
}

function AddTeamForm({
  slot,
  unbookedTeams,
  busy,
  onAdd,
}: {
  slot: AdminFinalSlot;
  unbookedTeams: AdminFinalTeam[];
  busy: boolean;
  onAdd: (slotId: number, teamId: number) => Promise<boolean>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isFull = slot.booked >= slot.capacity;
  const listId = `final-teams-${slot.id}`;

  if (isFull) {
    return <p className="text-[0.875rem] text-ink/60">Слот заполнен — чтобы добавить команду, сначала уберите другую.</p>;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const team = findTeam(unbookedTeams, value);
    if (!team) {
      setError("Выберите команду из списка или введите её код");
      return;
    }
    setError(null);
    if (await onAdd(slot.id, team.id)) setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          list={listId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            unbookedTeams.length ? "Название или код команды" : "Все команды уже записаны"
          }
          aria-label={`Команда для слота ${slotTime(slot)}`}
          disabled={busy || unbookedTeams.length === 0}
        />
        <datalist id={listId}>
          {unbookedTeams.map((team) => (
            <option key={team.id} value={teamLabel(team)} />
          ))}
        </datalist>
        <PrimaryButton type="submit" disabled={busy || !value.trim()} className="shrink-0">
          Добавить
        </PrimaryButton>
      </div>
      {error ? <p className="text-[0.875rem] text-error">{error}</p> : null}
    </form>
  );
}

function SlotPanel({
  slot,
  unbookedTeams,
  busyKey,
  onAdd,
  onRemove,
  onOpenTeam,
  minTeamSize,
}: {
  slot: AdminFinalSlot;
  unbookedTeams: AdminFinalTeam[];
  busyKey: string | null;
  onAdd: (slotId: number, teamId: number) => Promise<boolean>;
  onRemove: (slotId: number, teamId: number) => Promise<void>;
  onOpenTeam: (teamId: number) => void;
  minTeamSize: number;
}) {
  const [confirmTeamId, setConfirmTeamId] = useState<number | null>(null);
  const isFull = slot.booked >= slot.capacity;

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-hand text-[1.5rem] leading-none text-ink">{slotTime(slot)}</h2>
        <span
          className={`rounded-[7px] px-2.5 py-1 text-[0.875rem] font-bold ${
            isFull ? "bg-error/15 text-error" : "bg-mist text-ink"
          }`}
        >
          {slot.booked} / {slot.capacity}
        </span>
      </div>

      {slot.teams.length === 0 ? (
        <p className="mt-3 text-[0.9375rem] text-ink/60">Пока никто не записан.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-ink/10 border-y border-ink/10">
          {slot.teams.map((team) => {
            const key = `${slot.id}-${team.id}`;
            const removing = busyKey === `remove-${key}`;
            const confirming = confirmTeamId === team.id;

            return (
              <li key={team.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-ink">
                    <TeamNameLink team={team} onOpen={onOpenTeam} />{" "}
                    <span className="text-ink/50">· {team.publicCode}</span>
                  </p>
                  <p className="text-[0.875rem] break-words text-ink/60">
                    Капитан: {team.captainName}, @{team.captainTelegram} ·{" "}
                    <TeamSize size={team.size} minSize={minTeamSize} /> ·
                    записана {dateTimeFormat.format(new Date(team.bookedAt))}
                  </p>
                </div>

                {confirming ? (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="text-[0.875rem] text-ink/70">Убрать из слота?</span>
                    <DangerButton
                      disabled={removing}
                      onClick={async () => {
                        await onRemove(slot.id, team.id);
                        setConfirmTeamId(null);
                      }}
                    >
                      {removing ? "Убираем…" : "Да"}
                    </DangerButton>
                    <SecondaryButton disabled={removing} onClick={() => setConfirmTeamId(null)}>
                      Нет
                    </SecondaryButton>
                  </div>
                ) : (
                  <DangerButton
                    disabled={busyKey !== null}
                    onClick={() => setConfirmTeamId(team.id)}
                    className="shrink-0"
                  >
                    Убрать
                  </DangerButton>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <AddTeamForm
          slot={slot}
          unbookedTeams={unbookedTeams}
          busy={busyKey !== null}
          onAdd={onAdd}
        />
      </div>
    </section>
  );
}

export default function AdminFinalPage() {
  const [data, setData] = useState<AdminFinal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [openTeamId, setOpenTeamId] = useState<number | null>(null);

  useEffect(() => {
    adminApi
      .getFinal()
      .then(setData)
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  async function reload() {
    try {
      setData(await adminApi.getFinal());
    } catch {
      // ошибку основного действия уже показали — тихо оставляем старые данные
    }
  }

  async function handleAdd(slotId: number, teamId: number) {
    setBusyKey(`add-${slotId}`);
    setError(null);
    try {
      setData(await adminApi.addFinalTeam(slotId, teamId));
      return true;
    } catch (err) {
      setError(toErrorMessage(err));
      // слот мог заполниться или команду записал капитан — подтягиваем свежее
      await reload();
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRemove(slotId: number, teamId: number) {
    setBusyKey(`remove-${slotId}-${teamId}`);
    setError(null);
    try {
      setData(await adminApi.removeFinalTeam(slotId, teamId));
    } catch (err) {
      setError(toErrorMessage(err));
      await reload();
    } finally {
      setBusyKey(null);
    }
  }

  const bookedTotal = data?.slots.reduce((sum, slot) => sum + slot.booked, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[1.25rem] font-bold uppercase text-ink">Финал</h1>
        {data ? (
          <p className="text-[0.9375rem] text-ink/70">
            Записано команд: <b className="text-ink">{bookedTotal}</b> · без записи:{" "}
            <b className="text-ink">{data.unbookedTeams.length}</b>
          </p>
        ) : null}
      </div>

      <Notice tone="info">
        Организатор может добавить команду в слот и после закрытия записи, и при составе меньше
        минимального — ограничение только по вместимости слота. Убранная команда снова может записаться сама, пока запись открыта.
      </Notice>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {data === null ? (
        error ? null : <p className="text-ink/70">Загрузка…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.slots.map((slot) => (
              <SlotPanel
                key={slot.id}
                slot={slot}
                unbookedTeams={data.unbookedTeams}
                busyKey={busyKey}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onOpenTeam={setOpenTeamId}
                minTeamSize={data.minTeamSize}
              />
            ))}
          </div>

          <section className={panelClass}>
            <h2 className="font-bold uppercase text-ink">
              Без записи ({data.unbookedTeams.length})
            </h2>
            {data.unbookedTeams.length === 0 ? (
              <p className="mt-2 text-[0.9375rem] text-ink/60">Все команды записаны.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1 text-[0.9375rem] text-ink">
                {data.unbookedTeams.map((team) => (
                  <li key={team.id} className="break-words">
                    <TeamNameLink team={team} onOpen={setOpenTeamId} />{" "}
                    <span className="text-ink/50">· {team.publicCode}</span>{" "}
                    <span className="text-ink/60">
                      · <TeamSize size={team.size} minSize={data.minTeamSize} /> · капитан {team.captainName}, @
                      {team.captainTelegram}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {openTeamId !== null ? (
        <TeamDetailsModal key={openTeamId} teamId={openTeamId} onClose={() => setOpenTeamId(null)} />
      ) : null}
    </div>
  );
}
