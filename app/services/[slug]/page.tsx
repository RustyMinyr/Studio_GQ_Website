import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { EditorialCta } from "@/components/content/EditorialCta";
import { ResourceCard } from "@/components/content/ResourceCard";
import { EasternCapeStrip } from "@/components/home/EasternCapeStrip";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getResourceArticle } from "@/lib/resources";
import { getStudioService, studioServices } from "@/lib/services";
import { siteUrl } from "@/lib/site-content";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

const serviceImages: Record<string, { src: string; alt: string; position: string }> = {
  "studio-hire": {
    src: "/images/gallery/studio-production-wide.webp",
    alt: "A production team working inside Studio GQ",
    position: "object-center",
  },
  "photography-film": {
    src: "/images/gallery/behind-the-scenes.webp",
    alt: "A camera and lighting setup during a Studio GQ shoot",
    position: "object-[60%_40%]",
  },
  "podcast-studio": {
    src: "/images/gallery/studio-gq-video-poster.jpg",
    alt: "The adaptable production space inside Studio GQ",
    position: "object-center",
  },
  "greenscreen-infinity-curve": {
    src: "/images/gallery/studio-cyclorama-portrait.jpg",
    alt: "A portrait setup on the Studio GQ infinity curve",
    position: "object-center",
  },
  "equipment-production-support": {
    src: "/images/gallery/studio-gq-tour-poster.jpg",
    alt: "Studio lighting and production equipment set up at Studio GQ",
    position: "object-center",
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return studioServices.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getStudioService(slug);
  if (!service) return {};

  const path = `/services/${service.slug}`;

  return {
    title: service.seoTitle,
    description: service.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${service.seoTitle} | Studio GQ`,
      description: service.description,
      url: path,
      images: [
        {
          url: serviceImages[service.slug]?.src ?? "/og.png",
          alt: serviceImages[service.slug]?.alt ?? service.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.seoTitle} | Studio GQ`,
      description: service.description,
      images: [serviceImages[service.slug]?.src ?? "/og.png"],
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getStudioService(slug);
  if (!service) notFound();

  const image = serviceImages[service.slug];
  const relatedArticles = service.relatedResourceSlugs.flatMap((articleSlug) => {
    const article = getResourceArticle(articleSlug);
    return article ? [article] : [];
  });
  const currentServiceIndex = studioServices.findIndex(
    (candidate) => candidate.slug === service.slug,
  );
  const nextService =
    studioServices[(currentServiceIndex + 1) % studioServices.length];
  const canonical = `${siteUrl}/services/${service.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${canonical}#service`,
        name: service.title,
        description: service.description,
        url: canonical,
        provider: {
          "@type": "LocalBusiness",
          "@id": `${siteUrl}/#studio`,
          name: "Studio GQ",
          url: siteUrl,
        },
        areaServed: {
          "@type": "City",
          name: "Gqeberha",
        },
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
            name: "Services",
            item: `${siteUrl}/services`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.title,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <PageHero eyebrow={service.eyebrow} title={service.title} intro={service.intro}>
        <ArrowLink href="/booking" variant="outline-light">
          Check availability
        </ArrowLink>
      </PageHero>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.title },
        ]}
      />

      <section className="bg-[#f7f7f5] py-20 text-[#050505] sm:py-24 lg:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-12 lg:items-stretch">
          <figure className="relative min-h-[26rem] overflow-hidden bg-[#e7e7e4] lg:col-span-7 lg:min-h-[38rem]">
            <Image
              unoptimized
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1023px) 100vw, 58vw"
              className={`object-cover ${image.position}`}
            />
          </figure>

          <div className="flex flex-col justify-between lg:col-span-5 lg:pl-8">
            <div>
              <SectionLabel>What this supports</SectionLabel>
              <h2 className="max-w-[11ch] text-[clamp(2.4rem,4vw,4rem)] font-normal leading-[0.97] tracking-[-0.045em]">
                Built around the production, not a preset.
              </h2>
            </div>
            <ul className="mt-10 border-t border-[#a7a7a3]/60">
              {service.features.map((feature, index) => (
                <li
                  className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-[#a7a7a3]/60 py-4 text-sm leading-6"
                  key={feature}
                >
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-[#787874]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-[#050505] sm:py-24 lg:py-28">
        <div className="site-container grid gap-x-12 gap-y-0 lg:grid-cols-12">
          <div className="pb-12 lg:col-span-4 lg:pr-8">
            <SectionLabel>How to plan it</SectionLabel>
            <h2 className="max-w-[11ch] text-[clamp(2.5rem,4.3vw,4.4rem)] font-normal leading-[0.96] tracking-[-0.045em]">
              Start with the outcome.
            </h2>
            <p className="mt-6 max-w-[36ch] text-base leading-7 text-[#565656]">
              Bring the references, working schedule and requirements early. The
              space and support can then be considered together.
            </p>
          </div>
          <div className="lg:col-span-8">
            {service.sections.map((section, index) => (
              <section
                aria-labelledby={`${service.slug}-section-${index + 1}`}
                className="grid gap-5 border-t border-[#a7a7a3]/55 py-8 sm:grid-cols-[4rem_1fr] sm:py-10"
                key={section.heading}
              >
                <span className="text-xs font-semibold tracking-[0.15em] text-[#787874]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3
                    id={`${service.slug}-section-${index + 1}`}
                    className="max-w-[24ch] text-[clamp(1.65rem,2.5vw,2.5rem)] font-normal leading-[1.04] tracking-[-0.035em]"
                  >
                    {section.heading}
                  </h3>
                  <p className="mt-4 max-w-[62ch] text-base leading-7 text-[#565656]">
                    {section.body}
                  </p>
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="bg-[#f7f7f5] py-20 text-[#050505] sm:py-24 lg:py-28">
          <div className="site-container grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel>From Learn</SectionLabel>
              <h2 className="max-w-[10ch] text-[clamp(2.5rem,4.3vw,4.4rem)] font-normal leading-[0.96] tracking-[-0.045em]">
                Prepare before the shoot.
              </h2>
              <Link
                href="/resources"
                className="mt-7 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
              >
                Explore all resources <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={`/services/${nextService.slug}`}
                className="mt-4 flex w-fit items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#565656]"
              >
                Next: {nextService.eyebrow} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="lg:col-span-8">
              {relatedArticles.slice(0, 3).map((article, index) => (
                <ResourceCard article={article} index={index} key={article.slug} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <EditorialCta />
      <EasternCapeStrip />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}
