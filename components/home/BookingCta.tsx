import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function BookingCta() {
  return (
    <section
      aria-labelledby="booking-cta-heading"
      className="border-b border-white/15 bg-[#050505] px-5 py-28 text-center text-white sm:px-8 sm:py-36 lg:px-12 lg:py-44"
    >
      <Reveal className="mx-auto flex max-w-[920px] flex-col items-center">
        <SectionLabel tone="dark">Ready to create?</SectionLabel>
        <h2
          id="booking-cta-heading"
          className="mt-7 text-[clamp(2.8rem,5.7vw,5.75rem)] font-normal leading-[0.96] tracking-[-0.05em]"
        >
          Book your next production at Studio GQ.
        </h2>
        <div className="mt-10">
          <ArrowLink href="/contact" variant="light">
            Book the studio
          </ArrowLink>
        </div>
      </Reveal>
    </section>
  );
}
