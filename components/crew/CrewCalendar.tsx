import Link from "next/link";

import type { CrewBooking } from "@/lib/crew-types";
import { bookingStatusIsActive, formatBookingDate, formatBookingTime, statusLabels } from "./crew-format";

type CrewCalendarProps = {
  bookings: CrewBooking[];
  month: number;
  year: number;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}

export function CrewCalendar({ bookings, month, year }: CrewCalendarProps) {
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - startDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const bookingsByDate = new Map<string, CrewBooking[]>();
  for (const booking of bookings) {
    const entries = bookingsByDate.get(booking.bookingDate) ?? [];
    entries.push(booking);
    bookingsByDate.set(booking.bookingDate, entries);
  }

  return (
    <section aria-labelledby="crew-calendar-heading" className="site-container py-10 sm:py-14 lg:py-18">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Studio schedule</p>
          <h1 className="mt-3 text-4xl font-normal tracking-[-.045em] sm:text-5xl" id="crew-calendar-heading">
            {monthTitle(year, month)}
          </h1>
        </div>
        <Link className="inline-flex min-h-11 items-center border border-[#050505] px-4 text-xs font-semibold tracking-[.12em] uppercase transition-colors hover:bg-[#050505] hover:text-white" href="/crew">
          Overview <span aria-hidden="true" className="ml-4">→</span>
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto border border-[#c9c9c5] bg-white">
        <div className="min-w-[56rem]">
          <div className="grid grid-cols-7 border-b border-[#c9c9c5] bg-[#f1f1ee]">
            {weekdayLabels.map((weekday) => (
              <p className="px-3 py-3 text-[10px] font-medium tracking-[.15em] text-[#565656] uppercase" key={weekday}>{weekday}</p>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              if (!day) return <div className="min-h-38 border-b border-r border-[#e7e7e4] bg-[#fafaf8]" key={`blank-${index}`} />;
              const key = dateKey(year, month, day);
              const dayBookings = (bookingsByDate.get(key) ?? []).filter((booking) => bookingStatusIsActive(booking.status));
              return (
                <article className="min-h-38 border-b border-r border-[#e7e7e4] p-2.5" key={key}>
                  <p className="text-xs font-medium text-[#565656]">{day}</p>
                  <div className="mt-3 space-y-1.5">
                    {dayBookings.length === 0 ? <p className="text-[10px] tracking-[.08em] text-[#a7a7a3] uppercase">Available</p> : null}
                    {dayBookings.map((booking) => {
                      const content = <>
                        <span className="block truncate text-[10px] font-medium tracking-[.07em] text-[#565656] uppercase">
                          {booking.session === "full_day" ? "Full day" : booking.session}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium">{booking.title}</span>
                      </>;
                      const className = "block border-l-2 border-[#050505] bg-[#f1f1ee] px-2 py-1.5";
                      return booking.kind === "booking" ? (
                        <Link className={`${className} transition-colors hover:bg-[#e7e7e4]`} href={`/crew/bookings/${booking.id}`} key={booking.id}>{content}</Link>
                      ) : <div className={className} key={booking.id}>{content}</div>;
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <section className="mt-10" aria-labelledby="calendar-schedule-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Day bands</p>
            <h2 className="mt-3 text-2xl font-normal tracking-[-.035em]" id="calendar-schedule-heading">Every active booking this month.</h2>
          </div>
          <p className="hidden max-w-md text-right text-sm leading-6 text-[#565656] md:block">Select a booking to confirm it, update the time or contact the client.</p>
        </div>
        <div className="mt-5 grid gap-px border border-[#c9c9c5] bg-[#c9c9c5] md:grid-cols-3">
          {(["morning", "afternoon", "full_day"] as const).map((session) => {
            const sessionBookings = bookings.filter((booking) => booking.session === session && bookingStatusIsActive(booking.status));
            return (
              <section className="bg-white p-5" key={session} aria-label={formatBookingTime(session)}>
                <p className="text-xs font-medium tracking-[.16em] text-[#565656] uppercase">{formatBookingTime(session)}</p>
                <div className="mt-5 space-y-2">
                  {sessionBookings.length === 0 ? <p className="text-sm leading-6 text-[#565656]">No active bookings this month.</p> : sessionBookings.map((booking) => {
                    const content = <><span className="text-sm font-medium">{formatBookingDate(booking.bookingDate, { weekday: undefined, year: undefined })}</span><span className="mt-1 block text-xs text-[#565656]">{booking.title} · {statusLabels[booking.status]}</span></>;
                    return booking.kind === "booking" ? <Link className="block border-b border-[#e7e7e4] pb-3 last:border-0 last:pb-0 hover:text-[#565656]" href={`/crew/bookings/${booking.id}`} key={booking.id}>{content}</Link> : <div className="border-b border-[#e7e7e4] pb-3 last:border-0 last:pb-0" key={booking.id}>{content}</div>;
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </section>
  );
}
