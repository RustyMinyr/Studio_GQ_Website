import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Website and booking information terms for Studio GQ.",
  alternates: { canonical: "/terms" },
  openGraph: {
    url: "/terms",
    title: "Terms & Conditions | Studio GQ",
    description: "Website and booking information terms for Studio GQ.",
  },
  twitter: {
    card: "summary",
    title: "Terms & Conditions | Studio GQ",
    description: "Website and booking information terms for Studio GQ.",
  },
};

export default function TermsPage() {
  return (
    <main>
      <PageHero eyebrow="Legal" title="Terms & conditions." intro="The basis on which this website and its booking information are provided." />
      <article className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-10 leading-7 text-[#565656]">
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Website information</h2><p>Content on this site is provided as a general guide to Studio GQ spaces, services and production support. Availability, inclusions and equipment can change and must be confirmed for each booking.</p></section>
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Booking confirmation</h2><p>A website enquiry is not a confirmed reservation. Dates, rates, inclusions, overtime, cancellation terms and any equipment or crew support become binding only when supplied and accepted through the formal booking process.</p></section>
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Photography and brand assets</h2><p>Studio GQ photography, branding and site content may not be reproduced for commercial use without permission.</p></section>
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Contact</h2><p>For booking terms or website questions, email <a className="underline" href="mailto:bookings@studiogq.co.za">bookings@studiogq.co.za</a>.</p></section>
        </div>
      </article>
    </main>
  );
}
