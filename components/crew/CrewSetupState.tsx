import Link from "next/link";

export function CrewSetupState() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-28 text-white">
      <section className="site-container grid min-h-[calc(100vh-6.5rem)] place-items-center py-16 sm:py-24">
        <div className="max-w-xl border border-[#565656] bg-[#101010] p-7 sm:p-10">
          <p className="text-xs font-medium tracking-[0.2em] text-[#a7a7a3]">CREW PORTAL</p>
          <h1 className="mt-5 text-4xl font-normal leading-[.96] tracking-[-.045em] sm:text-5xl">
            Booking management is almost ready.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#a7a7a3]">
            Add Studio GQ&apos;s Turso database and shared crew login details to start viewing and managing enquiries here.
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center border border-white bg-white px-5 text-xs font-semibold tracking-[.14em] !text-[#050505] uppercase transition-colors hover:bg-[#e7e7e4]"
            href="/booking"
          >
            Back to online booking <span aria-hidden="true" className="ml-4 text-base">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
