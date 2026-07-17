import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CrewCalendar } from "@/components/crew/CrewCalendar";
import { CrewCalendarBlocker } from "@/components/crew/CrewCalendarBlocker";
import { CrewPortalHeader } from "@/components/crew/CrewPortalHeader";
import { CrewSetupState } from "@/components/crew/CrewSetupState";
import { crewLoginUrl, getCrewAuthState, getCrewSession } from "@/lib/crew-auth";
import { getCrewCalendar } from "@/lib/crew-bookings";

export const metadata: Metadata = {
  title: "Crew Calendar",
  robots: { index: false, follow: false },
};

type CrewCalendarPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

function readMonth(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed - 1 : fallback;
}

function readYear(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2025 && parsed <= 2100 ? parsed : fallback;
}

function calendarHref(year: number, month: number) {
  return `/crew/calendar?year=${year}&month=${month + 1}`;
}

export default async function CrewCalendarPage({ searchParams }: CrewCalendarPageProps) {
  const auth = getCrewAuthState();
  if (auth.state !== "configured") return <CrewSetupState />;

  if (!(await getCrewSession())) redirect(crewLoginUrl("/crew/calendar"));
  const requested = await searchParams;
  const now = new Date();
  const month = readMonth(requested.month, now.getMonth());
  const year = readYear(requested.year, now.getFullYear());
  const bookings = await getCrewCalendar(year, month + 1);
  const previous = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <CrewPortalHeader current="calendar" />
      <main>
        <div className="site-container flex justify-end gap-2 pt-7 sm:pt-9" aria-label="Calendar months">
          <Link className="inline-flex min-h-10 items-center border border-[#a7a7a3] px-3 text-xs font-semibold tracking-[.12em] uppercase hover:border-[#050505]" href={calendarHref(previous.getFullYear(), previous.getMonth())}>← Previous</Link>
          <Link className="inline-flex min-h-10 items-center border border-[#a7a7a3] px-3 text-xs font-semibold tracking-[.12em] uppercase hover:border-[#050505]" href={calendarHref(next.getFullYear(), next.getMonth())}>Next →</Link>
        </div>
        <CrewCalendar bookings={bookings} month={month} year={year} />
        <div className="site-container pb-16 sm:pb-24">
          <CrewCalendarBlocker />
        </div>
      </main>
    </div>
  );
}
