"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useFinalStore } from "@/lib/store/final-store";
import type { FinalOverview, FinalSlot } from "@/lib/types";

const FINAL_INTRO = [
  "Когда-то великие умы Бауманки работали над изобретением, которое могло изменить всё. Но что-то пошло не так: команда раскололась, между учёными произошла ссора, а правда о случившемся оказалась потеряна.",
  "Теперь именно вам предстоит восстановить события прошлого.",
  "Записываясь на «Легенды Бауманки», вы выбираете момент, когда начнётся ваше расследование. Впереди — встречи с учёными, испытания, тайны и осколки истории, которые придётся собрать воедино.",
  "Собирайте свою команду, выбирайте удобное время и приходите 5 октября в 417к — именно там начнётся ваше погружение в легенду.",
  "Ждём ваши команды. Начало истории — за вами.",
];

// Слоты и дедлайн — московское время, независимо от часового пояса браузера.
const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});
const dayFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Moscow",
});

function formatSlotTime(slot: FinalSlot) {
  return `${timeFormat.format(new Date(slot.startsAt))}–${timeFormat.format(new Date(slot.endsAt))}`;
}

function formatDeadline(iso: string) {
  const date = new Date(iso);
  return `${timeFormat.format(date)} ${dayFormat.format(date)}`;
}

const cardClass =
  "flex w-full min-w-0 flex-col rounded-[18px] border-2 border-secondary bg-white px-6 py-7 sm:px-9";

function FinalIntro() {
  return (
    <section className={cardClass}>
      <h2 className="text-[1.375rem] font-bold uppercase text-ink sm:text-[1.625rem]">
        Твоё место в истории уже ждёт
      </h2>

      <div className="mt-4 flex flex-col gap-3 text-[1rem] leading-relaxed text-ink/80 sm:text-[1.0625rem]">
        {FINAL_INTRO.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <dl className="mt-5 flex flex-col gap-1 text-[1.0625rem] text-ink sm:text-[1.125rem]">
        <div className="flex gap-2">
          <dt className="font-bold">Когда?</dt>
          <dd>5 октября (Требуется предварительная запись)</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-bold">Где?</dt>
          <dd>Аудитория 417к (Конгресс-центр)</dd>
        </div>
      </dl>
    </section>
  );
}

/** Команда есть, но в ней меньше людей, чем нужно для записи капитаном. */
function isTeamTooSmall(overview: FinalOverview) {
  return overview.teamSize !== null && overview.teamSize < overview.minTeamSize;
}

/** «В команде N …»: 2 человека, но 1 и 5 человек. */
function peopleCountWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "человека" : "человек";
}


