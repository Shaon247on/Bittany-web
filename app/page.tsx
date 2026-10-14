import Navbar from "@/components/modules/landing/Navbar";
import Hero from "@/components/modules/landing/Hero";
import Features from "@/components/modules/landing/Features";
import Benefits from "@/components/modules/landing/Benefits";
import Stats from "@/components/modules/landing/Stats";
import HowItWorks from "@/components/modules/landing/HowItWorks";
import FAQ from "@/components/modules/landing/FAQ";
import CTA from "@/components/modules/landing/CTA";
import Contact from "@/components/modules/landing/Contact";
import Footer from "@/components/modules/landing/Footer";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Benefits />
        <Stats />
        <HowItWorks />
        <FAQ />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}