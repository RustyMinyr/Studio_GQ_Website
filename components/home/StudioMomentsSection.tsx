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
    src: "/images/gallery/studio-content-hair-styling.jpg",
    alt: "Hair styling preparation inside Studio GQ",
    position: "object-[50%_35%]",
  },
  {
    src: "/images/gallery/studio-portrait-pair.jpg",
    alt: "Two models posing on the Studio GQ cyclorama",
    position: "object-[50%_35%]",
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

        <div className="mt-14 grid items-stretch gap-3 lg:aspect-[3/1] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-1.5 lg:h-full lg:grid-rows-2">
            {studioMoments.map((moment, index) => (
              <Reveal key={moment.src} delay={index * 0.04} className="lg:h-full">
                <figure className="relative aspect-square overflow-hidden bg-[#151515] lg:aspect-auto lg:h-full">
                  <Image
                    unoptimized
                    src={moment.src}
                    alt={moment.alt}
                    fill
                    sizes="(max-width: 1023px) 50vw, 17vw"
                    className={`object-cover ${moment.position}`}
                  />
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.12} className="h-full">
            <figure className="relative aspect-video h-full overflow-hidden bg-[#151515] lg:aspect-auto">
              <video
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                poster="/images/gallery/studio-gq-video-poster.jpg"
                aria-label="Studio GQ overview video"
              >
                <source src="/videos/studio-gq-overview.mp4" type="video/mp4" />
                Your browser does not support the video element.
              </video>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
