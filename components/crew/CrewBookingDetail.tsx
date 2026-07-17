import Link from "next/link";

import type { CrewBooking } from "@/lib/crew-types";
import { CrewBookingActions } from "./CrewBookingActions";
import { additionalItemLabel, formatBookingDate, formatBookingTime, formatPrice, statusLabels, statusStyles } from "./crew-format";

type CrewBookingDetailProps = {
  booking: CrewBooking;
};

export function CrewBookingDetail({ booking }: CrewBookingDetailProps) {
  const extras = booking.additionalItems.filter(Boolean);

  return (
    <main className="bg-[#f7f7f5] text-[#050505]">
      <section className="bg-[#0a0a0a] text-white">
        <div className="site-container py-10 sm:py-14">
          <Link className="text-xs font-semibold tracking-[.12em] text-[#a7a7a3] uppercase hover:text-white" href="/crew">
            <span aria-hidden="true" className="mr-3">←</span> Back to bookings
          </Link>
          <div className="mt-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium tracking-[.2em] text-[#a7a7a3] uppercase">Booking request</p>
              <h1 className="mt-4 text-4xl font-normal tracking-[-.045em] sm:text-5xl">{booking.title}</h1>
              <p className="mt-3 text-base text-[#a7a7a3]">{formatBookingDate(booking.bookingDate)} · {formatBookingTime(booking.session)}</p>
            </div>
            <span className={`inline-flex border px-3 py-1.5 text-[10px] font-medium tracking-[.13em] uppercase ${statusStyles[booking.status]}`}>
              {statusLabels[booking.status]}
            </span>
          </div>
        </div>
      </section>

      <section className="site-container grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.7fr)] lg:gap-12">
        <div className="space-y-8">
          <section className="border border-[#c9c9c5] bg-white p-5 sm:p-7" aria-labelledby="client-details-heading">
            <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Client</p>
            <h2 className="mt-3 text-2xl font-normal tracking-[-.035em]" id="client-details-heading">Client details</h2>
            <dl className="mt-6 grid gap-5 border-t border-[#e7e7e4] pt-5 sm:grid-cols-2">
              <div><dt className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Name</dt><dd className="mt-1 text-sm">{booking.name ?? "—"}</dd></div>
              <div><dt className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Company</dt><dd className="mt-1 text-sm">{booking.company || "—"}</dd></div>
              <div><dt className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Email</dt><dd className="mt-1 text-sm">{booking.email ? <a className="underline-offset-4 hover:underline" href={`mailto:${booking.email}`}>{booking.email}</a> : "—"}</dd></div>
              <div><dt className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Phone</dt><dd className="mt-1 text-sm">{booking.phone ? <a className="underline-offset-4 hover:underline" href={`tel:${booking.phone.replace(/\s/g, "")}`}>{booking.phone}</a> : "—"}</dd></div>
            </dl>
          </section>

          <section className="border border-[#c9c9c5] bg-white p-5 sm:p-7" aria-labelledby="production-details-heading">
            <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Production</p>
            <h2 className="mt-3 text-2xl font-normal tracking-[-.035em]" id="production-details-heading">What they need.</h2>
            <div className="mt-6 border-t border-[#e7e7e4] pt-5">
              <p className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Client notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#303030]">{booking.message || "No production notes supplied."}</p>
            </div>
            <div className="mt-6 border-t border-[#e7e7e4] pt-5">
              <p className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Additional items</p>
              {extras.length ? <ul className="mt-3 flex flex-wrap gap-2">{extras.map((item) => <li className="border border-[#c9c9c5] px-3 py-1.5 text-xs" key={item}>{additionalItemLabel(item)}</li>)}</ul> : <p className="mt-2 text-sm leading-6 text-[#565656]">No additional items selected.</p>}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="border border-[#c9c9c5] bg-white p-5 sm:p-6">
            <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Session</p>
            <p className="mt-4 text-2xl font-normal tracking-[-.035em]">{formatBookingTime(booking.session)}</p>
            <p className="mt-2 text-sm text-[#565656]">{formatBookingDate(booking.bookingDate)}</p>
            <div className="mt-5 border-t border-[#e7e7e4] pt-4">
              <p className="text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase">Studio rate</p>
              <p className="mt-2 text-xl">{formatPrice(booking.priceZar)}</p>
            </div>
          </section>
          <CrewBookingActions booking={booking} />
        </aside>
      </section>
    </main>
  );
}
