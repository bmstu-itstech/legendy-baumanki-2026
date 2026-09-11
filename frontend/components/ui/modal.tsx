"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full max-w-[480px] rounded-[28px] border-2 border-secondary bg-mist p-6 shadow-xl sm:p-8 ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-5 right-5 flex size-8 cursor-pointer items-center justify-center text-ink transition-opacity hover:opacity-60"
        >
          <CloseIcon className="size-5" />
        </button>

        <h2 className="pr-8 text-[1.25rem] font-bold uppercase text-ink sm:text-[1.375rem]">
          {title}
        </h2>

        {children}
      </div>
    </div>,
    document.body,
  );
}
