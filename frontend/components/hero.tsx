import Image from "next/image";

import { ArrowUpRight, DashedSwoosh, Star } from "./decor";
import { REGISTRATION_URL } from "./site-data";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-ink text-white"
    >
      <Star className="pointer-events-none absolute -bottom-3 left-[4%] size-[58px] text-white/90 sm:size-[72px] lg:bottom-10 lg:left-[18%] lg:size-[126px]" />
      <Star className="pointer-events-none absolute bottom-2 left-1/2 size-[60px] text-white/90 sm:size-[76px] lg:bottom-10 lg:left-[52%] lg:size-[94px]" />
      <div className="absolute inset-y-0 right-0 z-0 w-full sm:w-[78%] lg:w-[62%]">
        <Image
          src="/assets/hero-building.png"
          alt="Главный корпус МГТУ им. Н.Э. Баумана"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 78vw, 62vw"
          className="object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/10 sm:via-ink/70 sm:to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />

      <DashedSwoosh
        d="M-286 3.00012C-241.263 40.0107 -113.143 109.293 41.4374 90.3385C196.017 71.384 285.224 324.638 316.274 324.542"
        box={[320, 183]}
        className="pointer-events-none absolute bottom-0 left-0 z-[1] hidden h-[183px] w-[320px] text-white lg:block"
      />
      <DashedSwoosh
        d="M3.00055 451.682C53.4944 423.019 163.787 327.885 201.007 176.661C238.226 25.4358 506.651 32.0584 517.596 3.00085"
        box={[260, 359]}
        className="pointer-events-none absolute right-0 bottom-0 z-[1] h-[359px] w-[260px] text-white"
      />

      <div className="container-page relative z-10 flex h-[calc(100svh-5rem)] min-h-[440px] flex-col justify-center py-16 lg:py-0">
        <h1 className="font-bold uppercase">
          <span className="block text-[3.25rem] leading-[0.95] sm:text-[4.5rem] md:text-[5.75rem] lg:text-[7.5rem]">
            Легенды
          </span>
          <span className="block text-[2.5rem] leading-[1.05] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[5.5rem]">
            Бауманки
          </span>
        </h1>

        <p className="mt-6 text-[1.375rem] font-bold sm:text-h3 md:text-[2rem] lg:mt-10 lg:text-h1">
          МГТУ им. Н.Э. Баумана
        </p>

        <p className="mt-5 max-w-[854px] font-hand text-[0.9375rem] uppercase leading-[1.5] sm:text-title md:text-[1.75rem] lg:mt-8 lg:text-h2">
          Раскрой все тайны и секреты университета. Пришло твоё время стать
          частью легендарной истории!
        </p>

        <a
          href={REGISTRATION_URL}
          className="group mt-10 inline-flex h-[60px] w-fit items-center gap-3 rounded-pill bg-white px-6 text-[1.125rem] font-bold text-ink transition-transform hover:scale-[1.02] sm:h-[72px] sm:gap-5 sm:px-9 sm:text-h3 md:h-[92px] md:px-10 md:text-[2rem] lg:mt-14 lg:h-[125px] lg:gap-8 lg:px-12 lg:text-[2.75rem]"
        >
          Зарегистрироваться
          <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-8 md:size-10 lg:size-14" />
        </a>
      </div>
    </section>
  );
}
