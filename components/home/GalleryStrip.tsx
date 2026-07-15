import Image from "next/image";
import Link from "next/link";

import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const galleryImages = [
  {
    src: "/images/gallery/portrait-man-standing.webp",
    alt: "Full-length studio portrait of a man wearing a black jacket",
    position: "object-[50%_35%]",
  },
  {
    src: "/images/gallery/studio-production-wide.webp",
    alt: "A wide view of a production in progress inside Studio GQ",
    position: "object-center",
  },
  {
    src: "/images/gallery/hair-makeup.webp",
    alt: "A stylist preparing talent in Studio GQ's hair and makeup area",
    position: "object-[52%_35%]",
  },
  {
    src: "/images/gallery/behind-the-scenes.webp",
    alt: "A behind-the-scenes view of a photographed set in progress",
    position: "object-center",
  },
  {
    src: "/images/gallery/hair-makeup-detail.webp",
    alt: "Close view of hair and makeup preparation before a shoot",
    position: "object-[50%_35%]",
  },
  {
    src: "/images/gallery/portrait-seated.webp",
    alt: "A seated studio portrait against a dark background",
    position: "object-[55%_30%]",
  },
];

export function GalleryStrip() {
  return (
    <section
      aria-labelledby="gallery-strip-heading"
      className="bg-white px-5 py-24 text-[#050505] sm:px-8 sm:py-28 lg:px-12 lg:py-36"
    >
      <div className="mx-auto grid w-full max-w-[1400px] gap-14 xl:grid-cols-[minmax(270px,0.34fr)_minmax(0,1fr)] xl:gap-12">
        <Reveal className="xl:pr-4">
          <SectionLabel tone="light">Spaces that inspire</SectionLabel>
          <h2
            id="gallery-strip-heading"
            className="mt-6 max-w-[11ch] text-[clamp(2.7rem,4.6vw,4.6rem)] font-normal leading-[0.97] tracking-[-0.045em]"
          >
            See the space. Imagine the possibilities.
          </h2>
          <div className="mt-9">
            <ArrowLink href="/gallery" variant="outline-dark">
              View full gallery
            </ArrowLink>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 2xl:grid-cols-6">
          {galleryImages.map((image, index) => (
            <Reveal key={image.src} delay={index * 0.05}>
              <Link
                href="/gallery"
                aria-label={`View the full gallery: ${image.alt}`}
                className="group relative block aspect-[3/4] min-h-[220px] overflow-hidden bg-[#e7e7e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#050505] sm:min-h-[300px] 2xl:min-h-[400px]"
              >
                <Image
                  unoptimized
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1536px) 12vw, (min-width: 640px) 28vw, 48vw"
                  className={`object-cover transition duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-95 ${image.position}`}
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
