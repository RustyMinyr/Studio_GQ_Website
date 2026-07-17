import Link from "next/link";

import type { CrewBooking } from "@/lib/crew-types";
import { formatBookingDate, formatBookingTime, statusLabels, statusStyles } from "./crew-format";

type CrewBookingListProps = {
  bookings: CrewBooking[];
  title?: string;
  description?: string;
};

export function CrewBookingList({ bookings, title = "Upcoming bookings", description }: CrewBookingListProps) {
  return (
    <section aria-labelledby="upcoming-bookings-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Schedule</p>
          <h2 className="mt-3 text-3xl font-normal tracking-[-.04em]" id="upcoming-bookings-heading">{title}</h2>
          {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-[#565656]">{description}</p> : null}
        </div>
        <Link className="text-xs font-semibold tracking-[.12em] uppercase underline-offset-4 hover:underline" href="/crew/calendar">
          Open calendar <span aria-hidden="true">→</span>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-7 border border-[#c9c9c5] bg-white px-6 py-10 text-sm leading-6 text-[#565656]">
          No bookings are scheduled yet. New enquiries will appear here once submitted.
        </div>
      ) : (
        <div className="mt-7 overflow-x-auto border border-[#c9c9c5] bg-white">
          <table className="min-w-[44rem] w-full border-collapse text-left">
            <thead className="border-b border-[#c9c9c5] text-[10px] font-medium tracking-[.16em] text-[#565656] uppercase">
              <tr>
                <th className="px-5 py-4 font-medium">Date &amp; session</th>
                <th className="px-5 py-4 font-medium">Client</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr className="border-b border-[#e7e7e4] last:border-0" key={booking.id}>
                  <td className="px-5 py-4 text-sm">
                    <p className="font-medium text-[#050505]">{formatBookingDate(booking.bookingDate)}</p>
                    <p className="mt-1 text-xs leading-5 text-[#565656]">{formatBookingTime(booking.session)}</p>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <p className="font-medium text-[#050505]">{booking.title}</p>
                    {booking.company ? <p className="mt-1 text-xs leading-5 text-[#565656]">{booking.company}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex border px-2.5 py-1 text-[10px] font-medium tracking-[.12em] uppercase ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {booking.kind === "booking" ? (
                      <Link className="text-xs font-semibold tracking-[.12em] uppercase underline-offset-4 hover:underline" href={`/crew/bookings/${booking.id}`}>
                        Manage <span aria-hidden="true">→</span>
                      </Link>
                    ) : <span className="text-xs text-[#565656]">Studio block</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
