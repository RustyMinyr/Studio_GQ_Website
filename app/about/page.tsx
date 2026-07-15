import type { Metadata } from "next";

import { BookingBand } from "@/components/content/BookingBand";
import { EditorialImage } from "@/components/content/EditorialImage";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "About | Purpose-Built Creative Studio",
  description:
    "Discover Studio GQ, a purpose-built film, photography, podcast and content production studio in Gqeberha.",
  alternates: { canonical: "https://www.studiogq.co.za/about" },
  openGraph: { title: "About | Purpose-Built Creative Studio", description: "Discover Studio GQ, a purpose-built creative production studio in Gqeberha.", url: "/about" },
  twitter: { card: "summary_large_image", title: "About Studio GQ", description: "A purpose-built creative production studio in Gqeberha." },
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Studio GQ"
        intro="A considered production environment in Gqeberha, built to give creative teams the space, support and focus to do their best work."
        title={<>Built with purpose.<br />Run with care.</>}
      >
        <ArrowLink href="/spaces" variant="outline-light">
          Explore the spaces
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <SectionLabel>Our story</SectionLabel>
            <h2 className="mt-6 max-w-xl text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              A practical home for ambitious creative work.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.08}>
            <div className="space-y-6 text-base leading-7 text-[#565656] md:text-lg md:leading-8">
              <p>
                Studio GQ was created for photographers, filmmakers, producers,
                podcasters and content teams who need more than an empty room.
                The studio brings adaptable shooting areas, preparation space
                and production support together in one professional setting.
              </p>
              <p>
                Based in Gqeberha, the studio is purpose-built for the realities
                of a working production day: changing briefs, different crew
                sizes and the need to move from preparation to capture without
                losing momentum.
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mx-auto mt-16 max-w-[1400px] md:mt-24">
          <EditorialImage
            alt="A production group posed on a white studio sweep with lighting and grip equipment visible"
            height={2163}
            src="/images/studio-infinity-curve-group.webp"
            width={3244}
          />
        </Reveal>
      </section>

      <section className="bg-[#050505] px-5 py-20 text-white md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] items-start gap-14 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <EditorialImage
              alt="A portrait production in progress, photographed from behind the crew"
              className="aspect-[3/2] object-cover"
              height={1997}
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/images/gallery/behind-the-scenes.webp"
              width={2996}
            />
          </Reveal>
          <Reveal className="lg:pt-12" delay={0.08}>
            <SectionLabel tone="dark">Part of a production ecosystem</SectionLabel>
            <h2 className="mt-6 text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Connected to FilmHouse. Focused on the studio floor.
            </h2>
            <p className="mt-8 max-w-xl text-base leading-7 text-[#a7a7a3] md:text-lg md:leading-8">
              Studio GQ shares a production-minded approach with FilmHouse:
              careful planning, experienced support and respect for the work.
              That connection helps visiting teams move from an idea to a
              well-run shoot with fewer distractions.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <Reveal className="mx-auto grid max-w-[1400px] gap-10 border-t border-[#e7e7e4] pt-10 md:grid-cols-12 md:pt-14">
          <div className="md:col-span-4">
            <SectionLabel>Production support</SectionLabel>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <h2 className="text-3xl font-normal leading-[1.08] tracking-[-0.03em] sm:text-4xl">
              Support that meets the scale of the brief.
            </h2>
            <p className="mt-6 max-w-2xl leading-7 text-[#565656] md:text-lg md:leading-8">
              From space planning and equipment coordination to experienced
              crew support, the Studio GQ team can help shape a practical setup
              for your production. Tell us what you are making and what support
              you need when you enquire.
            </p>
            <ArrowLink className="mt-8" href="/contact" variant="outline-dark">
              Discuss your production
            </ArrowLink>
          </div>
        </Reveal>
      </section>

      <BookingBand />
    </main>
  );
}