/** Подсказка над слотами: почему записаться нельзя или куда команда уже записана. */
function BookingStatus({
  overview,
  onCancel,
  cancelling,
}: {
  overview: FinalOverview;
  onCancel: () => Promise<void>;
  cancelling: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const bookedSlot = overview.slots.find((slot) => slot.id === overview.bookedSlotId);

  if (!overview.hasTeam) {
    return (
      <p className="text-[1rem] text-ink/70">
        Чтобы записаться на финал, создайте команду или вступите в неё на странице{" "}
        <Link href="/profile" className="font-bold text-ink underline underline-offset-2">
          профиля
        </Link>
        .
      </p>
    );
  }

  if (bookedSlot) {
    const canCancel = overview.isCaptain && overview.bookingOpen;
    return (
      <div className="flex flex-col gap-3 rounded-[14px] bg-ink px-5 py-4 text-white sm:flex-row sm:items-center">
        <p className="text-[1.0625rem]">
          Ваша команда записана на слот{" "}
          <span className="font-bold whitespace-nowrap">{formatSlotTime(bookedSlot)}</span>
        </p>

        {canCancel && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-10 shrink-0 cursor-pointer rounded-[10px] border border-white px-4 text-[1rem] transition-colors hover:bg-white hover:text-ink sm:ml-auto"
          >
            Отменить запись
          </button>
        )}

        {canCancel && confirming && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
            <span className="text-[1rem] text-white/80">Точно отменить?</span>
            <button
              type="button"
              disabled={cancelling}
              onClick={async () => {
                await onCancel();
                setConfirming(false);
              }}
              className="min-h-10 cursor-pointer rounded-[10px] bg-error px-4 text-[1rem] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? "Отменяем…" : "Да, отменить"}
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => setConfirming(false)}
              className="min-h-10 cursor-pointer rounded-[10px] border border-white/60 px-4 text-[1rem] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Нет
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!overview.bookingOpen) {
    return <p className="text-[1rem] text-ink/70">Запись на финал закрыта.</p>;
  }

  if (isTeamTooSmall(overview)) {
    const size = overview.teamSize ?? 0;
    const missing = overview.minTeamSize - size;
    return (
      <div className="rounded-[14px] border-2 border-error/60 bg-error/10 px-5 py-4 text-ink">
        <p className="text-[1.0625rem] font-bold">
          Для записи на финал в команде должно быть не меньше {overview.minTeamSize} человек
        </p>
        <p className="mt-1 text-[1rem] text-ink/70">
          Сейчас в команде {size} {peopleCountWord(size)}.
        </p>
      </div>
    );
  }

  if (!overview.isCaptain) {
    return <p className="text-[1rem] text-ink/70">Ваша команда пока не записана на финал.</p>;
  }

  return <p className="text-[1rem] text-ink/70">Выберите удобное время — команда записывается целиком.</p>;
}

/** Рядовым участникам — явно: записывает и отменяет запись только капитан. */
function CaptainOnlyNotice({ booked }: { booked: boolean }) {
  return (
    <div className="rounded-[14px] border-2 border-secondary bg-mist px-5 py-4 text-ink">
      <p className="text-[1.0625rem] font-bold">Записать команду на финал может только капитан</p>
      <p className="mt-1 text-[1rem] text-ink/70">
        {booked
          ? "Если нужно выбрать другое время, попросите капитана отменить запись и записаться заново."
          : "Обсудите с командой удобное время и попросите капитана выбрать слот — после записи он появится здесь."}
      </p>
    </div>
  );
}

function SlotCard({
  slot,
  overview,
  pending,
  disabled,
  onBook,
}: {
  slot: FinalSlot;
  overview: FinalOverview;
  pending: boolean;
  disabled: boolean;
  onBook: (slotId: number) => void;
}) {
  const isMine = slot.id === overview.bookedSlotId;
  const free = Math.max(slot.capacity - slot.booked, 0);
  const isFull = free === 0;
  const canBook =
    overview.isCaptain &&
    overview.bookingOpen &&
    overview.bookedSlotId === null &&
    !isFull &&
    !isTeamTooSmall(overview);

  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] border-2 px-4 py-4 ${
        isMine ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-hand text-[1.5rem] leading-none">{formatSlotTime(slot)}</span>
        {isMine && (
          <span className="shrink-0 rounded-[7px] border border-white px-2 py-0.5 text-[0.875rem] font-bold uppercase">
            Ваш слот
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: slot.capacity }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < slot.booked ? (isMine ? "bg-white" : "bg-secondary") : isMine ? "bg-white/25" : "bg-mist"
              }`}
            />
          ))}
        </div>
        <span className={`text-[0.9375rem] ${isMine ? "text-white/80" : isFull ? "text-error" : "text-ink/60"}`}>
          {isFull ? "Мест нет" : `Свободно ${free} из ${slot.capacity}`}
        </span>
      </div>

      {canBook && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onBook(slot.id)}
          className="min-h-11 cursor-pointer rounded-[10px] bg-ink font-hand text-[1.0625rem] uppercase text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Записываем…" : "Записаться"}
        </button>
      )}
    </div>
  );
}

export function FinalBooking() {
  const overview = useFinalStore((state) => state.overview);
  const status = useFinalStore((state) => state.status);
  const fetchFinal = useFinalStore((state) => state.fetch);
  const book = useFinalStore((state) => state.book);
  const cancel = useFinalStore((state) => state.cancel);

  const [pendingSlotId, setPendingSlotId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinal();
  }, [fetchFinal]);

  const handleBook = async (slotId: number) => {
    setActionError(null);
    setPendingSlotId(slotId);
    try {
      await book(slotId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось записаться");
    } finally {
      setPendingSlotId(null);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setCancelling(true);
    try {
      await cancel();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось отменить запись");
    } finally {
      setCancelling(false);
    }
  };

  const busy = pendingSlotId !== null || cancelling;

  return (
    <div className="flex flex-col gap-6">
      <FinalIntro />

      <section className={cardClass}>
        <h2 className="text-[1.375rem] font-bold uppercase text-ink sm:text-[1.625rem]">Запись на финал</h2>

        {(status === "idle" || status === "loading") && !overview && (
          <p className="mt-4 text-[1rem] text-ink/70">Загружаем слоты…</p>
        )}

        {status === "error" && !overview && (
          <p role="alert" className="mt-4 text-[1rem] text-error">
            {/* Без текста ошибки из стора: «Не найдено» и подобные общие фразы
                здесь только сбивают с толку. */}
            Не удалось загрузить запись на финал. Обновите страницу чуть позже.
          </p>
        )}

        {overview && (
          <>
            <div className="mt-4">
              <BookingStatus overview={overview} onCancel={handleCancel} cancelling={cancelling} />
            </div>

            {overview.hasTeam && !overview.isCaptain && overview.bookingOpen && (
              <div className="mt-3">
                <CaptainOnlyNotice booked={overview.bookedSlotId !== null} />
              </div>
            )}

            {actionError && (
              <p role="alert" className="mt-3 text-[1rem] text-error">
                {actionError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {overview.slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  overview={overview}
                  pending={pendingSlotId === slot.id}
                  disabled={busy}
                  onBook={handleBook}
                />
              ))}
            </div>

            <p className="mt-4 text-[0.9375rem] text-ink/60">
              В один слот помещается до 8 команд. Записаться может команда от {overview.minTeamSize} человек. Капитан может отменить запись и выбрать другое время до{" "}
              {formatDeadline(overview.deadline)}.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
