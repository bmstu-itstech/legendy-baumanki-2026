import fs from "node:fs";
import path from "node:path";

import { ArrowUpRight, Star } from "./decor";
import { GalleryGrid } from "./gallery-grid";
import { PHOTO_ALBUM_URL } from "./site-data";

const PHOTO_SLOTS = 5;
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

function getGalleryPhotos(): string[] {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "gallery"))
      .filter((name) => IMAGE_RE.test(name))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
      .slice(0, PHOTO_SLOTS)
      .map((name) => `/gallery/${name}`);
  } catch {
    return [];
  }
}

const STATS = [
  { value: "449", label: "сформированных команд" },
  { value: "9093", label: "ответа" },
  { value: "273", label: "фотографии от участников" },
] as const;

export function Gallery() {
  const photos = getGalleryPhotos();

  return (
    <section
      id="gallery"
      className="relative overflow-hidden rounded-t-[24px] bg-ink pt-12 pb-16 text-white lg:rounded-t-section lg:pt-[51px] lg:pb-24"
    >
      <Star className="pointer-events-none absolute top-0 right-2 size-10 text-white sm:size-16 lg:top-[4px] lg:right-[6%] lg:size-[120px]" />
      <Star className="pointer-events-none absolute top-[26%] -left-6 size-14 text-white sm:size-20 lg:top-0 lg:-left-2 lg:size-[130px]" />

      <div className="container-page relative">
        <h2 className="text-center text-[clamp(1.125rem,3.2vw,2.5rem)] font-bold uppercase">
          Как это было в прошлом году
        </h2>

        <dl className="mx-auto mt-8 grid max-w-[1168px] grid-cols-3 md:mt-10 lg:mt-12">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-2 text-center md:px-4 lg:px-6 ${
                index > 0 ? "border-l-[3px] border-white lg:border-l-[5px]" : ""
              }`}
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-[clamp(1.25rem,4vw,3rem)] font-bold">
                  {stat.value}
                </span>
                <span className="mt-1 block font-hand text-[clamp(0.5rem,1.2vw,1.5rem)] uppercase leading-tight lg:mt-2">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:mt-16 lg:gap-x-[96px] lg:gap-y-[73px]">
          <GalleryGrid photos={photos} slots={PHOTO_SLOTS} />

          <a
            href={PHOTO_ALBUM_URL}
            className="group flex aspect-[370/252] flex-col justify-center rounded-[clamp(3px,1.2vw,12px)] bg-white px-3 text-ink transition-transform hover:scale-[1.02] sm:px-6 lg:px-10"
          >
            <ArrowUpRight className="mb-1 size-[clamp(1.25rem,4vw,4rem)] self-end transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 lg:mb-2" />
            <span className="font-hand text-[clamp(0.625rem,2vw,2rem)] font-bold uppercase leading-tight">
              Смотреть фотоальбом
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
