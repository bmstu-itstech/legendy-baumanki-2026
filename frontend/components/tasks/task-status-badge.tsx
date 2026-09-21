import type { TaskStatus } from "@/lib/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  closed: "Заблокировано",
  opened: "Доступно",
  started: "В процессе",
  review: "На проверке",
  completed: "Выполнено",
  skipped: "Пропущено",
  failed: "Не принято",
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  closed: "border-muted text-muted",
  opened: "border-ink text-ink",
  started: "border-accent text-accent",
  review: "border-secondary text-secondary",
  completed: "border-success text-success",
  skipped: "border-muted text-muted",
  failed: "border-error text-error",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[7px] border px-2 py-0.5 text-[0.8125rem] font-bold uppercase ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
