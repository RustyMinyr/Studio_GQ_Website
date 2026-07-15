import Image from "next/image";

import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function AboutStudio() {
  return (
    <section
      aria-labelledby="about-studio-heading"
      className="scroll-mt-24 bg-[#050505] px-5 py-24 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-36"
      id="about"
    >
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-14 lg:grid-cols-12 lg:gap-16 xl:gap-24">
        <Reveal className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10] lg:aspect-[5/4] xl:aspect-[16/11]">
            <Image
              unoptimized
              src="/images/studio-infinity-curve-group.webp"
              alt="Models and production equipment arranged around Studio GQ's infinity curve"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </Reveal>

        <Reveal delay={0.12} className="lg:col-span-5">
          <SectionLabel tone="dark">About the space</SectionLabel>
          <h2
            id="about-studio-heading"
            className="mt-6 max-w-[11ch] text-[clamp(2.7rem,4.7vw,4.75rem)] font-normal leading-[0.97] tracking-[-0.045em]"
          >
            A space designed for creative freedom.
          </h2>
          <p className="mt-7 max-w-[560px] text-[15px] leading-7 text-[#a7a7a3] sm:text-[17px] sm:leading-8">
            Every detail of Studio GQ was built with intention. From our seamless
            infinity curve to our fully equipped podcast studio, every element is
            here to help you focus on what matters most{"\u2014"}your creative work.
          </p>
          <div className="mt-9">
            <ArrowLink href="#equipment" variant="outline-light">
              Explore equipment & support
            </ArrowLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
