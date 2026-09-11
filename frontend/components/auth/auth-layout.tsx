import type { ReactNode } from "react";
import Image from "next/image";

import { DashedSwoosh, Sparkle } from "@/components/ui/decor";

/**
 * Общий каркас страниц входа и регистрации: фон, звезда, декоративные
 * композиции для десктопа и мобильных. Контент передаётсяchildren,
 * классы для высотной адаптации — через contentClassName.
 */
export function AuthLayout({
  children,
  contentClassName = "",
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <main className="flex flex-1 flex-col bg-mist">
      <div className="relative mx-auto flex min-h-svh w-full max-w-[1440px] flex-1 flex-col">
        <Sparkle
          aria-hidden="true"
          className="absolute top-5 right-8 z-10 w-[63px] text-ink xl:top-4 xl:right-auto xl:left-6"
        />

        {/*
          Десктопная композиция справа: статуя Эрнестовича, пунктиры и
          звёзды (единый SVG 623×727). Привязана к высоте вьюпорта:
          верх 5svh, высота 90.5svh. Внизу — дополнительная пунктирная
          линия.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[5svh] right-0 hidden aspect-[623/727] h-[90.5svh] w-auto lg:block lg:right-[-50px]"
        >
          <Image
            src="/assets/registration-decor.svg"
            alt=""
            width={623}
            height={727}
            priority
            className="absolute inset-0 h-full w-full"
          />
          <DashedSwoosh
            d="M1.00003 226.757C20.281 211.088 60.0949 163.137 65.1026 96.6854C70.1104 30.2336 183.857 14.037 186.42 1"
            box={[188, 228]}
            strokeWidth={2}
            dash="15 15"
            className="absolute bottom-[-2%] left-0 h-[17.2%] w-[30.2%] text-ink"
          />
        </div>

        {/*
          Мобильная композиция: статуя, пунктиры и звезда (340×159),
          вплотную к правому нижнему углу, как в макете.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 w-[340px] md:w-[clamp(340px,47vw,490px)] lg:hidden"
        >
          <Image
            src="/assets/registration-decor-mobile.svg"
            alt=""
            width={340}
            height={159}
            className="h-auto w-full"
          />
        </div>

        <div
          className={`container-page relative z-10 flex flex-1 flex-col justify-center pb-6 ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </main>
  );
}

export function AuthTitle() {
  return (
    <p className="pt-5 font-bold uppercase text-ink sm:pt-20 xl:pt-[57px]">
      <span className="block text-[2.7rem] leading-[1.15] sm:inline sm:text-[3.25rem] sm:leading-[0.95] xl:text-[4rem]">
        Легенды{" "}
      </span>
      <span className="block text-[2.3rem] leading-[1.05] sm:inline sm:text-[3.25rem] sm:leading-[0.95] xl:text-[4rem]">
        Бауманки
      </span>
    </p>
  );
}
