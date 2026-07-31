import Link from "next/link";
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

import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

const services: Service[] = [
  {
    title: "Studio Hire",
    description: "Private, professional studios for hire.",
    icon: Aperture,
    href: "/services/studio-hire",
  },
  {
    title: "Infinity Curve",
    description: "Seamless cyclorama for clean, limitless shoots.",
    icon: Circle,
    href: "/services/greenscreen-infinity-curve",
  },
  {
    title: "Podcast Studio",
    description: "Acoustically treated space for podcasting and interviews.",
    icon: AudioLines,
    href: "/services/podcast-studio",
  },
  {
    title: "Flexible Shooting Spaces",
    description: "Versatile layouts designed to adapt to your creative vision.",
    icon: MoveDiagonal2,
    href: "/services/photography-film",
  },
  {
    title: "Greenscreen Studio",
    description: "Precision greenscreen setup for film, video, and digital content.",
    icon: Clapperboard,
    href: "/services/greenscreen-infinity-curve",
  },
  {
    title: "Hair / Makeup / Wardrobe",
    description: "On-site facilities to style and prepare talent.",
    icon: Sparkles,
    href: "/services/studio-hire",
  },
  {
    title: "Lighting & Grip",
    description: "Professional lighting and grip equipment available on-site.",
    icon: Lightbulb,
    href: "/services/equipment-production-support",
  },
  {
    title: "Production Support",
    description: "Experienced crew and support to bring your production to life.",
    icon: UsersRound,
    href: "/services/equipment-production-support",
  },
];

export function ServicesGrid() {
  return (
    <section
      aria-labelledby="services-heading"
      className="scroll-mt-24 bg-[#f7f7f5] py-24 text-[#050505] sm:py-28 lg:py-36"
      id="services"
    >
      <div className="site-container grid gap-14 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-4 lg:pr-10">
          <SectionLabel tone="light">Built for creators</SectionLabel>
          <h2
            id="services-heading"
            className="mt-6 max-w-[10ch] text-[clamp(2.7rem,4.8vw,4.75rem)] font-normal leading-[0.96] tracking-[-0.045em]"
          >
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-7 max-w-[34ch] text-base leading-7 text-[#565656]">
            From adaptable studio spaces and specialist facilities to lighting, grip and
            production support, everything is ready to help your shoot run smoothly.
          </p>
          <ArrowLink className="mt-8" href="/services" variant="outline-dark">
            Explore all services
          </ArrowLink>
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
                  <Link
                    href={service.href}
                    className="group flex min-h-[240px] flex-col px-5 py-8 transition-colors hover:bg-white focus-visible:bg-white sm:min-h-[270px] sm:px-7 xl:min-h-[300px] xl:px-6"
                    aria-label={`Explore ${service.title}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="mx-auto h-10 w-10 sm:h-11 sm:w-11"
                      strokeWidth={1.25}
                    />
                    <div className="pt-14 text-center">
                      <h3 className="h-14 text-lg font-normal leading-7 tracking-[-0.02em]">
                        {service.title}
                      </h3>
                      <p className="mx-auto mt-3 max-w-[26ch] text-sm leading-6 text-[#565656]">
                        {service.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#565656] transition-colors group-hover:text-[#050505]">
                        Explore service <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
