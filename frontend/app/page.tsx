import { About } from "@/components/home/about";
import { Gallery } from "@/components/home/gallery";
import { Hero } from "@/components/home/hero";
import { Timeline } from "@/components/home/timeline";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <About />
        <Timeline />
        <Gallery />
      </main>
      <SiteFooter />
    </>
  );
}
