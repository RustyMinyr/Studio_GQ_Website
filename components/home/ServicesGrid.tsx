import {
  Aperture,
  AudioLines,
  Circle,
  Clapperboard,
  Lightbulb,
  MoveDiagonal2,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const services: Service[] = [
  {
    title: "Studio Hire",
    description: "Private, professional studios for hire.",
    icon: Aperture,
  },
  {
    title: "Infinity Curve",
    description: "Seamless cyclorama for clean, limitless shoots.",
    icon: Circle,
  },
  {
    title: "Podcast Studio",
    description: "Acoustically treated space for podcasting and interviews.",
    icon: AudioLines,
  },
  {
    title: "Flexible Shooting Spaces",
    description: "Versatile layouts designed to adapt to your creative vision.",
    icon: MoveDiagonal2,
  },
  {
    title: "Greenscreen Studio",
    description: "Precision greenscreen setup for film, video, and digital content.",
    icon: Clapperboard,
  },
  {
    title: "Hair / Makeup / Wardrobe",
    description: "On-site facilities to style and prepare talent.",
    icon: Sparkles,
  },
  {
    title: "Lighting & Grip",
    description: "Professional lighting and grip equipment available on-site.",
    icon: Lightbulb,
  },
  {
    title: "Production Support",
    description: "Experienced crew and support to bring your production to life.",
    icon: UsersRound,
  },
];

export function ServicesGrid() {
  return (
    <section
      aria-labelledby="services-heading"
      className="bg-[#f7f7f5] px-5 py-24 text-[#050505] sm:px-8 sm:py-28 lg:px-12 lg:py-36"
    >
      <div className="mx-auto grid w-full max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-4 lg:pr-10">
          <SectionLabel tone="light">Built for creators</SectionLabel>
          <h2
            id="services-heading"
            className="mt-6 max-w-[10ch] text-[clamp(2.7rem,4.8vw,4.75rem)] font-normal leading-[0.96] tracking-[-0.045em]"
          >
            Everything you need. Nothing you don&apos;t.
          </h2>
        </Reveal>

        <div className="border-t border-[#a7a7a3]/50 lg:col-span-8">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <Reveal
                  key={service.title}
                  delay={(index % 4) * 0.06}
                  className="border-b border-[#a7a7a3]/50 sm:border-r"
                >
                  <article className="flex min-h-[240px] flex-col px-1 py-8 pr-7 sm:min-h-[270px] sm:px-7 xl:min-h-[300px] xl:px-6">
                    <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.35} />
                    <div className="mt-auto pt-14">
                      <h3 className="text-lg font-normal tracking-[-0.02em]">
                        {service.title}
                      </h3>
                      <p className="mt-3 max-w-[26ch] text-sm leading-6 text-[#565656]">
                        {service.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
