import Image from "next/image";

import { SOCIAL_LINKS } from "./site-data";

export function SiteFooter() {
  return (
    <footer id="contacts" className="relative overflow-hidden bg-ink text-white">
      <div className="container-page relative pt-10 pb-0 md:pb-8 xxl:py-0">
        <div className="grid gap-10 min-[600px]:grid-cols-2 min-[600px]:items-center md:gap-8 xxl:grid-cols-[436px_1fr_366px] xxl:items-start">
          <div className="relative">
            <Image
              src="/assets/footer-left.svg"
              alt="Легенды Бауманки"
              width={367}
              height={275}
              className="h-auto w-[68%] max-w-[320px] min-[600px]:w-[240px] sm:w-[280px] md:w-[320px] xxl:mt-12 xxl:w-[367px] xxl:max-w-none"
            />
          </div>

          <div className="xxl:mt-12">
            <h2 className="font-hand text-[clamp(0.9375rem,3.2vw,2.5rem)] font-bold uppercase leading-tight md:max-w-84 xxl:max-w-84 xxl:text-h3">
              Социальные сети студенческого совета
            </h2>

            <ul className="mt-4 space-y-3 xxl:mt-[15px] xxl:space-y-[19px]">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.icon}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 xxl:gap-5"
                  >
                    <Image
                      src={social.icon}
                      alt=""
                      width={26}
                      height={22}
                      className="h-auto w-4 shrink-0 xxl:w-[26px]"
                    />
                    <span className="text-[clamp(0.8125rem,2.6vw,1.625rem)] font-bold transition-colors group-hover:text-accent xxl:text-body">
                      {social.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Image
            src="/assets/footer-building.svg"
            alt=""
            width={366}
            height={298}
            className="pointer-events-none hidden h-auto xxl:col-start-3 xxl:mt-[3px] xxl:block xxl:w-[366px]"
          />
        </div>
      </div>
    </footer>
  );
}
