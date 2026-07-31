import Link from "next/link";

import type { StudioService } from "@/lib/services";

export function ServiceCard({
  service,
  index,
}: {
  service: StudioService;
  index: number;
}) {
  return (
    <article className="group border-t border-[#a7a7a3]/55">
      <Link
        href={`/services/${service.slug}`}
        className="grid min-h-[20rem] grid-rows-[auto_1fr_auto] gap-8 py-8 transition-colors hover:bg-white sm:px-6 sm:py-10"
      >
        <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#565656]">
          <span>{service.eyebrow}</span>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div>
          <h2 className="max-w-[12ch] text-[clamp(2rem,3vw,3.35rem)] font-normal leading-[0.96] tracking-[-0.045em]">
            {service.title}
          </h2>
          <p className="mt-5 max-w-[44ch] text-sm leading-6 text-[#565656]">
            {service.description}
          </p>
        </div>
        <span className="inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]">
          Explore service
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </Link>
    </article>
  );
}
