"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { bookingSessions, currentJohannesburgDate, sessionDetails } from "@/lib/booking-schema";

type SessionValue = (typeof bookingSessions)[number]["value"];
type OccupiedSlot = "morning" | "afternoon";

type AvailabilityResponse = {
  configured: boolean;
  month: string;
  occupied: Array<{ date: string; slots: OccupiedSlot[] }>;
};

type AvailabilityState =
  | { kind: "loading" }
  | { kind: "ready"; occupied: Map<string, Set<OccupiedSlot>> }
  | { kind: "preview" }
  | { kind: "error" };

type BookingCalendarProps = {
  refreshKey: number;
  selectedDates: string[];
  selectedSession: SessionValue | "";
  onDatesChange: (dates: string[]) => void;
  onSessionChange: (session: SessionValue | "") => void;
  onConfigurationChange: (configured: boolean | null) => void;
  dateError?: string[];
  sessionError?: string[];
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en-ZA", {
  month: "long",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date) {
  return toDateKey(date).slice(0, 7);
}

function startOfToday() {
  const [year, month, day] = currentJohannesburgDate().split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isSessionOccupied(session: SessionValue, slots: Set<OccupiedSlot>) {
  if (session === "full_day") return slots.has("morning") || slots.has("afternoon");
  return slots.has(session);
}

export function BookingCalendar({
  refreshKey,
  selectedDates,
  selectedSession,
  onDatesChange,
  onSessionChange,
  onConfigurationChange,
  dateError,
  sessionError,
}: BookingCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = startOfToday();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [availability, setAvailability] = useState<AvailabilityState>({ kind: "loading" });

  const loadAvailability = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/availability?month=${monthKey(displayMonth)}`, {
        headers: { Accept: "application/json" },
        signal,
      });
      const result = (await response.json()) as Partial<AvailabilityResponse>;

      if (!response.ok) throw new Error("Availability request failed");
      if (!result.configured) {
        setAvailability({ kind: "preview" });
        onConfigurationChange(false);
        return;
      }

      const occupied = new Map<string, Set<OccupiedSlot>>();
      for (const entry of result.occupied ?? []) {
        occupied.set(entry.date, new Set(entry.slots));
      }
      setAvailability({ kind: "ready", occupied });
      onConfigurationChange(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAvailability({ kind: "error" });
      onConfigurationChange(null);
    }
  }, [displayMonth, onConfigurationChange]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadAvailability(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadAvailability, refreshKey]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const daysInMonth = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0,
    ).getDate();
    const mondayFirstOffset = (firstDay.getDay() + 6) % 7;
    const cells: Array<Date | null> = Array.from({ length: mondayFirstOffset }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [displayMonth]);

  const today = startOfToday();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoBack = displayMonth > currentMonth;
  const selectionEnabled = availability.kind === "ready" || availability.kind === "preview";
  const selectedDateSlots = (date: string) =>
    availability.kind === "ready"
      ? availability.occupied.get(date) ?? new Set<OccupiedSlot>()
      : new Set<OccupiedSlot>();

  useEffect(() => {
    if (
      selectedSession &&
      availability.kind === "ready" &&
      selectedDates.some((date) => isSessionOccupied(selectedSession, selectedDateSlots(date)))
    ) {
      onSessionChange("");
    }
  }, [availability, onSessionChange, selectedDates, selectedSession]);

  function changeMonth(offset: number) {
    setAvailability({ kind: "loading" });
    onConfigurationChange(null);
    setDisplayMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + offset, 1),
    );
  }

  function selectDate(date: string) {
    const nextDates = selectedDates.includes(date)
      ? selectedDates.filter((selected) => selected !== date)
      : [...selectedDates, date].sort();
    onDatesChange(nextDates);
  }

  return (
    <fieldset
      aria-describedby={`booking-availability-status booking-rate-note${dateError?.length ? " date-error" : ""}${sessionError?.length ? " session-error" : ""}`}
      className="border border-[#565656] p-4 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] sm:p-5"
      id="booking-calendar"
      tabIndex={-1}
    >
      <legend className="px-2 text-xs tracking-[0.18em] text-[#a7a7a3]">
        CHOOSE A DATE &amp; SESSION
      </legend>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.92fr)] xl:gap-7">
        <div>
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="Previous month"
              className="grid size-11 place-items-center border border-[#565656] transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-30"
              disabled={!canGoBack}
              onClick={() => changeMonth(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <p aria-live="polite" className="text-base tracking-[-0.01em]">
              {monthFormatter.format(displayMonth)}
            </p>
            <button
              aria-label="Next month"
              className="grid size-11 place-items-center border border-[#565656] transition-colors hover:border-white"
              onClick={() => changeMonth(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>

          <table className="mt-3 w-full table-fixed border-collapse text-center">
            <caption className="sr-only">Select a studio booking date</caption>
            <thead>
              <tr>
                {weekDays.map((day) => (
                  <th
                    className="pb-2 text-[10px] font-normal tracking-[0.12em] text-[#a7a7a3]"
                    key={day}
                    scope="col"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: calendarCells.length / 7 }, (_, week) => (
                <tr key={week}>
                  {calendarCells.slice(week * 7, week * 7 + 7).map((date, index) => {
                    if (!date) return <td className="p-0.5" key={`empty-${index}`} />;

                    const dateKey = toDateKey(date);
                    const slots =
                      availability.kind === "ready"
                        ? availability.occupied.get(dateKey) ?? new Set<OccupiedSlot>()
                        : new Set<OccupiedSlot>();
                    const isPast = date < today;
                    const isFull = slots.has("morning") && slots.has("afternoon");
                    const isPartial = !isFull && slots.size > 0;
                    const isSelected = selectedDates.includes(dateKey);
                    const disabled =
                      isPast ||
                      !selectionEnabled ||
                      (isFull && !isSelected) ||
                      (!isSelected && selectedDates.length >= 14);
                    const stateLabel = !selectionEnabled
                      ? "availability loading"
                      : isFull
                        ? "fully booked"
                        : isPartial
                          ? "some sessions booked"
                          : availability.kind === "preview"
                            ? isSelected
                              ? "selected preview date"
                              : "preview date available"
                            : isSelected
                              ? "selected"
                              : "sessions open";

                    return (
                      <td className="p-0.5" key={dateKey}>
                        <button
                          aria-label={`${dayFormatter.format(date)} — ${stateLabel}`}
                          aria-pressed={isSelected}
                          className={`relative grid aspect-square w-full place-items-center border text-sm transition-colors ${
                            isSelected
                              ? "border-white bg-white text-[#050505]"
                              : "border-transparent hover:border-[#737373]"
                          } disabled:cursor-not-allowed disabled:text-[#686868] disabled:hover:border-transparent`}
                          disabled={disabled}
                          onClick={() => selectDate(dateKey)}
                          type="button"
                        >
                          {date.getDate()}
                          {isPartial ? (
                            <span
                              aria-hidden="true"
                              className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-[#050505]" : "bg-white"}`}
                            />
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 min-h-10 text-sm leading-6 text-[#c2c2bf]" id="booking-availability-status">
            {availability.kind === "loading" ? (
              <p role="status">Checking the booking calendar…</p>
            ) : null}
            {availability.kind === "preview" ? (
              <p role="status">
                <span className="text-white">Preview availability.</span> Dates and sessions are
                selectable now; live availability will appear here once the calendar is connected.
              </p>
            ) : null}
            {availability.kind === "error" ? (
              <p role="alert">
                We could not load the booking calendar. Please try again or contact the studio.
              </p>
            ) : null}
            {availability.kind === "ready" ? (
              <p>
                A dot means one half-day session is already booked. Select every date
                you would like to include in this booking.
              </p>
            ) : null}
          </div>
          {selectedDates.length ? (
            <p className="mt-3 text-sm leading-6 text-white">
              {selectedDates.length} date{selectedDates.length === 1 ? "" : "s"} selected: {selectedDates.join(", ")}
            </p>
          ) : null}
          {dateError?.length ? (
            <p className="mt-2 text-sm text-white" id="date-error">
              {dateError[0]}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs tracking-[0.16em] text-[#a7a7a3]">SESSION &amp; RATE</p>
          <div className="mt-3 grid gap-2">
            {bookingSessions.map((session) => {
              const occupied = selectedDates.some((date) =>
                isSessionOccupied(session.value, selectedDateSlots(date)),
              );
              const disabled = !selectedDates.length || !selectionEnabled || occupied;
              const isSelected = selectedSession === session.value;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`flex min-h-[74px] items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "border-white bg-white text-[#050505]"
                      : "border-[#565656] hover:border-white"
                  } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#565656]`}
                  disabled={disabled}
                  key={session.value}
                  onClick={() => onSessionChange(session.value)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm">{session.label}</span>
                    <span
                      className={`mt-1 block text-xs ${isSelected ? "text-[#565656]" : "text-[#a7a7a3]"}`}
                    >
                      {session.time}{occupied ? " · Unavailable on one or more selected dates" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm">{session.priceLabel}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#a7a7a3]" id="booking-rate-note">
            Half day R2,500 · Full day R4,500, per day. Rates exclude gear; equipment and
            production support are quoted separately.
          </p>
          {selectedSession && selectedDates.length ? (
            <p className="mt-2 text-sm text-white">
              Studio rate for {selectedDates.length} day{selectedDates.length === 1 ? "" : "s"}: {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(sessionDetails[selectedSession].priceZar * selectedDates.length)}
            </p>
          ) : null}
          {sessionError?.length ? (
            <p className="mt-2 text-sm text-white" id="session-error">
              {sessionError[0]}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
