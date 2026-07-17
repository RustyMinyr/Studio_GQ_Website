"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type BlockStatus = "idle" | "sending" | "success" | "error";

export function CrewCalendarBlocker() {
  const router = useRouter();
  const [status, setStatus] = useState<BlockStatus>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/crew/calendar-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.get("date"),
          session: form.get("session"),
          reason: form.get("reason"),
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? result?.message ?? "The date could not be blocked.");
      setStatus("success");
      setMessage("The selected studio time is now blocked.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The date could not be blocked.");
    }
  }

  return (
    <section className="border border-[#c9c9c5] bg-white p-5 sm:p-6" aria-labelledby="block-date-heading">
      <p className="text-xs font-medium tracking-[.2em] text-[#565656] uppercase">Studio time</p>
      <h2 className="mt-3 text-2xl font-normal tracking-[-.035em]" id="block-date-heading">Block a date</h2>
      <p className="mt-2 text-sm leading-6 text-[#565656]">Use this for maintenance, private studio time or any session that cannot be booked online.</p>
      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="text-xs font-medium tracking-[.1em] uppercase">Date
          <input required className="mt-2 min-h-11 w-full border border-[#a7a7a3] bg-white px-3 text-sm normal-case tracking-normal outline-none focus:border-[#050505]" name="date" type="date" />
        </label>
        <label className="text-xs font-medium tracking-[.1em] uppercase">Time
          <select className="mt-2 min-h-11 w-full border border-[#a7a7a3] bg-white px-3 text-sm normal-case tracking-normal outline-none focus:border-[#050505]" defaultValue="full_day" name="session">
            <option value="morning">Morning · 08:00–12:00</option>
            <option value="afternoon">Afternoon · 13:00–17:00</option>
            <option value="full_day">Full day · 10 hours</option>
          </select>
        </label>
        <label className="text-xs font-medium tracking-[.1em] uppercase sm:col-span-2">Reason <span className="text-[#565656] normal-case tracking-normal">(optional)</span>
          <input className="mt-2 min-h-11 w-full border border-[#a7a7a3] bg-white px-3 text-sm normal-case tracking-normal outline-none focus:border-[#050505]" name="reason" placeholder="e.g. Studio maintenance" type="text" />
        </label>
        <button className="inline-flex min-h-11 items-center justify-center bg-[#050505] px-4 text-xs font-semibold tracking-[.12em] text-white uppercase transition-colors hover:bg-[#303030] disabled:cursor-wait disabled:bg-[#565656] sm:justify-self-start" disabled={status === "sending"} type="submit">
          {status === "sending" ? "Blocking…" : "Block time"} <span aria-hidden="true" className="ml-4">→</span>
        </button>
      </form>
      {message ? <p aria-live="polite" className={`mt-4 text-sm leading-6 ${status === "error" ? "text-[#8e3131]" : "text-[#31513f]"}`}>{message}</p> : null}
    </section>
  );
}
