import { FaqAccordion, type FaqItem } from "@/components/content/FaqAccordion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const questions: FaqItem[] = [
  {
    question: "How do I book Studio GQ?",
    answer: "Send a booking enquiry with your preferred date, project type, number of shoot days and estimated crew size. The team will confirm availability and the next booking steps.",
  },
  {
    question: "What is included with studio hire?",
    answer: "What is included depends on the chosen setup and production requirements. Your confirmation will clearly list the studio access, facilities and agreed support included in the booking.",
  },
  {
    question: "Can I rent lighting, grip or other gear?",
    answer: "Lighting, grip, stands, backdrops, audio and podcast equipment may be available. Include your working equipment list with the enquiry so the team can confirm the package.",
  },
  {
    question: "Can Studio GQ help with crew or production support?",
    answer: "Yes. Production support and experienced crew can be discussed around the scale and needs of your brief. Note the roles or assistance you need when you enquire.",
  },
  {
    question: "Can I record a podcast or interview?",
    answer: "Yes. The studio can accommodate podcast conversations, interviews and spoken-word formats. Tell the team how many people will be recorded and what support you need.",
  },
  {
    question: "Are hair, makeup and wardrobe facilities available?",
    answer: "Yes. On-site preparation space is available for hair, makeup and wardrobe, keeping talent close to set and the production day coordinated.",
  },
  {
    question: "Where is Studio GQ?",
    answer: "Studio GQ is at Unit 5, Moffett Business Centre, 8 Restitution Avenue, Fairview, Gqeberha, South Africa.",
  },
];

export function FaqSection() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="scroll-mt-24 bg-white px-5 py-24 text-[#050505] sm:px-8 sm:py-28 lg:px-12 lg:py-36"
      id="faq"
    >
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <SectionLabel>Before you book</SectionLabel>
          <h2
            className="mt-6 max-w-md text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl"
            id="faq-heading"
          >
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
  );
}
