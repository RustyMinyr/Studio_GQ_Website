import type { Metadata } from "next";

import {
  FaqAccordion,
  type FaqItem,
} from "@/components/content/FaqAccordion";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about booking Studio GQ, availability, equipment, crew support, greenscreen, podcast recording, parking, overtime and cancellations.",
  alternates: { canonical: "https://www.studiogq.co.za/faq" },
  openGraph: { title: "Frequently Asked Questions", description: "Practical answers about booking, equipment, crew support and production planning at Studio GQ.", url: "/faq" },
  twitter: { card: "summary_large_image", title: "Studio GQ FAQs", description: "Practical answers about booking and production planning." },
};

const questions: FaqItem[] = [
  {
    question: "How do I book Studio GQ?",
    answer:
      "Send a booking enquiry with your preferred date, project type, number of shoot days and estimated crew size. The Studio GQ team will confirm availability, discuss the most suitable space and provide the next booking steps.",
  },
  {
    question: "How far in advance should I check availability?",
    answer:
      "Availability changes with the production calendar, so enquire as early as possible—especially for multi-day shoots or dates with limited flexibility. Short-notice enquiries are still welcome and will be considered where the schedule allows.",
  },
  {
    question: "What is included with studio hire?",
    answer:
      "What is included depends on the chosen space and production requirements. Your confirmation will clearly set out the studio access, facilities and agreed support included in the booking.",
  },
  {
    question: "Can I rent lighting, grip or other gear?",
    answer:
      "Lighting, grip, stands, backdrops, audio and podcast equipment may be available. Stock can vary, so include your working equipment list with the enquiry and the team will confirm the available package.",
  },
  {
    question: "Can Studio GQ help with crew or production support?",
    answer:
      "Yes. Production support and experienced crew can be discussed around the scale and needs of your brief. Note the roles or assistance you need when you enquire so the team can advise on availability.",
  },
  {
    question: "Can I use a greenscreen at the studio?",
    answer:
      "Studio GQ supports greenscreen work for film, video and digital content. Share the subject, framing and intended output in advance so the setup can be planned with the capture and post-production workflow in mind.",
  },
  {
    question: "Can I record a podcast or interview?",
    answer:
      "Yes. The studio can accommodate podcast conversations, interviews and spoken-word formats. Tell the team how many people will be recorded and whether you need audio or production support.",
  },
  {
    question: "Are hair, makeup and wardrobe facilities available?",
    answer:
      "Yes. On-site preparation space is available for hair, makeup and wardrobe. Let the team know how many talent and styling team members will use the area so the day can be planned comfortably.",
  },
  {
    question: "Is parking available?",
    answer:
      "Include your expected crew and vehicle count in the enquiry so the team can confirm the current access and parking arrangements for your production date.",
  },
  {
    question: "What happens if the shoot runs into overtime?",
    answer:
      "Speak to the studio team as soon as it appears that the booking may run over. Overtime is subject to the day's schedule and any applicable additional charges will be confirmed against your booking terms.",
  },
  {
    question: "What are the cancellation terms?",
    answer:
      "Cancellation and rescheduling terms are supplied with the booking confirmation. Review them before approving the booking and contact the team promptly if your production date or scope changes.",
  },
  {
    question: "How can I contact the studio?",
    answer:
      "Email bookings@studiogq.co.za or call +27 84 515 0956. Studio GQ is at Unit 5, Moffett Business Centre, 8 Restitution Avenue, Fairview, Gqeberha, South Africa.",
  },
];

export default function FaqPage() {
  return (
    <main>
      <PageHero
        eyebrow="Frequently asked questions"
        intro="Practical details to help you plan a smooth studio day. For a date-specific answer, send the team your production brief."
        title={<>Plan clearly.<br />Create confidently.</>}
      >
        <ArrowLink href="/contact" variant="outline-light">
          Send a booking enquiry
        </ArrowLink>
      </PageHero>

      <section className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-4">
            <SectionLabel>Before you book</SectionLabel>
            <h2 className="mt-6 max-w-md text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              The essentials, answered.
            </h2>
            <p className="mt-7 max-w-sm leading-7 text-[#565656]">
              Booking details and equipment availability can vary by production.
              Confirm the final scope directly with the Studio GQ team.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6" delay={0.08}>
            <FaqAccordion items={questions} />
          </Reveal>
        </div>
      </section>

      <section className="bg-[#050505] px-5 py-20 text-white md:px-8 md:py-28 lg:px-12 lg:py-36">
        <Reveal className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <SectionLabel tone="dark">Still have a question?</SectionLabel>
            <h2 className="mt-6 max-w-2xl text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Tell us about the production you are planning.
            </h2>
            <ArrowLink className="mt-9" href="/contact" variant="outline-light">
              Contact Studio GQ
            </ArrowLink>
          </div>
          <address className="not-italic leading-7 text-[#a7a7a3] md:col-span-4 md:col-start-9 md:self-end md:text-lg md:leading-8">
            Studio GQ<br />
            Unit 5, Moffett Business Centre<br />
            8 Restitution Avenue<br />
            Fairview, Gqeberha<br />
            South Africa
            <div className="mt-6">
              <a className="text-white underline-offset-4 hover:underline" href="mailto:bookings@studiogq.co.za">
                bookings@studiogq.co.za
              </a><br />
              <a className="text-white underline-offset-4 hover:underline" href="tel:+27845150956">
                +27 84 515 0956
              </a>
            </div>
          </address>
        </Reveal>
      </section>
    </main>
  );
}
