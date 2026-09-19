import { RequireAuth } from "@/components/auth/route-guard";
import { EventCountdown } from "@/components/layout/event-countdown";
import { CornerDashStar } from "@/components/profile/profile-decor";
import { ProfileBottomNav, ProfileSidebar } from "@/components/profile/profile-nav";

export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return (
    <RequireAuth>
      <div className="sticky top-0 z-50">
        <EventCountdown />
      </div>

      <main className="flex min-h-[calc(100svh-2rem)] flex-1 bg-mist xl:min-h-[calc(100svh-2.25rem)]">
        <ProfileSidebar />

        <div className="relative min-w-0 flex-1 pb-28 lg:pb-0">
          <CornerDashStar
            aria-hidden="true"
            className="pointer-events-none absolute top-2 right-4 w-24 text-ink sm:top-4 sm:right-10 sm:w-32 xl:right-16 xl:w-40"
          />
          <CornerDashStar
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 right-6 hidden w-28 -scale-y-100 text-ink xl:block xl:w-36"
          />
          <CornerDashStar
            aria-hidden="true"
            className="pointer-events-none absolute bottom-10 left-2 w-20 rotate-180 text-ink/70 lg:hidden"
          />
          <CornerDashStar
            aria-hidden="true"
            className="pointer-events-none absolute top-16 left-10 hidden w-24 -scale-x-100 text-ink/50 xl:block xl:w-28"
          />
          <CornerDashStar
            aria-hidden="true"
            className="pointer-events-none absolute bottom-40 left-16 hidden w-20 rotate-90 text-ink/40 xl:block"
          />
          <CornerDashStar
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-10 hidden w-16 rotate-45 text-ink/30 2xl:block"
          />

          <div className="container-page py-8 sm:py-10">
            <div className="relative z-10 mx-auto max-w-[900px]">{children}</div>
          </div>
        </div>

        <ProfileBottomNav />
      </main>
    </RequireAuth>
  );
}
