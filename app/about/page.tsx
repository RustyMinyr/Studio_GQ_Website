import type { Metadata } from "next";

import { BookingBand } from "@/components/content/BookingBand";
import { EditorialImage } from "@/components/content/EditorialImage";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "About & Spaces | Purpose-Built Creative Studio",
  description:
    "Discover Studio GQ, a purpose-built film, photography, podcast and content production studio in Gqeberha.",
  alternates: { canonical: "https://www.studiogq.co.za/about" },
  openGraph: { title: "About | Purpose-Built Creative Studio", description: "Discover Studio GQ, a purpose-built creative production studio in Gqeberha.", url: "/about" },
  twitter: { card: "summary_large_image", title: "About Studio GQ", description: "A purpose-built creative production studio in Gqeberha." },
};

const spaces = [
  {
    number: "01",
    title: "Infinity curve",
    description: "A seamless white sweep for portrait, product, fashion and motion work, with room to shape light and compose wider frames.",
    details: ["Seamless cyclorama", "Flexible lighting positions", "Photo and motion use"],
  },
  {
    number: "02",
    title: "Flexible studio",
    description: "An adaptable working area that can be configured around the scale and rhythm of each production.",
    details: ["Adaptable layouts", "Crew-friendly access", "Commercial and content shoots"],
  },
  {
    number: "03",
    title: "Podcast and audio studio",
    description: "A dedicated environment for podcast conversations, interviews and spoken-word content.",
    details: ["Podcast recording", "Interview formats", "Audio support on request"],
  },
  {
    number: "04",
    title: "Greenscreen",
    description: "A controlled greenscreen setup for film, video and digital content, planned around the frame and post-production workflow.",
    details: ["Controlled setup", "Video and digital content", "Pre-production planning"],
  },
  {
    number: "05",
    title: "Meeting space",
    description: "A practical place for briefings, reviews and collaboration before or during a production day.",
    details: ["Production briefings", "Client reviews", "Creative collaboration"],
  },
  {
    number: "06",
    title: "Hair, makeup and wardrobe",
    description: "An on-site preparation area where talent and wardrobe can be readied before stepping onto set.",
    details: ["Talent preparation", "Hair and makeup station", "Wardrobe support area"],
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About Studio GQ"
        intro="A considered production environment in Gqeberha, built to give creative teams the space, support and focus to do their best work."
        title={<>Built with purpose.<br />Run with care.</>}
      >
        <ArrowLink href="#spaces" variant="outline-light">
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

      <section id="spaces" className="scroll-mt-24 bg-white px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionLabel>The spaces</SectionLabel>
            <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
              <h2 className="max-w-3xl text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:col-span-7 lg:text-6xl">
                One studio. Many ways to create.
              </h2>
              <p className="max-w-xl leading-7 text-[#565656] md:text-lg md:leading-8 lg:col-span-4 lg:col-start-9">
                Purpose-built areas for capture, preparation and collaboration,
                adaptable to stills, motion, audio and content production.
              </p>
            </div>
          </Reveal>

          <Reveal className="mt-14 md:mt-20">
            <EditorialImage
              alt="Wide view of a Studio GQ production setup with a white sweep, talent, lights and grip equipment"
              height={2163}
              src="/images/gallery/studio-production-wide.webp"
              width={3244}
            />
          </Reveal>

          <div className="mt-16 border-t border-[#e7e7e4] md:mt-24">
            {spaces.map((space, index) => (
              <Reveal
                className="grid gap-6 border-b border-[#e7e7e4] py-10 md:grid-cols-12 md:gap-8 md:py-12"
                delay={(index % 2) * 0.04}
                key={space.title}
              >
                <p aria-hidden="true" className="text-xs tracking-[0.18em] text-[#565656] md:col-span-1">
                  {space.number}
                </p>
                <h3 className="text-3xl font-normal leading-none tracking-[-0.03em] sm:text-4xl md:col-span-4">
                  {space.title}
                </h3>
                <p className="max-w-xl leading-7 text-[#565656] md:col-span-4 md:text-lg md:leading-8">
                  {space.description}
                </p>
                <ul className="space-y-3 text-sm md:col-span-3" aria-label={`${space.title} key details`}>
                  {space.details.map((detail) => (
                    <li className="border-t border-[#e7e7e4] pt-3" key={detail}>
                      {detail}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <ArrowLink className="mt-10" href="/contact" variant="outline-dark">
            Check availability
          </ArrowLink>
        </div>
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
