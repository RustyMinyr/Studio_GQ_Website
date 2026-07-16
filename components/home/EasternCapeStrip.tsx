const services = [
  "Studio hire",
  "Film & photography",
  "Podcast & audio",
  "Production support",
] as const;

export function EasternCapeStrip() {
  return (
    <section
      aria-labelledby="eastern-cape-heading"
      className="bg-white px-5 py-12 text-[#050505] sm:px-8 sm:py-14 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1400px] gap-9 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <p className="text-xs font-medium tracking-[0.2em] text-[#565656]">
            GQEBERHA / EASTERN CAPE
          </p>
          <h2
            id="eastern-cape-heading"
            className="mt-4 text-3xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-4xl"
          >
            Production, under one roof.
          </h2>
        </div>

        <ul className="grid border-t border-[#a7a7a3]/60 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-4 lg:border-l lg:border-t-0">
          {services.map((service) => (
            <li
              className="flex min-h-16 items-center border-b border-[#a7a7a3]/60 py-4 text-sm leading-6 sm:border-r sm:px-5 lg:border-b-0"
              key={service}
            >
              {service}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
