import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Studio GQ handles information submitted through this website.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    url: "/privacy",
    title: "Privacy Policy | Studio GQ",
    description: "How Studio GQ handles information submitted through this website.",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Studio GQ",
    description: "How Studio GQ handles information submitted through this website.",
  },
};

export default function PrivacyPage() {
  return (
    <main>
      <PageHero eyebrow="Legal" title="Privacy policy." intro="A clear overview of the information this website collects and how it is used." />
      <article className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-10 leading-7 text-[#565656]">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#777]">
            Last updated: 31 July 2026
          </p>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Who is responsible</h2>
            <p>
              Studio GQ is responsible for the personal information processed through this
              website. The studio operates from Unit 5, Moffett Business Centre, 8
              Restitution Avenue, Fairview, Gqeberha, South Africa. Privacy questions can be
              sent to <a className="underline underline-offset-4" href="mailto:bookings@studiogq.co.za">bookings@studiogq.co.za</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Information we receive</h2>
            <p>
              Booking requests can include your name, company, email address, phone number,
              requested dates, session, optional additions and production notes. Quick
              enquiries and workshop registrations include the contact details and message
              you choose to provide. Newsletter requests include your email address. Our
              hosting and security providers may also process basic technical information,
              such as an IP address and request logs, to operate and protect the website.
              Please do not submit sensitive personal information that is not needed for your
              request.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Why we use it</h2>
            <p>
              We use this information to respond to enquiries, check availability, manage
              bookings, prepare quotes, provide production support, share requested workshop
              or studio updates, maintain business records and prevent misuse. Required form
              fields are needed to identify and respond to a request; without them, we may be
              unable to process it. Studio GQ does not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Service providers and transfers</h2>
            <p>
              The website uses Vercel for hosting, Turso for booking data and Resend for
              transactional email. Where enabled, selected booking information may also be
              shared with Studio GQ&apos;s connected production-management system so the team can
              manage the work. These providers act only to supply their services, but they may
              process information outside South Africa. We select reputable providers and use
              contractual, access-control and security measures appropriate to the service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Retention</h2>
            <p>
              Routine enquiries, workshop registrations and update requests are generally kept
              for up to 24 months after the last interaction. Booking and related business
              records may be kept for up to five years after the booking is completed, or
              longer where law, an unresolved dispute or a legitimate record-keeping need
              requires it. Information that is no longer needed is deleted or anonymised.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Security, cookies and analytics</h2>
            <p>
              We use encrypted connections, form validation, spam controls and restricted
              access to reduce unauthorised access. No internet service can guarantee absolute
              security. The public website does not currently use advertising trackers or
              non-essential analytics cookies. The private crew portal uses an essential,
              secure session cookie after an authorised team member signs in.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Your choices and rights</h2>
            <p>
              You may ask what personal information Studio GQ holds about you, request a
              correction or deletion, object to certain processing, or withdraw consent for
              optional updates. Some records may need to be retained where the law permits or
              requires it. Contact us using the address above. You may also raise a complaint
              with South Africa&apos;s{" "}
              <a
                className="underline underline-offset-4"
                href="https://inforegulator.org.za/complaints/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Information Regulator
              </a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
