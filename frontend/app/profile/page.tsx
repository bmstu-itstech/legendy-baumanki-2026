import type { Metadata } from "next";

import { ProfileCard } from "@/components/profile/profile-card";
import { TeamCard } from "@/components/profile/team-card";

export const metadata: Metadata = {
  title: "Профиль — Легенды Бауманки 2026",
  description:
    "Личный кабинет участника «Легенд Бауманки»: данные профиля и команда квеста.",
};

export default function ProfilePage() {
  return (
    <>
      <h1 className="text-[1.375rem] font-bold uppercase text-ink sm:text-h3">Профиль</h1>

      <div className="mt-6 flex flex-col items-center gap-6 xl:flex-row xl:items-stretch">
        <ProfileCard />
        <TeamCard />
      </div>
    </>
  );
}
