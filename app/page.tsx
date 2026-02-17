import { FinalCtaBanner } from "@/components/landing/final-cta-banner";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingNavbar } from "@/components/landing/navbar";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="bg-premium-mesh relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-24 h-[320px] w-[320px] rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-[360px] w-[360px] rounded-full bg-purple-300/25 blur-3xl" />

      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <FinalCtaBanner />

      <footer className="px-4 pb-10 text-center text-sm text-slate-500 md:px-6">
        <Separator className="mx-auto mb-5 max-w-6xl bg-slate-200/80" />
        <p>GSU Gombe Alumni © {new Date().getFullYear()} | Official GOMBE STATE UNIVERSITY (GSU) alumni platform.</p>
      </footer>
    </main>
  );
}

