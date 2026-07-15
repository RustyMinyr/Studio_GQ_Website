import Image from "next/image";

import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#050505] text-white"
    >
      <div className="absolute inset-y-0 right-0 -z-20 w-full lg:w-[72%] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_24%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_24%)] xl:w-[70%]">
        <Image
          unoptimized
          src="/images/hero-studio-gq.webp"
          alt="A model in a black dress photographed during a Studio GQ production"
          fill
          priority
          sizes="(min-width: 1280px) 70vw, (min-width: 1024px) 72vw, 100vw"
          className="object-cover object-center"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.92)_18%,rgba(0,0,0,0.66)_34%,rgba(0,0,0,0.34)_46%,rgba(0,0,0,0.08)_58%,rgba(0,0,0,0)_70%)] max-lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.93)_0%,rgba(0,0,0,0.76)_45%,rgba(0,0,0,0.24)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.03)_52%,rgba(0,0,0,0.18)_100%)] max-lg:bg-[linear-gradient(0deg,rgba(0,0,0,0.48)_0%,rgba(0,0,0,0.04)_52%,rgba(0,0,0,0.2)_100%)]"
      />

      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1400px] items-end px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:items-center lg:px-12 lg:pb-12 lg:pt-36">
        <div className="max-w-[760px]">
          <Reveal delay={0.05}>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/75 sm:text-[11px]">
              Photography <span aria-hidden="true">{"\u2022"}</span> Film{" "}
              <span aria-hidden="true">{"\u2022"}</span> Podcast{" "}
              <span aria-hidden="true">{"\u2022"}</span> Content
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <h1
              id="home-hero-heading"
              className="mt-6 max-w-[9ch] text-[clamp(3.5rem,8.2vw,7.25rem)] font-normal leading-[0.91] tracking-[-0.055em]"
            >
              Create Without Compromise.
            </h1>
          </Reveal>

          <Reveal delay={0.23}>
            <p className="mt-7 max-w-[590px] text-[15px] leading-7 text-white/70 sm:text-[17px] sm:leading-8">
              Studio GQ is a purpose-built creative space in Gqeberha for film,
              photography, podcasting, interviews, and content production.
            </p>
          </Reveal>

          <Reveal delay={0.32} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ArrowLink href="/contact" variant="light">
              Book the studio
            </ArrowLink>
            <ArrowLink href="/spaces" variant="outline-light">
              Explore the space
            </ArrowLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
