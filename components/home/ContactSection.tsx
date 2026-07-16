import { BookingEnquiryForm } from "@/components/contact/BookingEnquiryForm";

export function ContactSection() {
  return (
    <section
      aria-labelledby="booking-heading"
      className="scroll-mt-24 bg-[#0a0a0a] text-white"
      id="contact"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(260px,0.52fr)_minmax(0,1.48fr)] lg:gap-12 lg:px-12 lg:py-20">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#a7a7a3]">BOOK THE STUDIO</p>
          <h2
            className="mt-5 max-w-lg text-4xl font-normal leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl"
            id="booking-heading"
          >
            Start your booking enquiry.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#a7a7a3]">
            Choose a date and session, then tell us what you are creating and
            how we can support the production.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-px border border-[#565656] bg-[#565656]">
            <div className="bg-[#0a0a0a] p-4">
              <p className="text-xs tracking-[0.14em] text-[#a7a7a3]">HALF DAY · 4 HOURS</p>
              <p className="mt-2 text-xl">R2,500</p>
            </div>
            <div className="bg-[#0a0a0a] p-4">
              <p className="text-xs tracking-[0.14em] text-[#a7a7a3]">FULL DAY · 10 HOURS</p>
              <p className="mt-2 text-xl">R4,500</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#a7a7a3]">Studio rates exclude gear.</p>

          <address className="mt-7 space-y-5 border-t border-[#565656] pt-5 text-base not-italic leading-7">
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
