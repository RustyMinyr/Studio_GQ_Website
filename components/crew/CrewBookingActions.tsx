"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { CrewBooking } from "@/lib/crew-types";

type CrewBookingActionsProps = {
  booking: CrewBooking;
};

type ActionName = "confirm" | "cancel" | "reschedule";
type ActionStatus = "idle" | "sending" | "success" | "error";
const MAX_QUOTE_BYTES = 3 * 1024 * 1024;

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("The quote could not be read."));
        return;
      }
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("The quote could not be read."));
    reader.readAsDataURL(file);
  });
}

export function CrewBookingActions({ booking }: CrewBookingActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState("");

  async function updateBooking(action: ActionName, form?: FormData) {
    setStatus("sending");
    setMessage("");
    try {
      const payload: Record<string, string | undefined | { filename: string; content: string }> = {
        action,
        date: typeof form?.get("date") === "string" ? String(form.get("date")) : undefined,
        session: typeof form?.get("session") === "string" ? String(form.get("session")) : undefined,
      };
      if (action === "confirm") {
        const note = form?.get("note");
        if (typeof note === "string" && note.trim()) payload.note = note.trim();
        const quote = form?.get("quote");
        if (quote instanceof File && quote.size > 0) {
          if (!quote.name.toLowerCase().endsWith(".pdf") || quote.type !== "application/pdf") {
            throw new Error("Attach the quote as a PDF file.");
          }
          if (quote.size > MAX_QUOTE_BYTES) {
            throw new Error("Keep the quote PDF under 3 MB.");
          }
          payload.quote = { filename: quote.name, content: await readFileAsBase64(quote) };
        }
      }
      const response = await fetch(`/api/crew/bookings/${booking.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? result?.message ?? "The booking could not be updated.");
      setStatus("success");
      setMessage(result?.message ?? "Booking updated.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The booking could not be updated.");
    }
  }

  function onReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void updateBooking("reschedule", new FormData(event.currentTarget));
  }

  function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void updateBooking("confirm", new FormData(event.currentTarget));
  }

  const isBusy = status === "sending";
  const isCancelled = booking.status === "cancelled" || booking.status === "expired";

  return (
    <section className="border border-[#565656] bg-[#101010] p-5 text-white sm:p-6" aria-labelledby="booking-actions-heading">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium tracking-[.2em] text-[#a7a7a3] uppercase">Booking actions</p>
        <button
          aria-label="Close booking actions and return to the crew portal"
          className="-mt-1 -mr-1 inline-grid size-9 shrink-0 place-items-center border border-[#777] text-xl font-light leading-none text-white transition-colors hover:border-white hover:bg-white hover:text-[#050505]"
          onClick={() => router.push("/crew#bookings")}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <h2 className="mt-3 text-2xl font-normal tracking-[-.035em]" id="booking-actions-heading">Manage this session.</h2>
      <p className="mt-2 text-sm leading-6 text-[#a7a7a3]">Confirm the enquiry once it is approved, or update the date and session if plans change.</p>

      <form className="mt-6 border-t border-[#565656] pt-6" onSubmit={onConfirm}>
        <p className="text-xs font-medium tracking-[.16em] text-[#a7a7a3] uppercase">Confirm and notify client</p>
        <label className="mt-4 block text-xs text-[#a7a7a3]">
          Confirmation message <span className="text-[#777]">(optional)</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-y border border-[#565656] bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#777] focus:border-white"
            disabled={isBusy || booking.status === "confirmed" || isCancelled}
            maxLength={2000}
            name="note"
            placeholder="Add a personal note, arrival details, or next steps for the client."
          />
        </label>
        <label className="mt-4 block text-xs text-[#a7a7a3]">
          Attach quote <span className="text-[#777]">(optional PDF, max 3 MB)</span>
          <input
            accept="application/pdf,.pdf"
            className="mt-2 block w-full cursor-pointer border border-[#565656] bg-transparent px-3 py-2 text-sm text-white file:mr-3 file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:tracking-[.08em] file:text-[#050505] file:uppercase"
            disabled={isBusy || booking.status === "confirmed" || isCancelled}
            name="quote"
            type="file"
          />
        </label>
        <button
          className="mt-4 min-h-11 bg-white px-4 text-xs font-semibold tracking-[.12em] text-[#050505] uppercase transition-colors hover:bg-[#e7e7e4] disabled:cursor-not-allowed disabled:bg-[#565656] disabled:text-[#a7a7a3]"
          disabled={isBusy || booking.status === "confirmed" || isCancelled}
          type="submit"
        >
          {booking.status === "confirmed" ? "Confirmed" : "Confirm booking"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          className="inline-flex min-h-11 items-center border border-[#a7a7a3] px-4 text-xs font-semibold tracking-[.12em] uppercase transition-colors hover:border-white hover:bg-white hover:text-[#050505]"
          href={`mailto:${encodeURIComponent(booking.email ?? "")}?subject=${encodeURIComponent(`Studio GQ booking — ${booking.bookingDate}`)}&body=${encodeURIComponent(`Hi ${booking.name ?? "there"},\n\nRegarding your Studio GQ booking for ${booking.bookingDate}.\n\n`)}`}
        >
          Email client <span aria-hidden="true" className="ml-3">↗</span>
        </a>
      </div>

      <form className="mt-7 border-t border-[#565656] pt-6" onSubmit={onReschedule}>
        <p className="text-xs font-medium tracking-[.16em] text-[#a7a7a3] uppercase">Move booking</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[#a7a7a3]">New date
            <input className="mt-2 min-h-11 w-full border border-[#565656] bg-transparent px-3 text-sm text-white outline-none focus:border-white" defaultValue={booking.bookingDate} name="date" required type="date" />
          </label>
          <label className="text-xs text-[#a7a7a3]">Session
            <select className="mt-2 min-h-11 w-full border border-[#565656] bg-[#101010] px-3 text-sm text-white outline-none focus:border-white" defaultValue={booking.session} name="session">
              <option value="morning">Morning · 08:00–12:00</option>
              <option value="afternoon">Afternoon · 13:00–17:00</option>
              <option value="full_day">Full day · 08:00–18:00</option>
            </select>
          </label>
        </div>
        <button className="mt-4 min-h-11 border border-[#a7a7a3] px-4 text-xs font-semibold tracking-[.12em] uppercase transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:text-[#565656]" disabled={isBusy || isCancelled} type="submit">
          Update session <span aria-hidden="true" className="ml-3">→</span>
        </button>
      </form>

      <div className="mt-6 border-t border-[#565656] pt-5">
        <button
          className="text-xs font-semibold tracking-[.12em] text-[#a7a7a3] uppercase underline-offset-4 transition-colors hover:text-white hover:underline disabled:cursor-not-allowed disabled:text-[#565656]"
          disabled={isBusy || isCancelled}
          onClick={() => {
            if (window.confirm("Cancel this Studio GQ booking? This frees the selected session.")) void updateBooking("cancel");
          }}
          type="button"
        >
          Cancel booking
        </button>
      </div>
      {message ? <p aria-live="polite" className={`mt-5 text-sm leading-6 ${status === "error" ? "text-[#f0a4a4]" : "text-[#b8ddc3]"}`}>{message}</p> : null}
    </section>
  );
}
