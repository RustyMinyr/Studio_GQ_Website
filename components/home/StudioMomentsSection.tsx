import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const studioMoments = [
  {
    src: "/images/gallery/portrait-man-standing.webp",
    alt: "Male talent posing inside Studio GQ",
    position: "object-[50%_35%]",
  },
  {
    src: "/images/gallery/hair-makeup.webp",
    alt: "Talent preparing in the Studio GQ hair and makeup area",
    position: "object-[52%_35%]",
  },
  {
    src: "/images/gallery/portrait-seated.webp",
    alt: "Seated portrait photographed at Studio GQ",
    position: "object-[55%_30%]",
  },
];

export function StudioMomentsSection() {
  return (
    <section
      aria-labelledby="studio-moments-heading"
      className="bg-[#050505] px-5 py-24 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <SectionLabel tone="dark">Inside Studio GQ</SectionLabel>
            <h2
              id="studio-moments-heading"
              className="mt-6 max-w-[12ch] text-[clamp(2.7rem,5vw,5rem)] font-normal leading-[0.96] tracking-[-0.045em]"
            >
              The space in motion.
            </h2>
          </div>
          <p className="max-w-[48ch] text-base leading-7 text-white/65 md:col-span-5 md:justify-self-end">
            From first setup to final frame, Studio GQ gives every production room
            to take shape. Move between portrait, motion, interview and content
            setups with space for talent, crew and the details that make the final
            image work.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {studioMoments.map((moment, index) => (
            <Reveal
              key={moment.src}
              delay={index * 0.05}
            >
              <figure className="relative aspect-[4/5] overflow-hidden bg-[#151515]">
                <Image
                  unoptimized
                  src={moment.src}
                  alt={moment.alt}
                  fill
                  sizes="(max-width: 639px) 50vw, 33vw"
                  className={`object-cover ${moment.position}`}
                />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
