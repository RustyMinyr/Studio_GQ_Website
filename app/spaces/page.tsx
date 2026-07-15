import type { Metadata } from "next";

import { BookingBand } from "@/components/content/BookingBand";
import { EditorialImage } from "@/components/content/EditorialImage";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Creative Studio Spaces in Gqeberha",
  description:
    "Explore Studio GQ's flexible production spaces for photography, film, podcasting, audio, greenscreen work and creative meetings.",
  alternates: { canonical: "https://www.studiogq.co.za/spaces" },
  openGraph: { title: "Creative Studio Spaces in Gqeberha", description: "Explore Studio GQ's flexible spaces for photography, film, podcasting and content production.", url: "/spaces" },
  twitter: { card: "summary_large_image", title: "Studio GQ Spaces", description: "Flexible spaces for photography, film, podcasting and content production." },
};

const spaces = [
  {
    number: "01",
    title: "Infinity curve",
    description:
      "A seamless white sweep for clean portrait, product, fashion and motion work, with room to shape light and compose wider frames.",
    details: ["Seamless cyclorama", "Flexible lighting positions", "Photo and motion use"],
  },
  {
    number: "02",
    title: "Downstairs flexible studio",
    description:
      "An adaptable working area that can be configured around the scale and rhythm of each production.",
    details: ["Adaptable layouts", "Crew-friendly access", "Content and commercial shoots"],
  },
  {
    number: "03",
    title: "Podcast and audio studio",
    description:
      "A dedicated environment for podcast conversations, interviews and spoken-word content. Ask about the best setup for your format.",
    details: ["Podcast recording", "Interview formats", "Audio support on request"],
  },
  {
    number: "04",
    title: "Greenscreen",
    description:
      "A controlled greenscreen setup for film, video and digital content, planned to suit the subject, frame and post-production workflow.",
    details: ["Controlled setup", "Video and digital content", "Pre-production planning advised"],
  },
  {
    number: "05",
    title: "Meeting space",
    description:
      "A practical place for briefings, reviews and collaboration before or during a production day.",
    details: ["Production briefings", "Client reviews", "Creative collaboration"],
  },
  {
    number: "06",
    title: "Hair, makeup and wardrobe",
    description:
      "An on-site preparation area where talent and wardrobe can be readied before stepping onto set.",
    details: ["Talent preparation", "Hair and makeup station", "Wardrobe support area"],
  },
];

export default function SpacesPage() {
  return (
    <main>
      <PageHero
        eyebrow="The spaces"
        intro="Purpose-built areas for capture, preparation and collaboration—adaptable to stills, motion, audio and content production."
        title={<>One studio.<br />Many ways to create.</>}
      >
        <ArrowLink href="/contact" variant="outline-light">
          Check availability
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionLabel>Studio environment</SectionLabel>
            <h2 className="mt-6 max-w-3xl text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Room to shape the production around the idea.
            </h2>
          </Reveal>
          <Reveal className="mt-14 md:mt-20">
            <EditorialImage
              alt="Wide view of a Studio GQ production setup with a white sweep, talent, lights and grip equipment"
              height={2163}
              src="/images/gallery/studio-production-wide.webp"
              width={3244}
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <SectionLabel>Explore the studio</SectionLabel>
          <div className="mt-10 border-t border-[#e7e7e4]">
            {spaces.map((space, index) => (
              <Reveal
                className="grid gap-6 border-b border-[#e7e7e4] py-10 md:grid-cols-12 md:gap-8 md:py-14"
                delay={(index % 2) * 0.04}
                key={space.title}
              >
                <p aria-hidden="true" className="text-xs tracking-[0.18em] text-[#565656] md:col-span-1">
                  {space.number}
                </p>
                <h2 className="text-3xl font-normal leading-none tracking-[-0.03em] sm:text-4xl md:col-span-4">
                  {space.title}
                </h2>
                <div className="max-w-xl md:col-span-4">
                  <p className="leading-7 text-[#565656] md:text-lg md:leading-8">{space.description}</p>
                  <ArrowLink className="mt-6" href="/contact" variant="outline-dark">
                    Enquire about {space.title}
                  </ArrowLink>
                </div>
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
        </div>
      </section>

      <section className="bg-[#151515] px-5 py-20 text-white md:px-8 md:py-28 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <EditorialImage
              alt="A stylist preparing talent at Studio GQ's hair and makeup area"
              height={3016}
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/images/gallery/hair-makeup.webp"
              width={2011}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <SectionLabel tone="dark">Before the camera rolls</SectionLabel>
            <h2 className="mt-6 text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Preparation belongs in the production plan.
            </h2>
            <p className="mt-8 max-w-xl leading-7 text-[#a7a7a3] md:text-lg md:leading-8">
              On-site hair, makeup and wardrobe facilities help talent prepare
              close to set, keeping the day coordinated and giving creative
              teams more time to focus on the frame.
            </p>
          </Reveal>
        </div>
      </section>

      <BookingBand title="Tell us what you need the space to do." />
    </main>
  );
}
