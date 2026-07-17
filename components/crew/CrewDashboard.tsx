import type { CrewDashboard } from "@/lib/crew-types";
import { CrewBookingList } from "./CrewBookingList";

type CrewDashboardProps = {
  dashboard: CrewDashboard;
};

export function CrewDashboard({ dashboard }: CrewDashboardProps) {
  const stats = [
    { label: "New enquiries", value: dashboard.pendingCount, detail: "Ready for review" },
    { label: "Confirmed", value: dashboard.confirmedCount, detail: "Upcoming studio sessions" },
    { label: "Holds expiring", value: dashboard.holdsExpiringCount, detail: "Need a decision soon" },
  ];

  return (
    <main className="bg-[#f7f7f5] text-[#050505]">
      <section className="bg-[#0a0a0a] text-white">
        <div className="site-container grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-[.2em] text-[#a7a7a3] uppercase">Studio GQ crew portal</p>
            <h1 className="mt-5 max-w-lg text-5xl font-normal leading-[.93] tracking-[-.055em] sm:text-6xl">
              The booking day, in view.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#a7a7a3] sm:text-base">
            Review new enquiries, confirm sessions and keep the studio calendar clear for every production.
          </p>
        </div>
      </section>

      <section className="site-container py-10 sm:py-14">
        <div className="grid gap-px border border-[#c9c9c5] bg-[#c9c9c5] sm:grid-cols-3">
          {stats.map((stat) => (
            <article className="bg-white p-5 sm:p-6" key={stat.label}>
              <p className="text-xs font-medium tracking-[.17em] text-[#565656] uppercase">{stat.label}</p>
              <p className="mt-6 text-5xl font-normal leading-none tracking-[-.05em]">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-[#565656]">{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-container pb-16 sm:pb-24" id="bookings">
        <CrewBookingList
          bookings={dashboard.upcomingBookings}
          description="Open a booking to view the client details, production notes and simple management actions."
        />
      </section>
    </main>
  );
}
