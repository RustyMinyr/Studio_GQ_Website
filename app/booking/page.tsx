import type { Metadata } from "next";

import { BookingEnquiryForm } from "@/components/contact/BookingEnquiryForm";
import { EasternCapeStrip } from "@/components/home/EasternCapeStrip";
import { PageHero } from "@/components/ui/PageHero";
import { contactDetails } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Online Studio Booking",
  description: "Check Studio GQ availability and request a half-day or full-day studio booking in Gqeberha.",
  alternates: { canonical: "/booking" },
  openGraph: {
    url: "/booking",
    title: "Book Studio GQ",
    description: "Check availability and request a half-day or full-day studio booking in Gqeberha.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Studio GQ — Create Without Compromise" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Studio GQ",
    description: "Check availability and request a Studio GQ session.",
    images: ["/og.png"],
  },
};

export default function BookingPage() {
  return (
    <main>
      <PageHero
        eyebrow="Online booking"
        intro="Choose an available date and session, then share the details we need to prepare the studio around your production."
        title="Book Studio GQ."
        tone="dark"
      />

      <section
        aria-labelledby="booking-portal-heading"
        className="bg-[#0a0a0a] text-white"
      >
        <div className="site-container grid items-start gap-10 py-16 sm:py-20 xl:grid-cols-[minmax(260px,0.52fr)_minmax(0,1.48fr)] xl:gap-12 xl:py-24">
          <aside className="self-start">
            <p className="text-xs tracking-[0.2em] text-[#a7a7a3]">STUDIO HIRE</p>
            <h2
              className="mt-5 max-w-md text-3xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-4xl"
              id="booking-portal-heading"
            >
              Choose the time that fits the shot.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#a7a7a3]">
              Select your preferred date and session. We will review the production details,
              confirm availability and contact you to finalise the booking.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-px border border-[#565656] bg-[#565656]">
              <div className="bg-[#0a0a0a] p-4">
                <p className="text-[10px] tracking-[0.14em] text-[#a7a7a3] sm:text-xs">
                  HALF DAY · 4 HOURS
                </p>
                <p className="mt-2 text-xl">R2,500</p>
              </div>
              <div className="bg-[#0a0a0a] p-4">
                <p className="text-[10px] tracking-[0.14em] text-[#a7a7a3] sm:text-xs">
                  FULL DAY · 10 HOURS
                </p>
                <p className="mt-2 text-xl">R4,500</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#a7a7a3]">
              Half day: 08:00–12:00 or 13:00–17:00. Studio rates exclude gear.
            </p>

            <address className="mt-7 border-t border-[#565656] pt-5 text-sm not-italic leading-6">
              <p className="text-xs tracking-[0.18em] text-[#a7a7a3]">NEED HELP?</p>
              <p className="mt-2">
                <a
                  className="underline-offset-4 hover:underline"
                  href={`mailto:${contactDetails.email}`}
                >
                  {contactDetails.email}
                </a>
                <br />
                <a
                  className="underline-offset-4 hover:underline"
                  href={`tel:${contactDetails.phoneHref}`}
                >
                  {contactDetails.phoneDisplay}
                </a>
              </p>
            </address>
          </aside>

          <BookingEnquiryForm />
        </div>
      </section>

      <EasternCapeStrip />
    </main>
  );
}
