"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const TILE = "aspect-[370/252] rounded-[clamp(3px,1.2vw,12px)]";

export function GalleryGrid({
  photos,
  slots,
}: {
  photos: string[];
  slots: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);

  const show = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + delta + photos.length) % photos.length,
      );
    },
    [photos.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") show(1);
      if (event.key === "ArrowLeft") show(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, show]);

  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  return (
    <>
      {Array.from({ length: slots }, (_, index) => {
        const src = photos[index];
        if (!src) {
          return (
            <div
              key={index}
              className={`${TILE} bg-placeholder`}
              aria-hidden="true"
            />
          );
        }
        return (
          <button
            key={src}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group cursor-zoom-in"
          >
            <Image
              src={src}
              alt="Фото квеста прошлого года — открыть"
              width={370}
              height={252}
              sizes="(max-width: 768px) 50vw, 33vw"
              className={`${TILE} h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]`}
            />
          </button>
        );
      })}

      {isOpen && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографии"
          onClick={close}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4"
        >
          <button
            type="button"
            autoFocus
            aria-label="Закрыть"
            onClick={close}
            className="absolute top-3 right-3 flex size-12 cursor-pointer items-center justify-center rounded-full text-3xl leading-none text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={(event) => {
                  event.stopPropagation();
                  show(-1);
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
                  show(1);
                }}
                className="absolute top-1/2 right-2 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-4xl leading-none text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:right-6"
              >
                ›
              </button>
            </>
          )}

          <Image
            src={photos[openIndex]}
            alt="Фото квеста прошлого года"
            width={0}
            height={0}
            sizes="100vw"
            onClick={(event) => event.stopPropagation()}
            className="h-auto w-auto max-h-[85vh] max-w-full object-contain"
          />

          {photos.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption text-white/70">
              {openIndex + 1} / {photos.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
