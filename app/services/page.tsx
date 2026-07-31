import type { Metadata } from "next";
import Image from "next/image";

import { ServiceCard } from "@/components/content/ServiceCard";
import { EasternCapeStrip } from "@/components/home/EasternCapeStrip";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { studioServices } from "@/lib/services";

export const metadata: Metadata = {
  title: {
    absolute: "Studio Services in Gqeberha | Studio GQ",
  },
  description:
    "Explore Studio GQ services for studio hire, photography, film, podcasts, greenscreen, infinity curve, equipment and production support in Gqeberha.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Studio Services in Gqeberha | Studio GQ",
    description:
      "A purpose-built production studio for photography, film, podcasts, greenscreen and content creation in Gqeberha.",
    url: "/services",
    images: [{ url: "/images/gallery/studio-production-wide.webp", alt: "A production team working inside Studio GQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Services in Gqeberha | Studio GQ",
    description: "A purpose-built production studio for photography, film, podcasts, greenscreen and content creation in Gqeberha.",
    images: ["/images/gallery/studio-production-wide.webp"],
  },
};

export default function ServicesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Studio services"
        title="A space designed around the shot."
        intro="Choose the studio, specialist facility and level of support that fits the production. Every booking starts with the brief, then builds around the work."
      >
        <ArrowLink href="/booking" variant="outline-light">
          Book the studio
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] py-24 text-[#050505] sm:py-28 lg:py-32">
        <div className="site-container">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>Production, considered together</SectionLabel>
              <h2 className="max-w-[11ch] text-[clamp(2.8rem,5vw,5rem)] font-normal leading-[0.95] tracking-[-0.05em]">
                Five ways to build the day.
              </h2>
            </div>
            <p className="max-w-[46ch] text-base leading-7 text-[#565656] lg:col-span-5 lg:justify-self-end">
              Start with the production type, then add the studio features,
              equipment and people it needs. Final availability and inclusions are
              confirmed for each booking.
            </p>
          </div>

          <div className="mt-14 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            {studioServices.map((service, index) => (
              <ServiceCard service={service} index={index} key={service.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#050505] py-20 text-white sm:py-24 lg:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionLabel tone="dark">One working environment</SectionLabel>
            <h2 className="max-w-[10ch] text-[clamp(2.7rem,4.8vw,4.8rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              Move from setup to final frame.
            </h2>
            <p className="mt-6 max-w-[42ch] text-base leading-7 text-white/65">
              Plan camera, lighting, sound, talent preparation and production
              support as one workflow—without losing time between separate spaces.
            </p>
          </div>
          <figure className="relative aspect-[16/10] overflow-hidden bg-[#151515] lg:col-span-7">
            <Image
              unoptimized
              src="/images/gallery/studio-production-wide.webp"
              alt="Studio GQ production setup on the infinity curve"
              fill
              sizes="(max-width: 1023px) 100vw, 58vw"
              className="object-cover object-center"
            />
          </figure>
        </div>
      </section>

      <EasternCapeStrip />
    </main>
  );
}
