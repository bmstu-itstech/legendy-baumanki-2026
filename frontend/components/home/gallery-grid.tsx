"use client";

import Image from "next/image";

import { Lightbox, useLightbox } from "@/components/ui/lightbox";

const TILE = "aspect-[370/252] rounded-[clamp(3px,1.2vw,12px)]";

export function GalleryGrid({
  photos,
  slots,
}: {
  photos: string[];
  slots: number;
}) {
  const { openIndex, open, close, show } = useLightbox(photos.length);

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
            onClick={() => open(index)}
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

      <Lightbox
        items={photos.map((src) => ({ src, alt: "Фото квеста прошлого года" }))}
        openIndex={openIndex}
        onClose={close}
        onShow={show}
      />
    </>
  );
}
