import { ResourceCard } from "@/components/content/ResourceCard";
import { WorkshopFeature } from "@/components/content/WorkshopFeature";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { featuredResourceArticles } from "@/lib/resources";

export function LearnSection() {
  return (
    <section
      aria-labelledby="learn-heading"
      className="scroll-mt-24 bg-[#f7f7f5] py-24 text-[#050505] sm:py-28 lg:py-36"
      id="learn"
    >
      <div className="site-container">
        <Reveal>
          <SectionLabel>Learn at Studio GQ</SectionLabel>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <h2
              id="learn-heading"
              className="max-w-[11ch] text-[clamp(2.8rem,5.4vw,5.5rem)] font-normal leading-[0.94] tracking-[-0.05em] lg:col-span-8"
            >
              Practical knowledge. Built for the work.
            </h2>
            <div className="border-t border-[#a7a7a3]/55 pt-6 lg:col-span-4 lg:justify-self-end">
              <p className="max-w-[44ch] text-base leading-7 text-[#565656]">
                Clear guides for better lighting, cleaner sound and more efficient
                studio days—written around decisions you can use on the next shoot.
              </p>
              <ArrowLink className="mt-8" href="/resources" variant="outline-dark">
                Explore Learn
              </ArrowLink>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-12 lg:gap-0">
          <Reveal className="h-full lg:col-span-5">
            <WorkshopFeature compact />
          </Reveal>
          <div className="flex h-full flex-col border border-[#a7a7a3]/55 bg-white lg:col-span-7 lg:border-l-0">
            <div className="flex min-h-[5.5rem] items-center justify-between gap-6 px-5 py-5 sm:px-7">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#565656]">
                  Latest from Learn
                </p>
                <p className="mt-2 text-sm text-[#565656]">
                  Three practical guides to start with.
                </p>
              </div>
              <ArrowLink href="/resources" variant="outline-dark" className="shrink-0">
                View all
              </ArrowLink>
            </div>
            <div className="flex flex-1 flex-col border-t border-[#a7a7a3]/55">
              {featuredResourceArticles.map((article, index) => (
                <ResourceCard
                  article={article}
                  index={index}
                  key={article.slug}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
