import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { EditorialCta } from "@/components/content/EditorialCta";
import { ResourceCard } from "@/components/content/ResourceCard";
import { EasternCapeStrip } from "@/components/home/EasternCapeStrip";
import { PageHero } from "@/components/ui/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getResourceVisual } from "@/lib/resource-visuals";
import { getResourceArticle, resourceArticles } from "@/lib/resources";
import { getStudioService } from "@/lib/services";
import { siteUrl } from "@/lib/site-content";

type ResourcePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return resourceArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getResourceArticle(slug);
  if (!article) return {};

  const path = `/resources/${article.slug}`;
  const visual = getResourceVisual(article.slug);

  return {
    title: article.seoTitle,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${article.seoTitle} | Studio GQ`,
      description: article.description,
      url: path,
      publishedTime: article.publishedAt,
      modifiedTime: article.publishedAt,
      authors: ["Studio GQ"],
      images: [
        {
          url: visual.src,
          alt: visual.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.seoTitle} | Studio GQ`,
      description: article.description,
      images: [visual.src],
    },
  };
}

function formatPublicationDate(date: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(`${date}T12:00:00+02:00`));
}

export default async function ResourceArticlePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const article = getResourceArticle(slug);
  if (!article) notFound();

  const visual = getResourceVisual(article.slug);
  const relatedService = getStudioService(article.relatedServiceSlug);
  const relatedArticles = article.relatedResourceSlugs.flatMap((relatedSlug) => {
    const relatedArticle = getResourceArticle(relatedSlug);
    return relatedArticle && relatedArticle.slug !== article.slug ? [relatedArticle] : [];
  });
  const canonical = `${siteUrl}/resources/${article.slug}`;
  const displayDate = formatPublicationDate(article.publishedAt);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        headline: article.title,
        description: article.description,
        url: canonical,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        image: `${siteUrl}${visual.src}`,
        author: {
          "@type": "Organization",
          "@id": `${siteUrl}/#studio`,
          name: "Studio GQ",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          "@id": `${siteUrl}/#studio`,
          name: "Studio GQ",
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/logos/studio-gq-black.png`,
          },
        },
        mainEntityOfPage: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Learn",
            item: `${siteUrl}/resources`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <PageHero eyebrow={article.category} title={article.title} intro={article.description}>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/65">
          <time dateTime={article.publishedAt}>{displayDate}</time>
          <span aria-hidden="true">·</span>
          <span>{article.readTimeMinutes} min read</span>
        </div>
      </PageHero>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Learn", href: "/resources" },
          { label: article.title },
        ]}
      />

      <div className="bg-[#050505] pb-8 sm:pb-12">
        <figure className="site-container relative aspect-[16/7] min-h-[18rem] overflow-hidden bg-[#151515]">
          <Image
            unoptimized
            src={visual.src}
            alt={visual.alt}
            fill
            loading="eager"
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: visual.position ?? "center" }}
          />
        </figure>
      </div>

      <article className="bg-white py-20 text-[#050505] sm:py-24 lg:py-32">
        <div className="site-container grid gap-14 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-3">
            <SectionLabel>In this guide</SectionLabel>
            <ol className="border-t border-[#a7a7a3]/55">
              {article.sections.map((section, index) => (
                <li className="border-b border-[#a7a7a3]/55 py-4" key={section.heading}>
                  <a
                    href={`#section-${index + 1}`}
                    className="grid grid-cols-[2rem_1fr] gap-2 text-xs leading-5 transition-colors hover:text-[#565656]"
                  >
                    <span className="text-[0.62rem] font-semibold tracking-[0.14em] text-[#787874]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{section.heading}</span>
                  </a>
                </li>
              ))}
              <li className="border-b border-[#a7a7a3]/55 py-4">
                <a
                  className="grid grid-cols-[2rem_1fr] gap-2 text-xs leading-5 transition-colors hover:text-[#565656]"
                  href="#practical-checklist"
                >
                  <span className="text-[0.62rem] font-semibold tracking-[0.14em] text-[#787874]">
                    ✓
                  </span>
                  <span>Practical checklist</span>
                </a>
              </li>
            </ol>
            {relatedService ? (
              <div className="mt-8 border-l border-[#050505] pl-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#565656]">
                  Related service
                </p>
                <Link
                  className="mt-3 inline-flex items-center gap-2 text-sm leading-6"
                  href={`/services/${relatedService.slug}`}
                >
                  {relatedService.title} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
          </aside>

          <div className="lg:col-span-8 lg:col-start-5">
            <p className="max-w-[42ch] text-[clamp(1.45rem,2.4vw,2.25rem)] font-normal leading-[1.28] tracking-[-0.025em]">
              {article.introduction}
            </p>

            <div className="mt-14 space-y-14">
              {article.sections.map((section, index) => (
                <section
                  aria-labelledby={`section-${index + 1}-heading`}
                  className="scroll-mt-28 border-t border-[#a7a7a3]/55 pt-9"
                  id={`section-${index + 1}`}
                  key={section.heading}
                >
                  <div className="grid gap-4 sm:grid-cols-[3rem_1fr]">
                    <span className="text-xs font-semibold tracking-[0.15em] text-[#787874]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2
                        className="max-w-[25ch] text-[clamp(1.9rem,3.3vw,3rem)] font-normal leading-[1.02] tracking-[-0.04em]"
                        id={`section-${index + 1}-heading`}
                      >
                        {section.heading}
                      </h2>
                      <div className="mt-6 space-y-5">
                        {section.paragraphs.map((paragraph) => (
                          <p className="max-w-[68ch] text-base leading-8 text-[#404040]" key={paragraph}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <section
              aria-labelledby="practical-checklist-heading"
              className="mt-16 scroll-mt-28 bg-[#050505] p-7 text-white sm:p-10"
              id="practical-checklist"
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                Take it to set
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,3.4vw,3.2rem)] font-normal leading-[1] tracking-[-0.04em]"
                id="practical-checklist-heading"
              >
                Practical checklist
              </h2>
              <ul className="mt-8 border-t border-white/25">
                {article.checklist.map((item, index) => (
                  <li
                    className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-white/20 py-4 text-sm leading-6 text-white/80"
                    key={item}
                  >
                    <span className="text-[0.62rem] font-semibold tracking-[0.14em] text-white/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>

      {relatedArticles.length > 0 ? (
        <section className="bg-[#f7f7f5] py-20 text-[#050505] sm:py-24 lg:py-28">
          <div className="site-container grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel>Keep learning</SectionLabel>
              <h2 className="max-w-[10ch] text-[clamp(2.5rem,4.3vw,4.4rem)] font-normal leading-[0.96] tracking-[-0.045em]">
                Related production guides.
              </h2>
              <Link
                href="/resources"
                className="mt-7 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
              >
                View all resources <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="lg:col-span-8">
              {relatedArticles.slice(0, 3).map((relatedArticle, index) => (
                <ResourceCard article={relatedArticle} index={index} key={relatedArticle.slug} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <EditorialCta
        eyebrow="Use the guide"
        title="Turn the planning into a studio day."
        body={article.ctaBody}
      />
      <EasternCapeStrip />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}
