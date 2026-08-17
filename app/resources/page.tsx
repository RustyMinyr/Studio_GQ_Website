import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ResourceCard } from "@/components/content/ResourceCard";
import { WorkshopFeature } from "@/components/content/WorkshopFeature";
import { EasternCapeStrip } from "@/components/home/EasternCapeStrip";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { resourceArticles } from "@/lib/resources";

export const metadata: Metadata = {
  title: {
    absolute: "Film & Photography Production Guides | Studio GQ Learn",
  },
  description:
    "Practical guides for studio lighting, photography, video, interview sound, podcasts and greenscreen from Studio GQ in Gqeberha | Port Elizabeth, Eastern Cape.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Film & Photography Production Guides | Studio GQ Learn",
    description:
      "Practical production guides and free workshops from Studio GQ and FilmHouse in Gqeberha | Port Elizabeth, Eastern Cape.",
    url: "/resources",
    images: [
      {
        url: "/images/resources/learn-workshop-wide.webp",
        alt: "A practical production setup inside Studio GQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Film & Photography Production Guides | Studio GQ Learn",
    description: "Practical production guides and workshops from Gqeberha | Port Elizabeth, Eastern Cape.",
    images: ["/images/resources/learn-workshop-wide.webp"],
  },
};

export default function ResourcesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Studio GQ Learn"
        title="Learn the work by doing it."
        intro="Practical production guides from our film, video and photography studio in Gqeberha | Port Elizabeth, Eastern Cape—for cleaner results, clearer decisions and fewer surprises on set."
        size="compact"
      >
        <ArrowLink href="#articles" variant="outline-light">
          Browse the guides
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] py-20 text-[#050505] sm:py-24 lg:py-28">
        <div className="site-container">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>Learn together</SectionLabel>
              <h2 className="max-w-[10ch] text-[clamp(2.7rem,4.8vw,4.8rem)] font-normal leading-[0.95] tracking-[-0.05em]">
                The first workshop is coming soon.
              </h2>
            </div>
            <p className="max-w-[43ch] text-base leading-7 text-[#565656] lg:col-span-5 lg:justify-self-end">
              Studio GQ and FilmHouse are building practical, one-day learning
              sessions around real production skills and recognisable use cases.
            </p>
          </div>

          <div className="mt-12 grid items-stretch lg:grid-cols-12">
            <figure className="relative min-h-[24rem] overflow-hidden bg-[#dededb] lg:col-span-7 lg:min-h-[36rem]">
              <Image
                unoptimized
                src="/images/resources/learn-workshop-wide.webp"
                alt="A practical production setup with participants inside Studio GQ"
                fill
                loading="eager"
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover object-center"
              />
            </figure>
            <div className="h-full lg:col-span-5">
              <WorkshopFeature compact instance="resources" />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="articles-heading"
        className="scroll-mt-24 bg-white py-20 text-[#050505] sm:py-24 lg:py-32"
        id="articles"
      >
        <div className="site-container">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>Production resources</SectionLabel>
              <h2
                id="articles-heading"
                className="max-w-[11ch] text-[clamp(2.8rem,5vw,5rem)] font-normal leading-[0.95] tracking-[-0.05em]"
              >
                Clear answers for the next setup.
              </h2>
            </div>
            <p className="max-w-[44ch] text-base leading-7 text-[#565656] lg:col-span-5 lg:justify-self-end">
              Lighting, sound, podcasting, studio craft and planning—broken into
              useful decisions you can carry into a real production.
            </p>
          </div>

          <div className="mt-14 grid gap-x-12 lg:grid-cols-2">
            {resourceArticles.map((article, index) => (
              <ResourceCard
                article={article}
                index={index}
                key={article.slug}
                variant="visual"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#050505] py-20 text-white sm:py-24">
        <div className="site-container grid gap-9 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <SectionLabel tone="dark">Put it into practice</SectionLabel>
            <h2 className="max-w-[13ch] text-[clamp(2.7rem,4.8vw,4.8rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              Match the knowledge to the right space.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="max-w-[40ch] text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Explore the studio, facilities and production support available for
              photography, film, podcasts and content work.
            </p>
            <Link
              href="/services"
              className="mt-7 inline-flex min-h-12 items-center gap-4 border border-white/45 px-5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] transition-colors hover:bg-white hover:text-[#050505]"
            >
              Explore services <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/booking"
              className="ml-0 mt-3 inline-flex min-h-12 items-center gap-4 px-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] sm:ml-4 sm:mt-7"
            >
              Book the studio <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <EasternCapeStrip />
    </main>
  );
}
