"use client";

import { useCallback, useEffect, useState } from "react";

export type LightboxItem = { src: string; alt: string };

/** Общее состояние для открытия/навигации по лайтбоксу — держит caller (у него же и кнопки-триггеры). */
export function useLightbox(count: number) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const show = useCallback(
    (delta: number) => {
      setOpenIndex((current) => (current === null ? current : (current + delta + count) % count));
    },
    [count],
  );

  return { openIndex, open: setOpenIndex, close, show };
}

/**
 * Полноэкранный просмотр фото с клавиатурной навигацией — как в галерее на
 * главной (изначально components/home/gallery-grid.tsx), вынесено сюда для
 * переиспользования. Обычный <img>, а не next/image: источники — с
 * произвольных доменов (бэкенд, /public), под next/image оптимизацию не подведёшь.
 */
export function Lightbox({
  items,
  openIndex,
  onClose,
  onShow,
}: {
  items: LightboxItem[];
  openIndex: number | null;
  onClose: () => void;
  onShow: (delta: number) => void;
}) {
  const isOpen = openIndex !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onShow(1);
      if (event.key === "ArrowLeft") onShow(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, onShow]);

  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!isOpen || openIndex === null) return null;

  const item = items[openIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фотографии"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4"
    >
      <button
        type="button"
        autoFocus
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute top-3 right-3 flex size-12 cursor-pointer items-center justify-center rounded-full text-3xl leading-none text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        ×
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={(event) => {
              event.stopPropagation();
              onShow(-1);
            }}
            className="absolute top-1/2 left-2 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-4xl leading-none text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:left-6"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={(event) => {
              event.stopPropagation();
              onShow(1);
            }}
            className="absolute top-1/2 right-2 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-4xl leading-none text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:right-6"
          >
            ›
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.alt}
        onClick={(event) => event.stopPropagation()}
        className="h-auto w-auto max-h-[85vh] max-w-full object-contain"
      />

      {items.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption text-white/70">
          {openIndex + 1} / {items.length}
        </span>
      )}
    </div>
  );
}
