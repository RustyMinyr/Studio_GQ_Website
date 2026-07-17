import Link from "next/link";

import { CrewSignOut } from "./CrewSignOut";

type CrewPortalHeaderProps = {
  current: "dashboard" | "calendar" | "bookings";
};

const items = [
  { href: "/crew", label: "Overview", key: "dashboard" },
  { href: "/crew/calendar", label: "Calendar", key: "calendar" },
  { href: "/crew#bookings", label: "Bookings", key: "bookings" },
] as const;

export function CrewPortalHeader({ current }: CrewPortalHeaderProps) {
  return (
    <header className="border-b border-[#3e3e3e] bg-[#0a0a0a] text-white">
      <div className="site-container flex min-h-20 flex-wrap items-center justify-between gap-5 py-4">
        <div>
          <p className="text-[10px] font-medium tracking-[.22em] text-[#a7a7a3] uppercase">Studio GQ</p>
          <p className="mt-1 text-lg tracking-[-.025em]">Crew portal</p>
        </div>
        <nav className="flex items-center gap-5 text-xs tracking-[.1em] sm:gap-8" aria-label="Crew portal">
          {items.map((item) => (
            <Link
              aria-current={item.key === current ? "page" : undefined}
              className={`border-b pb-1 transition-colors ${item.key === current ? "border-white text-white" : "border-transparent text-[#a7a7a3] hover:text-white"}`}
              href={item.href}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <Link className="text-xs tracking-[.12em] text-[#a7a7a3] uppercase hover:text-white" href="/">
            View site <span aria-hidden="true">↗</span>
          </Link>
          <CrewSignOut />
        </div>
      </div>
    </header>
  );
}
