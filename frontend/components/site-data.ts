export const REGISTRATION_URL = "/registration";

export const LOGIN_URL = "/login";

export const TASKS_URL = "/profile/tasks";

export const PHOTO_ALBUM_URL = "https://vk.ru/album-26724538_309374167";

export const NAV_ITEMS = [
  { label: "О проекте", href: "#about" },
  { label: "Этапы", href: "#timeline" },
  { label: "Как это было", href: "#gallery" },
  { label: "Контакты", href: "#contacts" },
] as const;

export const SOCIAL_LINKS = [
  {
    label: "t.me/studsovet_bmstu",
    href: "https://t.me/studsovet_bmstu",
    icon: "/assets/soc-tg.svg",
  },
  {
    label: "vk.ru/studsovet_bmstu",
    href: "https://vk.ru/studsovet_bmstu",
    icon: "/assets/soc-vk.svg",
  },
  {
    label: "max.ru/studsovet_bmstu",
    href: "https://max.ru/studsovet_bmstu",
    icon: "/assets/soc-ok.svg",
  },
] as const;
