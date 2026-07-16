import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

const categories = [
  ["Lighting", "Flexible lighting options for portrait, product, interview and motion setups."],
  ["Grip", "Grip equipment to shape, control and support the lighting plan."],
  ["Stands", "A working selection of stands for modifiers, lights and production accessories."],
  ["Backdrops", "Backdrop options for different looks, subject sizes and capture requirements."],
  ["Audio", "Audio resources for interviews, dialogue and selected content formats."],
  ["Podcast equipment", "Equipment support for podcast conversations and recorded interviews."],
  ["Production support", "Experienced assistance arranged around the needs of the brief."],
] as const;

export function EquipmentSection() {
  return (
    <section
      aria-labelledby="equipment-heading"
      className="scroll-mt-24 bg-[#f7f7f5] px-5 py-24 text-[#050505] sm:px-8 sm:py-28 lg:px-12 lg:py-36"
      id="equipment"
    >
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-4">
          <SectionLabel>Equipment & support</SectionLabel>
          <h2
            className="mt-6 text-4xl font-normal leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl"
            id="equipment-heading"
          >
            Build the kit around the shot.
          </h2>
          <p className="mt-8 max-w-md leading-7 text-[#565656] md:text-lg md:leading-8">
            Share your working equipment list early. The Studio GQ team will
            confirm what is available, help identify any additional hire
            requirements and plan the setup around the needs of the production.
            Include lighting, grip, audio, backdrops and specialist requests so
            the practical details can be resolved before the shoot begins.
          </p>
        </Reveal>

        <div className="border-t border-[#a7a7a3] lg:col-span-7 lg:col-start-6">
          {categories.map(([title, description], index) => (
            <Reveal
              className="grid gap-4 border-b border-[#a7a7a3] py-7 sm:grid-cols-12 sm:gap-6 md:py-9"
              delay={(index % 2) * 0.04}
              key={title}
            >
              <span aria-hidden="true" className="text-xs tracking-[0.18em] text-[#565656] sm:col-span-1">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-2xl font-normal tracking-[-0.03em] sm:col-span-4">
                {title}
              </h3>
              <p className="leading-7 text-[#565656] sm:col-span-7">{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
