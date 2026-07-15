import type { Metadata } from "next";

import { AboutStudio } from "@/components/home/AboutStudio";
import { BookingCta } from "@/components/home/BookingCta";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { Hero } from "@/components/home/Hero";
import { ServicesGrid } from "@/components/home/ServicesGrid";

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
      <GalleryStrip />
      <BookingCta />
    </main>
  );
}
