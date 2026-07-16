import { QuickEnquiryForm } from "@/components/contact/QuickEnquiryForm";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { contactDetails } from "@/lib/site-content";

export function ContactSection() {
  return (
    <section
      aria-labelledby="contact-heading"
      className="scroll-mt-24 bg-[#0a0a0a] text-white"
      id="contact"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] lg:gap-16 lg:px-12 lg:py-16">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#a7a7a3]">GET IN TOUCH</p>
          <h2
            className="mt-4 max-w-md text-4xl font-normal leading-[1.04] tracking-[-0.035em] sm:text-5xl"
            id="contact-heading"
          >
            Have a quick question?
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-[#a7a7a3]">
            Send us a short enquiry, email the studio directly, or use online
            booking to choose an available date and session.
          </p>

          <div className="mt-6">
            <ArrowLink href="/booking" variant="light">
              Online booking
            </ArrowLink>
          </div>

          <address className="mt-6 border-t border-[#565656] pt-5 text-base not-italic leading-7">
            <a
              className="block w-fit underline-offset-4 hover:underline"
              href={`mailto:${contactDetails.email}`}
            >
              {contactDetails.email}
            </a>
            <a
              className="block w-fit underline-offset-4 hover:underline"
              href={`tel:${contactDetails.phoneHref}`}
            >
              {contactDetails.phoneDisplay}
            </a>
          </address>
        </div>

        <QuickEnquiryForm />
      </div>
    </section>
  );
}
