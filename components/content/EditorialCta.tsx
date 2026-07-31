import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionLabel } from "@/components/ui/SectionLabel";

type EditorialCtaProps = {
  eyebrow?: string;
  title?: string;
  body?: string;
};

export function EditorialCta({
  eyebrow = "Book Studio GQ",
  title = "Bring the brief. Build the right studio day.",
  body = "Choose a preferred date and session, then share the production details. The Studio GQ team will review the request and confirm the booking with you.",
}: EditorialCtaProps) {
  return (
    <section className="bg-[#050505] py-20 text-white sm:py-24 lg:py-28">
      <div className="site-container grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <SectionLabel tone="dark">{eyebrow}</SectionLabel>
          <h2 className="max-w-[13ch] text-[clamp(2.8rem,5.4vw,5.5rem)] font-normal leading-[0.94] tracking-[-0.05em]">
            {title}
          </h2>
        </div>
        <div className="lg:col-span-4">
          <p className="max-w-[40ch] text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
            {body}
          </p>
          <ArrowLink href="/booking" variant="light" className="mt-7">
            Check availability
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
