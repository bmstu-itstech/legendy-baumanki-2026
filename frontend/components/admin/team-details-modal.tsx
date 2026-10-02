"use client";

import { useEffect, useState, type ReactNode } from "react";

import { adminApi, type AdminTeamDetails, type AdminTeamMember } from "@/lib/api/admin";
import { toErrorMessage } from "@/lib/api/errors";

import { Notice } from "@/components/admin/admin-ui";
import { Modal } from "@/components/ui/modal";

const linkClass = "break-all text-secondary underline underline-offset-2 hover:text-ink";

function MemberDetails({ member }: { member: AdminTeamMember }) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Группа", value: member.group },
    {
      label: "Telegram",
      value: (
        <a href={`https://t.me/${member.telegram}`} target="_blank" rel="noreferrer" className={linkClass}>
          @{member.telegram}
        </a>
      ),
    },
    {
      label: "Почта",
      value: member.email ? (
        <a href={`mailto:${member.email}`} className={linkClass}>
          {member.email}
        </a>
      ) : (
        <span className="text-ink/50">не найдена</span>
      ),
    },
    { label: "ID пользователя", value: member.userId },
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-3 pb-3 text-[0.9375rem]">
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-ink/60">{label}</dt>
          <dd className="min-w-0 text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Состав команды для организатора: клик по участнику раскрывает его контакты.
 * Рендерить с key={teamId} — новая команда монтирует модалку заново со
 * свежим состоянием.
 */
export function TeamDetailsModal({ teamId, onClose }: { teamId: number; onClose: () => void }) {
  const [team, setTeam] = useState<AdminTeamDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openUserId, setOpenUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getTeam(teamId)
      .then((data) => {
        if (!cancelled) setTeam(data);
      })
      .catch((err) => {
        if (!cancelled) setError(toErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return (
    <Modal open onClose={onClose} title={team?.name ?? "Команда"} className="max-w-[560px]">
      {error ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : team === null ? (
        <p className="mt-4 text-ink/70">Загрузка…</p>
      ) : (
        <>
          <p className="mt-2 text-[0.9375rem] text-ink/60">
            Код {team.publicCode} · {team.members.length} чел. · создана{" "}
            {new Date(team.createdAt).toLocaleDateString("ru-RU", { timeZone: "Europe/Moscow" })}
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {team.members.map((member) => {
              const isOpen = openUserId === member.userId;
              const isCaptain = member.userId === team.leaderId;

              return (
                <li key={member.userId} className="rounded-[12px] border-2 border-secondary/25 bg-white">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenUserId(isOpen ? null : member.userId)}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
                  >
                    <span className="min-w-0 flex-1 font-bold break-words text-ink">{member.fullName}</span>
                    {isCaptain ? (
                      <span className="shrink-0 rounded-[7px] border border-ink px-2 py-0.5 text-[0.75rem] font-bold uppercase text-ink">
                        Капитан
                      </span>
                    ) : null}
                    <span aria-hidden="true" className={`shrink-0 text-ink/50 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </button>
                  {isOpen ? <MemberDetails member={member} /> : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}
