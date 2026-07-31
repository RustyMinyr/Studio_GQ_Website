import Image from "next/image";
import Link from "next/link";

import type { ResourceArticle } from "@/lib/resources";
import { getResourceVisual } from "@/lib/resource-visuals";

type ResourceCardProps = {
  article: ResourceArticle;
  index: number;
  tone?: "light" | "dark";
  variant?: "list" | "compact" | "visual";
};

export function ResourceCard({
  article,
  index,
  tone = "light",
  variant = "list",
}: ResourceCardProps) {
  const isDark = tone === "dark";

  if (variant === "visual") {
    const visual = getResourceVisual(article.slug);

    return (
      <article className="group border-t border-[#a7a7a3]/55 text-[#050505]">
        <Link
          href={`/resources/${article.slug}`}
          className="block py-8 transition-colors hover:text-[#565656] sm:py-9"
        >
          <figure className="relative aspect-[16/10] overflow-hidden bg-[#ededeb]">
            <Image
              unoptimized
              src={visual.src}
              alt={visual.alt}
              fill
              loading={index === 0 ? "eager" : "lazy"}
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
              style={{ objectPosition: visual.position ?? "center" }}
            />
          </figure>
          <div className="mt-6 grid grid-cols-[2.75rem_1fr] gap-4 sm:grid-cols-[3.5rem_1fr] sm:gap-5">
            <span
              aria-hidden="true"
              className="pt-1 text-[0.65rem] font-semibold tracking-[0.16em] text-[#787874]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-[#565656]">
                <span>{article.category}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readTimeMinutes} min read</span>
              </div>
              <h3 className="mt-3 max-w-[28ch] text-[clamp(1.5rem,2.35vw,2.35rem)] font-normal leading-[1.04] tracking-[-0.038em] text-[#050505]">
                {article.title}
              </h3>
              <p className="mt-4 max-w-[54ch] text-sm leading-6 text-[#565656]">
                {article.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#050505]">
                Read article
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex flex-1 border-t border-[#a7a7a3]/45 first:border-t-0">
        <Link
          href={`/resources/${article.slug}`}
          className="grid min-h-[9.25rem] w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-5 py-5 transition-colors hover:bg-[#f7f7f5] sm:grid-cols-[3.25rem_1fr_auto] sm:px-7"
        >
          <span
            aria-hidden="true"
            className="self-start pt-1 text-[0.65rem] font-semibold tracking-[0.16em] text-[#787874]"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="self-center">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-[#565656]">
              <span>{article.category}</span>
              <span aria-hidden="true">·</span>
              <span>{article.readTimeMinutes} min</span>
            </div>
            <h3 className="mt-3 max-w-[30ch] text-[clamp(1.25rem,1.8vw,1.75rem)] font-normal leading-[1.05] tracking-[-0.035em]">
              {article.title}
            </h3>
            <p className="mt-3 hidden max-w-[54ch] text-sm leading-6 text-[#565656] xl:block">
              {article.description}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="text-lg transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </article>
    );
  }

  return (
    <article
      className={`group border-t ${
        isDark ? "border-white/25 text-white" : "border-[#a7a7a3]/55 text-[#050505]"
      }`}
    >
      <Link
        href={`/resources/${article.slug}`}
        className={`grid min-h-full gap-7 py-8 transition-colors sm:grid-cols-[4rem_1fr] sm:py-9 ${
          isDark ? "hover:text-white/70" : "hover:text-[#565656]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`text-xs font-semibold tracking-[0.16em] ${
            isDark ? "text-white/45" : "text-[#787874]"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
            <span>{article.category}</span>
            <span aria-hidden="true">·</span>
            <span>{article.readTimeMinutes} min read</span>
          </div>
          <h3 className="mt-4 max-w-[24ch] text-[clamp(1.55rem,2.4vw,2.4rem)] font-normal leading-[1.04] tracking-[-0.035em]">
            {article.title}
          </h3>
          <p
            className={`mt-4 max-w-[52ch] text-sm leading-6 ${
              isDark ? "text-white/60" : "text-[#565656]"
            }`}
          >
            {article.description}
          </p>
          <span className="mt-6 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]">
            Read article
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
