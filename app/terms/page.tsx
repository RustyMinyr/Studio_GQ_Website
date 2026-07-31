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
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#777]">
            Last updated: 31 July 2026
          </p>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">About these terms</h2>
            <p>
              These terms govern use of the Studio GQ website. Studio GQ operates from Unit 5,
              Moffett Business Centre, 8 Restitution Avenue, Fairview, Gqeberha, South Africa.
              A studio hire may also be governed by a written quote, booking confirmation or
              hire agreement. If those documents conflict with these website terms, the agreed
              booking document applies to that hire.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Website use and accuracy</h2>
            <p>
              You may use this website for lawful information, enquiry and booking purposes.
              Do not attempt to disrupt the site, access private areas without permission or
              submit false, harmful or unlawful material. Content is a general guide to Studio
              GQ&apos;s spaces, services and production support. Availability, specifications,
              inclusions and equipment can change and must be confirmed for each booking.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Enquiries, rates and confirmation</h2>
            <p>
              Submitting an online request does not reserve the studio. A booking is confirmed
              only when Studio GQ sends written confirmation and any stated acceptance or
              payment requirements have been met. Displayed studio rates are per stated session
              and exclude gear and separately quoted additions. The final quote or confirmation
              will identify the dates, hours, inclusions, equipment, crew support and total
              price that apply.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Payment, changes and cancellations</h2>
            <p>
              Any deposit, payment deadline, cancellation, rescheduling, overtime or no-show
              terms will be supplied with the formal quote or booking confirmation. Please read
              and accept those terms before confirming the hire. Changes are subject to studio,
              equipment and crew availability.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Studio, equipment and conduct</h2>
            <p>
              Clients must use the studio and equipment responsibly, follow reasonable safety
              and access instructions, and ensure that their crew, talent and supplied material
              are lawful and appropriately authorised. Responsibility for loss, damage,
              specialist equipment, catering, crew and other production requirements will be
              set out in the applicable quote or hire agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Intellectual property</h2>
            <p>
              Studio GQ&apos;s photography, branding, text and site design may not be reproduced or
              used commercially without permission. Clients retain the rights they hold in
              material they bring to or create during a production, subject to any separately
              agreed production or usage terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">External services and liability</h2>
            <p>
              Links and third-party services are provided for convenience and remain subject to
              their own terms. To the extent permitted by law, Studio GQ is not responsible for
              indirect loss caused solely by reliance on general website information or by an
              interruption outside its reasonable control. Nothing in these terms excludes a
              right or remedy that cannot lawfully be excluded, including applicable rights
              under South African consumer law.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Events outside reasonable control</h2>
            <p>
              A production may need to be delayed or rescheduled where circumstances outside a
              party&apos;s reasonable control make performance unsafe or impracticable. The parties
              should communicate promptly and follow the change or cancellation terms in the
              applicable booking agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-normal text-[#050505]">Law and contact</h2>
            <p>
              These website terms are governed by South African law. For booking terms or
              website questions, email{" "}
              <a className="underline underline-offset-4" href="mailto:bookings@studiogq.co.za">
                bookings@studiogq.co.za
              </a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
