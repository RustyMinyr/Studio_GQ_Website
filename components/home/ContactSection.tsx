import { BookingEnquiryForm } from "@/components/contact/BookingEnquiryForm";

export function ContactSection() {
  return (
    <section
      aria-labelledby="booking-heading"
      className="scroll-mt-24 bg-[#0a0a0a] text-white"
      id="contact"
    >
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:px-12 lg:py-28">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#a7a7a3]">BOOK THE STUDIO</p>
          <h2
            className="mt-5 max-w-lg text-4xl font-normal leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl"
            id="booking-heading"
          >
            Start your booking enquiry.
          </h2>
          <p className="mt-7 max-w-md text-base leading-7 text-[#a7a7a3]">
            Tell us what you are creating, when you need the studio and how we
            can support the production.
          </p>

          <address className="mt-9 space-y-5 border-t border-[#565656] pt-6 text-base not-italic leading-7">
            <div>
              <p className="text-xs tracking-[0.18em] text-[#a7a7a3]">VISIT</p>
              <p className="mt-2">
                Studio GQ<br />
                Unit 5, Moffett Business Centre<br />
                8 Restitution Avenue, Fairview<br />
                Gqeberha, South Africa
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.18em] text-[#a7a7a3]">CONTACT</p>
              <p className="mt-2">
                <a className="underline-offset-4 hover:underline" href="mailto:bookings@studiogq.co.za">
                  bookings@studiogq.co.za
                </a><br />
                <a className="underline-offset-4 hover:underline" href="tel:+27845150956">
                  +27 84 515 0956
                </a>
              </p>
            </div>
          </address>
        </div>

        <BookingEnquiryForm />
      </div>
    </section>
  );
}
