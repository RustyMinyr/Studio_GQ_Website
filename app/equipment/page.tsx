import type { Metadata } from "next";

import { BookingBand } from "@/components/content/BookingBand";
import { EditorialImage } from "@/components/content/EditorialImage";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Equipment & Production Support",
  description:
    "Plan your Studio GQ production with access to lighting, grip, stands, backdrops, audio, podcast equipment and production support.",
  alternates: { canonical: "https://www.studiogq.co.za/equipment" },
  openGraph: { title: "Equipment & Production Support", description: "Plan your Studio GQ production with practical equipment options and experienced support.", url: "/equipment" },
  twitter: { card: "summary_large_image", title: "Studio GQ Equipment & Support", description: "Practical equipment options and experienced production support." },
};

const categories = [
  ["Lighting", "Flexible lighting options for portrait, product, interview and motion setups."],
  ["Grip", "Grip equipment to help shape, control and support the lighting plan."],
  ["Stands", "A working selection of stands for lighting, modifiers and production accessories."],
  ["Backdrops", "Backdrop options for different looks, subject sizes and capture requirements."],
  ["Audio", "Audio resources for interviews, dialogue and selected content formats."],
  ["Podcast equipment", "Equipment support for podcast conversations and recorded interviews."],
  ["Production support", "Experienced assistance can be arranged around the needs of the brief."],
];

export default function EquipmentPage() {
  return (
    <main>
      <PageHero
        eyebrow="Equipment & support"
        intro="A practical equipment base and experienced production support, coordinated around the needs of each shoot."
        title={<>The right tools.<br />A considered setup.</>}
      >
        <ArrowLink href="/contact" variant="outline-light">
          Discuss your equipment list
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-4">
            <SectionLabel>Available categories</SectionLabel>
            <h2 className="mt-6 text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Build the kit around the shot.
            </h2>
            <p className="mt-8 max-w-md leading-7 text-[#565656] md:text-lg md:leading-8">
              Equipment availability can vary by date and may depend on the
              needs of other productions. Share your working list early so the
              Studio GQ team can confirm what is available and identify any
              additional requirements.
            </p>
          </Reveal>
          <div className="border-t border-[#a7a7a3] lg:col-span-7 lg:col-start-6">
            {categories.map(([title, description], index) => (
              <Reveal
                className="grid gap-4 border-b border-[#a7a7a3] py-7 sm:grid-cols-12 sm:gap-6 md:py-9"
                delay={(index % 2) * 0.04}
                key={title}
              >
                <span aria-hidden="true" className="text-xs tracking-[0.18em] text-[#565656] sm:col-span-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-normal tracking-[-0.03em] sm:col-span-4">
                  {title}
                </h3>
                <p className="leading-7 text-[#565656] sm:col-span-7">{description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#050505] px-5 py-20 text-white md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] items-end gap-12 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <EditorialImage
              alt="A Studio GQ production setup with lights, stands and grip visible around the shooting area"
              className="aspect-[3/2] object-cover"
              height={2163}
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/images/studio-infinity-curve-group.webp"
              width={3244}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <SectionLabel tone="dark">Plan before the shoot</SectionLabel>
            <h2 className="mt-6 text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Confirm the complete package with your booking.
            </h2>
            <p className="mt-8 max-w-xl leading-7 text-[#a7a7a3] md:text-lg md:leading-8">
              Your booking enquiry is the best place to note the intended
              format, crew size and equipment needs. The team will confirm what
              is included, what can be hired and whether additional crew or
              specialist support should be arranged.
            </p>
            <ArrowLink className="mt-8" href="/faq" variant="outline-light">
              Read frequently asked questions
            </ArrowLink>
          </Reveal>
        </div>
      </section>

      <BookingBand title="Start with the brief. We’ll help shape the setup." />
    </main>
  );
}
