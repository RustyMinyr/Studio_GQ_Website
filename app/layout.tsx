import type { Metadata } from "next";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import {
  contactDetails,
  siteUrl,
  studioLocation,
  studioServiceAreas,
} from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Film, Video & Photography Studio Port Elizabeth | Studio GQ",
    template: "%s | Studio GQ",
  },
  description:
    "Studio GQ is a purpose-built film, video and photography studio in Gqeberha | Port Elizabeth, Eastern Cape, with podcast, greenscreen and production support.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "Studio GQ",
    title: "Film, Video & Photography Studio Port Elizabeth | Studio GQ",
    description:
      "A purpose-built film, video, photography, podcast and greenscreen studio in Gqeberha | Port Elizabeth, Eastern Cape.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Studio GQ — Create Without Compromise" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Film, Video & Photography Studio Port Elizabeth | Studio GQ",
    description:
      "Purpose-built creative production space in Gqeberha | Port Elizabeth, Eastern Cape.",
    images: ["/og.png"],
  },
  icons: { icon: "/logos/studio-gq-black.png" },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#studio`,
  name: "Studio GQ",
  alternateName: "Studio GQ Port Elizabeth",
  url: siteUrl,
  description:
    "A purpose-built film, video, photography, podcast and greenscreen studio serving Gqeberha | Port Elizabeth and the Eastern Cape.",
  logo: `${siteUrl}/logos/studio-gq-black.png`,
  image: [
    `${siteUrl}/images/hero-studio-gq.webp`,
    `${siteUrl}/images/studio-infinity-curve-group.webp`,
  ],
  email: contactDetails.email,
  telephone: contactDetails.phoneHref,
  priceRange: "R2,500-R4,500+",
  currenciesAccepted: "ZAR",
  sameAs: ["https://www.instagram.com/filmhouse_studiogq/"],
  hasMap: studioLocation.mapUrl,
  geo: {
    "@type": "GeoCoordinates",
    latitude: studioLocation.latitude,
    longitude: studioLocation.longitude,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "00:00",
    closes: "23:59",
  },
  areaServed: studioServiceAreas,
  potentialAction: {
    "@type": "ReserveAction",
    target: `${siteUrl}/booking`,
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: studioLocation.streetAddress,
    addressLocality: studioLocation.locality,
    addressRegion: studioLocation.region,
    postalCode: studioLocation.postalCode,
    addressCountry: studioLocation.countryCode,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en-ZA">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Header />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </body>
    </html>
  );
}
