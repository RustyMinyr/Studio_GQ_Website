import type { Metadata } from "next";

import { AboutStudio } from "@/components/home/AboutStudio";
import { ContactSection } from "@/components/home/ContactSection";
import { EasternCapeStrip } from "@/components/home/EasternCapeStrip";
import { EquipmentSection } from "@/components/home/EquipmentSection";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
import { LearnSection } from "@/components/home/LearnSection";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { StudioMomentsSection } from "@/components/home/StudioMomentsSection";
import { siteUrl } from "@/lib/site-content";

export const metadata: Metadata = {
  title: {
    absolute: "Film, Video & Photography Studio Port Elizabeth | Studio GQ",
  },
  description:
    "Studio GQ is a purpose-built film, video and photography studio in Gqeberha | Port Elizabeth, Eastern Cape, with podcast, greenscreen and production support.",
  alternates: {
    canonical: "/",
  },
};

const tourVideo = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "@id": `${siteUrl}/#studio-tour-video`,
  name: "Studio GQ Tour",
  description:
    "Tour Studio GQ's film, video, photography, podcast and greenscreen production space in Gqeberha | Port Elizabeth, Eastern Cape.",
  thumbnailUrl: `${siteUrl}/images/gallery/studio-gq-tour-poster.jpg`,
  uploadDate: "2026-07-17T00:02:34+02:00",
  duration: "PT2M6S",
  contentUrl: `${siteUrl}/videos/studio-gq-tour.mp4`,
  inLanguage: "en-ZA",
  isFamilyFriendly: true,
  publisher: {
    "@type": "Organization",
    "@id": `${siteUrl}/#studio`,
    name: "Studio GQ",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logos/studio-gq-black.png`,
    },
  },
  potentialAction: {
    "@type": "WatchAction",
    target: `${siteUrl}/#about`,
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
      <LearnSection />
      <FaqSection />
      <ContactSection />
      <EasternCapeStrip />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tourVideo) }}
      />
    </main>
  );
}
