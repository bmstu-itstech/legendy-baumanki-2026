import Image from "next/image";

import { CoffeeCup, DashedSwoosh, Star } from "@/components/ui/decor";

const STAGES = [
  {
    icon: "/assets/icon-tent.svg",
    title: "ШМБ",
    text: "Вместе с командой узнайте интересные факты про ШМБ и Бауманку, а также историю человека, чье имя носит ваш округ",
    place:
      "min-w-[197px] min-[540px]:mr-auto min-[540px]:w-[72%] lg:mr-0 lg:w-full lg:col-start-1 lg:row-start-1",
  },
  {
    icon: "/assets/icon-cup.svg",
    title: "Регистрация",
    text: "Собирай команду из друзей и одногруппников и регистрируйся на сайте. Не упусти возможность поучаствовать в акциях, проходящих в период регистрации, и первым узнать всё про университет!",
    place:
      "min-w-[197px] min-[540px]:ml-auto min-[540px]:w-[72%] lg:ml-0 lg:w-full lg:col-start-2 lg:row-start-2",
  },
  {
    icon: "/assets/icon-quest.svg",
    title: "Основной квест",
    text: "Это твой шанс погрузиться в прошлое, разгадать все загадки и узнать все тайны, которые хранят в себе эти коридоры. Окунись в историю!",
    place:
      "min-w-[197px] min-[540px]:mr-auto min-[540px]:w-[72%] lg:mr-0 lg:w-full lg:col-start-1 lg:row-start-3",
  },
  {
    icon: "/assets/icon-star.svg",
    title: "Финал",
    text: "День, который может определить дальнейшую судьбу. Ведь только нам решать, какой будет следующая глава истории…",
    place:
      "min-w-[197px] min-[540px]:ml-auto min-[540px]:w-[72%] lg:ml-0 lg:w-full lg:col-start-2 lg:row-start-4",
  },
] as const;

const MOBILE_LINK_BOX = [240, 170] as const;

const LINKS = [
  {
    d: "M482.001 489.501C450.334 440.834 348.701 336.501 195.501 308.501C42.3008 280.501 32.6675 12.1674 3.00079 3.00073",
    box: [485, 493],
    place:
      "left-[calc(55%-3px)] top-[calc(100%-63px)] right-[calc(-25%-33px)] bottom-[-430px]",
    mobile: {
      d: "M215 20C185 95 55 75 25 150",
      place:
        "left-[calc(75%-215px)] top-[calc(100%-80px)] h-[170px] w-[240px] min-[540px]:left-[69.44%] min-[540px]:-translate-x-1/2",
    },
  },
  {
    d: "M524.64 3.0006C473.698 30.8606 361.913 124.235 322.302 274.851C282.691 425.467 14.405 414.592 3.00081 443.473",
    box: [528, 447],
    place:
      "left-[-113px] top-[calc(100%-122px)] right-[35%] bottom-[-324.5px]",
    mobile: {
      d: "M25 20C55 95 185 75 215 150",
      place:
        "left-[calc(25%-25px)] top-[calc(100%-80px)] h-[170px] w-[240px] min-[540px]:left-[30.56%] min-[540px]:-translate-x-1/2",
    },
  },
  {
    d: "M655.608 203.682C604.624 175.899 465.629 132.368 317.516 180.503C169.404 228.639 33.4608 -2.91021 3.00057 3.11597",
    box: [659, 207],
    place: "left-[calc(50%-3px)] top-[calc(100%-23px)] right-[-337px] bottom-[-183px]",
    mobile: {
      d: "M215 20C185 95 55 75 25 150",
      place:
        "left-[calc(75%-215px)] top-[calc(100%-80px)] h-[170px] w-[240px] min-[540px]:left-[69.44%] min-[540px]:-translate-x-1/2",
    },
  },
] as const;

export function Timeline() {
  return (
    <section id="timeline" className="relative overflow-hidden bg-mist pb-16 lg:pb-28">
      <Star className="pointer-events-none absolute top-[30px] right-4 size-10 text-ink sm:top-0 sm:size-16 lg:right-[6%] lg:size-[154px]" />

      <div className="container-page relative">
        <h2 className="text-[1.375rem] font-bold uppercase text-ink md:text-[2.5rem] lg:text-[3.75rem] lg:leading-[1]">
          Таймлайн проекта
        </h2>

        <div className="mt-14 grid gap-y-14 lg:mt-[120px] lg:auto-rows-fr lg:grid-cols-2 lg:gap-x-[30px] lg:gap-y-[81px]">
          {STAGES.map((stage, index) => {
            const link = LINKS[index];
            return (
              <div key={stage.title} className={`relative ${stage.place}`}>
                <article className="relative z-10 h-full rounded-[15px] border-2 border-ink bg-white px-4 pt-10 pb-6 text-center md:pt-14 lg:min-h-[306px] lg:rounded-card lg:px-[22px] lg:pt-[100px] lg:pb-8">
                  <Image
                    src={stage.icon}
                    alt=""
                    width={161}
                    height={161}
                    className="absolute left-1/2 top-0 size-[68px] -translate-x-1/2 -translate-y-1/2 md:size-[100px] lg:size-[161px]"
                  />
                  <h3 className="text-[1.125rem] font-bold uppercase text-ink md:text-[1.75rem] lg:text-h1">
                    {stage.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[606px] font-hand text-[0.75rem] uppercase leading-[1.5] text-ink md:text-[1.0625rem] lg:mt-4 lg:text-h3">
                    {stage.text}
                  </p>
                </article>

                {link && (
                  <>
                    <DashedSwoosh
                      d={link.d}
                      box={link.box}
                      className={`pointer-events-none absolute hidden text-ink lg:block ${link.place}`}
                    />
                    <DashedSwoosh
                      d={link.mobile.d}
                      box={MOBILE_LINK_BOX}
                      strokeWidth={3}
                      dash="10 10"
                      className={`pointer-events-none absolute text-ink lg:hidden ${link.mobile.place}`}
                    />
                  </>
                )}
              </div>
            );
          })}

          <div aria-hidden className="relative hidden lg:block lg:col-start-2 lg:row-start-1">
            <CoffeeCup className="pointer-events-none absolute left-1/2 top-3 w-[238px] -translate-x-1/2 text-ink" />
          </div>
          <div aria-hidden className="relative hidden lg:block lg:col-start-2 lg:row-start-3">
            <Star className="pointer-events-none absolute right-[8%] top-[18%] size-[110px] text-ink" />
          </div>
          <div aria-hidden className="relative hidden lg:block lg:col-start-1 lg:row-start-4">
            <Star className="pointer-events-none absolute left-[8%] top-0 size-[157px] text-ink" />
            <Star className="pointer-events-none absolute right-[12%] top-[150px] size-[119px] text-ink" />
          </div>
        </div>
      </div>
    </section>
  );
}
