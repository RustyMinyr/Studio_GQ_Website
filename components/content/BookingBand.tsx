import { ArrowLink } from "@/components/ui/ArrowLink";

export function BookingBand({
  title = "Bring your next production to Studio GQ.",
}: {
  title?: string;
}) {
  return (
    <section className="bg-[#050505] px-5 py-20 text-white md:px-8 md:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-10 md:flex-row md:items-end">
        <div>
          <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-[#a7a7a3]">
            Ready to create?
          </p>
          <h2 className="max-w-4xl text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            {title}
          </h2>
        </div>
        <ArrowLink href="/contact" variant="outline-light">
          Book the studio
        </ArrowLink>
      </div>
    </section>
  );
}
