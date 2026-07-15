import type { Metadata } from "next";

import { BookingBand } from "@/components/content/BookingBand";
import {
  GalleryLightbox,
  type GalleryItem,
} from "@/components/content/GalleryLightbox";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Studio Gallery in Gqeberha",
  description:
    "Explore photography, preparation and production moments captured inside Studio GQ in Gqeberha.",
  alternates: { canonical: "https://www.studiogq.co.za/gallery" },
  openGraph: { title: "Studio Gallery in Gqeberha", description: "Explore photography, preparation and production moments captured inside Studio GQ.", url: "/gallery" },
  twitter: { card: "summary_large_image", title: "Studio GQ Gallery", description: "Photography and production moments from inside Studio GQ." },
};

const galleryItems: GalleryItem[] = [
  {
    src: "/images/gallery/portrait-man-standing.webp",
    alt: "Standing studio portrait of a man in a black jacket",
    caption: "Studio portrait",
    width: 2020,
    height: 3030,
    size: "portrait",
  },
  {
    src: "/images/gallery/behind-the-scenes.webp",
    alt: "Portrait production photographed from behind the crew and lighting setup",
    caption: "Production in progress",
    width: 2996,
    height: 1997,
    size: "landscape",
  },
  {
    src: "/images/gallery/studio-production-wide.webp",
    alt: "Wide Studio GQ production view with a group on the white sweep and equipment visible",
    caption: "Studio production environment",
    width: 3244,
    height: 2163,
    size: "wide",
  },
  {
    src: "/images/gallery/hair-makeup-detail.webp",
    alt: "Close detail of a stylist preparing a model's hair before a shoot",
    caption: "Hair and makeup detail",
    width: 2182,
    height: 3273,
    size: "portrait",
  },
  {
    src: "/images/gallery/portrait-seated.webp",
    alt: "Seated studio portrait of a woman against a dark background",
    caption: "Seated portrait",
    width: 2124,
    height: 3186,
    size: "portrait",
  },
  {
    src: "/images/gallery/hair-makeup.webp",
    alt: "A stylist preparing a seated model in the hair and makeup area",
    caption: "Talent preparation",
    width: 2011,
    height: 3016,
    size: "portrait",
  },
  {
    src: "/images/gallery/portrait-seated-wide.webp",
    alt: "Full-length seated portrait of a woman in a white top against a dark studio background",
    caption: "Portrait study",
    width: 2336,
    height: 3504,
    size: "portrait",
  },
  {
    src: "/images/studio-infinity-curve-group.webp",
    alt: "Full studio view with a production group posed on a white sweep among lights and grip",
    caption: "On the studio floor",
    width: 3244,
    height: 2163,
    size: "landscape",
  },
];

export default function GalleryPage() {
  return (
    <main>
      <PageHero
        eyebrow="Gallery"
        intro="Portraits, preparation and production moments from inside Studio GQ—shown in their natural proportions."
        title={<>The space.<br />The work in motion.</>}
      >
        <ArrowLink href="/contact" variant="outline-light">
          Plan a shoot
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="mb-14 grid gap-8 border-b border-[#e7e7e4] pb-10 md:mb-20 md:grid-cols-12 md:pb-14">
            <div className="md:col-span-4">
              <SectionLabel>Inside Studio GQ</SectionLabel>
            </div>
            <p className="max-w-2xl leading-7 text-[#565656] md:col-span-7 md:col-start-6 md:text-lg md:leading-8">
              Select any image to open the full-screen viewer. Use the previous
              and next controls, or the left and right arrow keys, to move
              through the gallery.
            </p>
          </Reveal>
          <GalleryLightbox items={galleryItems} />
        </div>
      </section>

      <BookingBand title="Imagine what you could make here." />
    </main>
  );
}
