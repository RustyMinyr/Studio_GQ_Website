"use client";

import Link from "next/link";
import { FormEvent, useCallback, useRef, useState } from "react";

import { BookingCalendar } from "@/components/contact/BookingCalendar";
import {
  additionalItemOptions,
  bookingSchema,
  bookingSessions,
  sessionDetails,
  type BookingSession,
} from "@/lib/booking-schema";

type FieldErrors = Record<string, string[] | undefined>;

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const fieldClassName =
  "min-h-12 w-full border border-[#565656] bg-transparent px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-[#a7a7a3] focus:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;

  return (
    <p className="mt-2 text-sm text-white" id={id}>
      {errors[0]}
    </p>
  );
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

function generateRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure random identifiers are unavailable.");
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function BookingEnquiryForm() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<BookingSession | "">("");
  const [calendarConfigured, setCalendarConfigured] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const feedbackRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const requestIdRef = useRef<string | null>(null);

  const handleConfigurationChange = useCallback((configured: boolean | null) => {
    setCalendarConfigured(configured);
  }, []);

  function focusFeedback() {
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }

  function focusFirstError(errors: FieldErrors) {
    requestAnimationFrame(() => {
      const selector =
        errors.dates?.length || errors.session?.length
          ? "#booking-calendar"
          : '[aria-invalid="true"]';
      formRef.current?.querySelector<HTMLElement>(selector)?.focus();
    });
  }

  function resetForm() {
    formRef.current?.reset();
    requestIdRef.current = null;
    setSelectedDates([]);
    setSelectedSession("");
    setFieldErrors({});
  }

  function requestId() {
    requestIdRef.current ??= generateRequestId();
    return requestIdRef.current;
  }

  function resetRequestId() {
    if (submission.kind === "submitting") return;
    requestIdRef.current = null;
  }

  function handleDatesChange(dates: string[]) {
    resetRequestId();
    setSelectedDates(dates);
  }

  function handleSessionChange(session: BookingSession | "") {
    if (session !== selectedSession) resetRequestId();
    setSelectedSession(session);
  }

  function openPreparedEmail(payload: ReturnType<typeof bookingSchema.parse>) {
    const session = bookingSessions.find((option) => option.value === payload.session);
    const selectedExtras = additionalItemOptions
      .filter((option) => payload.additionalItems.includes(option.value))
      .map((option) => option.label);
    const emailBody = [
      "Studio GQ booking enquiry",
      "",
      "Requested dates:",
      ...payload.dates.map((date) => `• ${formatDate(date)}`),
      `Session: ${sessionDetails[payload.session].label}`,
      `Rate: ${session?.priceLabel ?? ""} excluding gear`,
      `Additional items: ${selectedExtras.length ? selectedExtras.join(", ") : "None"}`,
      "Additional items are quoted separately.",
      "",
      `Name: ${payload.name}`,
      `Company: ${payload.company || "Not specified"}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone}`,
      "",
      "About the production:",
      payload.message,
    ].join("\n");
    const subject = `Studio GQ booking enquiry — ${payload.dates.length} day${payload.dates.length === 1 ? "" : "s"}`;

    window.location.href = `mailto:booking@studiogq.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmission({ kind: "submitting" });
    setFieldErrors({});

    let currentRequestId: string;
    try {
      currentRequestId = requestId();
    } catch {
      setSubmission({
        kind: "error",
        message:
          "This browser could not securely identify the booking request. Please refresh or email booking@studiogq.co.za.",
      });
      focusFeedback();
      return;
    }

    const formData = new FormData(form);
    const rawPayload = {
      ...Object.fromEntries(formData.entries()),
      requestId: currentRequestId,
      dates: formData.getAll("dates"),
      additionalItems: formData.getAll("additionalItems"),
    };
    const parsed = bookingSchema.safeParse(rawPayload);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors(errors);
      setSubmission({
        kind: "error",
        message: "Check the highlighted fields and try again.",
      });
      focusFirstError(errors);
      return;
    }

    if (parsed.data.website?.trim()) {
      resetForm();
      setSubmission({ kind: "success", message: "Thanks. Your request has been noted." });
      focusFeedback();
      return;
    }

    if (calendarConfigured === false) {
      openPreparedEmail(parsed.data);
      resetForm();
      setSubmission({
        kind: "success",
        message: "Your email app is opening with the booking details ready to send.",
      });
      focusFeedback();
      return;
    }

    if (calendarConfigured === null) {
      setSubmission({
        kind: "error",
        message: "The calendar is still loading. Please wait a moment and try again.",
      });
      focusFeedback();
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as {
        message?: string;
        errors?: FieldErrors;
        code?: string;
      };

      if (result.code === "slot_unavailable") {
        resetRequestId();
        setRefreshKey((key) => key + 1);
        setSelectedSession("");
        setSubmission({
          kind: "error",
          message:
            result.message ??
            "That session has just been booked. The calendar has been refreshed; please choose another.",
        });
        focusFeedback();
        return;
      }

      if (result.code === "request_mismatch") {
        resetRequestId();
        setSubmission({
          kind: "error",
          message:
            result.message ??
            "This booking attempt no longer matches the original request. Please try again.",
        });
        focusFeedback();
        return;
      }

      if (!response.ok) {
        const errors = result.errors ?? {};
        setFieldErrors(errors);
        setSubmission({
          kind: "error",
          message: result.message ?? "We could not submit your booking. Please try again.",
        });
        if (Object.keys(errors).length) focusFirstError(errors);
        else focusFeedback();
        return;
      }

      resetForm();
      setSubmission({
        kind: "success",
        message: result.message ?? "Your studio booking has been received.",
      });
      focusFeedback();
    } catch {
      setSubmission({
        kind: "error",
        message: "We could not connect. Please try again or email booking@studiogq.co.za.",
      });
      focusFeedback();
    }
  }

  const isSubmitting = submission.kind === "submitting";
  const feedbackMessage =
    submission.kind === "error" || submission.kind === "success"
      ? submission.message
      : null;

  return (
    <form
      aria-busy={isSubmitting}
      className="space-y-6"
      noValidate
      onChange={resetRequestId}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <fieldset className="contents" disabled={isSubmitting}>
      <legend className="sr-only">Studio booking enquiry</legend>
      <BookingCalendar
        dateError={fieldErrors.dates}
        onConfigurationChange={handleConfigurationChange}
        onDatesChange={handleDatesChange}
        onSessionChange={handleSessionChange}
        refreshKey={refreshKey}
        selectedDates={selectedDates}
        selectedSession={selectedSession}
        sessionError={fieldErrors.session}
      />

      {selectedDates.map((date) => (
        <input key={date} name="dates" type="hidden" value={date} />
      ))}
      <input name="session" type="hidden" value={selectedSession} />

      <fieldset className="border border-[#565656] p-5 sm:p-6">
        <legend className="px-2 text-xs tracking-[0.18em] text-[#a7a7a3]">
          ADDITIONAL ITEMS
        </legend>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {additionalItemOptions.map((option) => (
            <label
              className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-white"
              key={option.value}
            >
              <input
                className="h-5 w-5 shrink-0 accent-white"
                name="additionalItems"
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-5 border-t border-[#565656] pt-4 text-sm leading-6 text-[#a7a7a3]">
          Optional additions are not included in the studio rate and will be quoted
          separately once we review your booking.
        </p>
      </fieldset>

      <div
        aria-live="polite"
        className="outline-none"
        ref={feedbackRef}
        tabIndex={-1}
      >
        {submission.kind === "submitting" ? (
          <p className="border border-[#565656] p-4 text-sm text-white" role="status">
            Sending your booking enquiry…
          </p>
        ) : null}
        {feedbackMessage ? (
          <p
            className="border border-white p-4 text-sm text-white"
            role={submission.kind === "error" ? "alert" : "status"}
          >
            {feedbackMessage}
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-4 text-xs tracking-[0.18em] text-[#a7a7a3]">
          YOUR DETAILS
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white" htmlFor="name">
              Name <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              aria-invalid={Boolean(fieldErrors.name)}
              autoComplete="name"
              className={fieldClassName}
              id="name"
              name="name"
              required
              type="text"
            />
            <FieldError errors={fieldErrors.name} id="name-error" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white" htmlFor="company">
              Company <span className="text-[#a7a7a3]">(optional)</span>
            </label>
            <input
              aria-describedby={fieldErrors.company ? "company-error" : undefined}
              aria-invalid={Boolean(fieldErrors.company)}
              autoComplete="organization"
              className={fieldClassName}
              id="company"
              name="company"
              type="text"
            />
            <FieldError errors={fieldErrors.company} id="company-error" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white" htmlFor="email">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              autoComplete="email"
              className={fieldClassName}
              id="email"
              inputMode="email"
              name="email"
              required
              type="email"
            />
            <FieldError errors={fieldErrors.email} id="email-error" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white" htmlFor="phone">
              Phone <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              aria-invalid={Boolean(fieldErrors.phone)}
              autoComplete="tel"
              className={fieldClassName}
              id="phone"
              inputMode="tel"
              name="phone"
              required
              type="tel"
            />
            <FieldError errors={fieldErrors.phone} id="phone-error" />
          </div>
        </div>
      </fieldset>

      <div>
        <label className="mb-2 block text-sm text-white" htmlFor="message">
          Tell us about your production <span aria-hidden="true">*</span>
        </label>
        <textarea
          aria-describedby={
            fieldErrors.message ? "message-hint message-error" : "message-hint"
          }
          aria-invalid={Boolean(fieldErrors.message)}
          className={`${fieldClassName} min-h-28 resize-y`}
          id="message"
          maxLength={2000}
          name="message"
          required
        />
        <p
          className="mt-3 max-w-2xl text-sm leading-6 text-[#a7a7a3]"
          id="message-hint"
        >
          Include any equipment, audio, crew, access, or production support requirements.
        </p>
        <FieldError errors={fieldErrors.message} id="message-error" />
      </div>

      <div aria-hidden="true" hidden>
        <label htmlFor="website">Website</label>
        <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
      </div>

      <div
        className="border-t border-[#565656] pt-6 sm:pt-8"
        data-testid="booking-submit-panel"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <button
            className="flex min-h-14 w-full items-center justify-between gap-5 border border-white bg-white px-6 py-4 text-left text-xs font-medium tracking-[0.18em] text-[#050505] transition-colors hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            <span className="whitespace-nowrap">
              {isSubmitting ? "SUBMITTING…" : "SUBMIT BOOKING"}
            </span>
            <span aria-hidden="true">→</span>
          </button>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            <div>
              <p className="text-[10px] font-medium tracking-[0.18em] text-white">
                YOUR INFORMATION
              </p>
              <p className="mt-2 max-w-md text-xs leading-5 text-[#a7a7a3]">
                By submitting, you agree that Studio GQ may use the details provided
                to respond to and manage your booking request. Read our{" "}
                <Link className="text-white underline underline-offset-4" href="/privacy">
                  privacy policy
                </Link>
                .
              </p>
            </div>
            {calendarConfigured === false ? (
              <div className="border-t border-[#363636] pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <p className="text-[10px] font-medium tracking-[0.18em] text-white">
                  PREVIEW MODE
                </p>
                <p className="mt-2 max-w-sm text-xs leading-5 text-[#a7a7a3]">
                  Your booking details will open in a prepared email for you to review
                  and send.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </fieldset>
    </form>
  );
}
