import Image from "next/image";
import Link from "next/link";

import { ArrowUpRight, Star } from "@/components/ui/decor";
import { TASKS_URL } from "@/components/site-data";

export function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-mist">
      <Star className="pointer-events-none absolute top-2 right-6 size-8 text-ink sm:size-10 lg:size-16 xl:right-12 xl:size-[157px]" />
      <Star className="pointer-events-none absolute top-2 left-[22%] size-8 text-ink sm:size-12 lg:size-14 xl:size-[110px]" />

      <div className="container-page relative py-14 lg:py-20">
        <div className="xl:grid xl:grid-cols-[334px_1fr] xl:items-start xl:gap-10">
          <Image
            src="/assets/statue.svg"
            alt="Памятник Н.Э. Бауману"
            width={334}
            height={648}
            className="float-right ml-4 h-auto w-[38%] max-w-40 xl:float-none xl:ml-0 xl:w-full xl:max-w-none"
          />

          <div className="xl:pt-6">
            <h2 className="text-[1.875rem] font-bold uppercase text-ink lg:text-[2.25rem] xl:text-[2.75rem]">
              О проекте:
            </h2>

            <p className="mt-4 font-hand text-[1.125rem] uppercase leading-[1.6] text-ink sm:text-title md:text-[1.5rem] lg:mt-6 lg:text-[1.75rem] xl:max-w-213.5 xl:text-h2 xl:leading-14">
              Легенды Бауманки — это крупнейший квест по территории, истории и
              традициям Университета. Ходит легенда, что он открывает
              первокурсникам потайные места и неожиданные факты о, казалось бы,
              знакомой Бауманке! Приходи и узнай все секреты, настало твоё
              время!
            </p>

            <Link
              href={TASKS_URL}
              className="group clear-right mt-8 inline-flex h-13 w-fit items-center gap-3 rounded-cta bg-ink px-5 text-[1rem] font-bold text-mist transition-colors hover:bg-ink/85 sm:h-16 sm:text-h3 lg:mt-10 lg:h-24 lg:text-[2rem] xl:h-32.5 xl:gap-10 xl:px-5.5 xl:text-[2.75rem]"
            >
              Перейти к заданиям
              <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-8 lg:size-12 xl:size-16" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
