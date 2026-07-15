import type { Metadata } from "next";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { contactDetails, siteUrl } from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Studio GQ | Film, Photography & Podcast Studio in Gqeberha",
    template: "%s | Studio GQ",
  },
  description:
    "Studio GQ is a purpose-built film, photography, podcast, greenscreen and content production studio available for hire in Gqeberha, Eastern Cape.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "Studio GQ",
    title: "Studio GQ | Create Without Compromise",
    description: "Purpose-built film, photography, podcast and content production space in Gqeberha.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Studio GQ — Create Without Compromise" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio GQ | Create Without Compromise",
    description: "Purpose-built creative production space in Gqeberha.",
    images: ["/og.png"],
  },
  icons: { icon: "/logos/studio-gq-black.png" },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Studio GQ",
  url: siteUrl,
  image: `${siteUrl}/images/hero-studio-gq.webp`,
  email: contactDetails.email,
  telephone: contactDetails.phoneDisplay,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Unit 5, Moffett Business Centre, 8 Restitution Avenue",
    addressLocality: "Gqeberha",
    addressRegion: "Eastern Cape",
    addressCountry: "ZA",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
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
