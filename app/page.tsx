import type { Metadata } from "next";

import { AboutStudio } from "@/components/home/AboutStudio";
import { ContactSection } from "@/components/home/ContactSection";
import { EquipmentSection } from "@/components/home/EquipmentSection";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { StudioMomentsSection } from "@/components/home/StudioMomentsSection";

export const metadata: Metadata = {
  title: {
    absolute: "Studio GQ | Film, Photography & Podcast Studio in Gqeberha",
  },
  description:
    "Studio GQ is a purpose-built film, photography, podcast, greenscreen and content production studio available for hire in Gqeberha, Eastern Cape.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <ServicesGrid />
      <AboutStudio />
      <EquipmentSection />
      <StudioMomentsSection />
      <FaqSection />
      <ContactSection />
      <div aria-hidden="true" className="h-16 bg-white sm:h-20 lg:h-24" />
    </main>
  );
}
