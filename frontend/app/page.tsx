import { About } from "@/components/about";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Timeline } from "@/components/timeline";

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
