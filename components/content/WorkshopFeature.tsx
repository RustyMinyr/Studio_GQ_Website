"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

import { createBrowserRequestId } from "@/lib/browser-request-id";

type WorkshopFeatureProps = {
  compact?: boolean;
  instance?: "home" | "resources";
};

const inputClassName =
  "min-h-12 w-full border border-white/35 bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white focus-visible:ring-2 focus-visible:ring-white";

export function WorkshopFeature({ compact = false, instance = "home" }: WorkshopFeatureProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const idPrefix = `${instance}-workshop`;

  function openDialog() {
    setFeedback("");
    setSubmitted(false);
    dialogRef.current?.showModal();
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  async function submitInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    setIsSubmitting(true);
    setFeedback("Registering your interest…");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "workshop_interest",
          requestId: createBrowserRequestId(),
          name: String(data.get("name") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          message: String(data.get("message") ?? "").trim(),
          website: String(data.get("website") ?? "").trim(),
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message);
      form.reset();
      setSubmitted(true);
      setFeedback(
        result.message ??
          "Thanks — your workshop interest has been registered. We’ll share details when the first date is announced.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error && error.message
          ? error.message
          : "We could not register your interest. Please try again or email bookings@studiogq.co.za.",
      );
    } finally {
      setIsSubmitting(false);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  }

  return (
    <>
    <aside
      aria-labelledby={`${idPrefix}-heading`}
      className={`relative h-full overflow-hidden bg-[#050505] text-white ${
        compact ? "p-7 sm:p-9 lg:p-10" : "p-8 sm:p-12 lg:p-16"
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-12 text-[clamp(9rem,21vw,18rem)] font-light leading-none tracking-[-0.08em] text-white/[0.055]"
      >
        01
      </span>
      <div className="relative">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/55">
          Studio GQ × FilmHouse
        </p>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
          Free practical workshops
        </p>
        <h2
          id={`${idPrefix}-heading`}
          className={`mt-4 max-w-[12ch] font-normal leading-[0.96] tracking-[-0.045em] ${
            compact
              ? "text-[clamp(2.2rem,4vw,3.8rem)]"
              : "text-[clamp(2.8rem,5vw,5.2rem)]"
          }`}
        >
          Real skills. Real use cases.
        </h2>
        <p className="mt-6 max-w-[54ch] text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
          Studio GQ and FilmHouse are developing free, practical one-day courses
          built around hands-on production skills: shaping light, preparing sound,
          working efficiently in a studio and solving the problems that happen on a
          real set.
        </p>
        <div className="mt-8 grid border-y border-white/20 text-[0.62rem] font-semibold uppercase tracking-[0.15em] sm:grid-cols-3">
          {[
            "Free to attend",
            "One practical day",
            "First one coming soon",
          ].map((item) => (
            <span
              className="border-b border-white/20 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <button
          onClick={openDialog}
          type="button"
          className="group mt-8 inline-flex min-h-12 items-center gap-4 border border-white/45 px-5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] transition-colors hover:bg-white hover:text-[#050505]"
        >
          Register interest
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </aside>
    <dialog
      aria-labelledby={`${idPrefix}-dialog-title`}
      className="workshop-dialog"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      ref={dialogRef}
    >
      <div className="relative bg-[#050505] p-6 text-white sm:p-9">
        <button
          aria-label="Close workshop registration"
          className="absolute right-3 top-3 grid size-11 place-items-center border border-white/35 text-2xl transition-colors hover:bg-white hover:text-[#050505]"
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
        <p className="pr-12 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/55">
          Studio GQ × FilmHouse
        </p>
        <h2
          className="mt-4 max-w-[12ch] text-4xl font-normal leading-none tracking-[-0.045em] sm:text-5xl"
          id={`${idPrefix}-dialog-title`}
        >
          Register your interest.
        </h2>
        {submitted ? (
          <div className="mt-7">
            <p className="max-w-xl text-base leading-7 text-white/75" ref={feedbackRef} tabIndex={-1}>
              {feedback}
            </p>
            <button
              className="mt-7 min-h-12 border border-white bg-white px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#050505]"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Close
            </button>
          </div>
        ) : (
          <form aria-busy={isSubmitting} className="mt-7 grid gap-4" onSubmit={submitInterest}>
            <fieldset className="contents" disabled={isSubmitting}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm" htmlFor={`${idPrefix}-name`}>Name *</label>
                  <input autoComplete="name" className={inputClassName} id={`${idPrefix}-name`} name="name" ref={nameInputRef} required type="text" />
                </div>
                <div>
                  <label className="mb-2 block text-sm" htmlFor={`${idPrefix}-email`}>Email *</label>
                  <input autoComplete="email" className={inputClassName} id={`${idPrefix}-email`} name="email" required type="email" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm" htmlFor={`${idPrefix}-phone`}>Phone <span className="text-white/55">(optional)</span></label>
                <input autoComplete="tel" className={inputClassName} id={`${idPrefix}-phone`} name="phone" type="tel" />
              </div>
              <div>
                <label className="mb-2 block text-sm" htmlFor={`${idPrefix}-message`}>What would you most like to learn? <span className="text-white/55">(optional)</span></label>
                <textarea className={`${inputClassName} min-h-24 resize-y`} id={`${idPrefix}-message`} maxLength={1000} name="message" />
              </div>
              <div aria-hidden="true" hidden>
                <label htmlFor={`${idPrefix}-website`}>Website</label>
                <input autoComplete="off" id={`${idPrefix}-website`} name="website" tabIndex={-1} type="text" />
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button className="min-h-12 border border-white bg-white px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#050505] disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Sending…" : "Register interest"}
                </button>
                <p aria-live="polite" className="max-w-sm text-sm leading-6 text-white/65 outline-none" ref={feedbackRef} tabIndex={-1}>{feedback}</p>
              </div>
              <p className="text-xs leading-5 text-white/55">
                We’ll only use these details to respond about Studio GQ workshops. Read our{" "}
                <Link className="underline underline-offset-4" href="/privacy">privacy policy</Link>.
              </p>
            </fieldset>
          </form>
        )}
      </div>
    </dialog>
    </>
  );
}
