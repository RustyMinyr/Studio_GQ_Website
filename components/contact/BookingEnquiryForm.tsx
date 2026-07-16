"use client";

import { FormEvent, useCallback, useRef, useState } from "react";

import { BookingCalendar } from "@/components/contact/BookingCalendar";
import {
  bookingSchema,
  bookingSessions,
  facilitiesOptions,
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

export function BookingEnquiryForm() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSession, setSelectedSession] = useState<BookingSession | "">("");
  const [calendarConfigured, setCalendarConfigured] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const feedbackRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleConfigurationChange = useCallback((configured: boolean | null) => {
    setCalendarConfigured(configured);
  }, []);

  function focusFeedback() {
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }

  function resetForm() {
    formRef.current?.reset();
    setSelectedDate("");
    setSelectedSession("");
    setFieldErrors({});
  }

  function openPreparedEmail(payload: ReturnType<typeof bookingSchema.parse>) {
    const session = bookingSessions.find((option) => option.value === payload.session);
    const facilities = facilitiesOptions.find(
      (option) => option.value === payload.facilitiesNeeded,
    );
    const emailBody = [
      "Studio GQ booking enquiry",
      "",
      `Requested date: ${formatDate(payload.date)}`,
      `Session: ${sessionDetails[payload.session].label}`,
      `Rate: ${session?.priceLabel ?? ""} excluding gear`,
      `Facilities needed: ${facilities?.label ?? payload.facilitiesNeeded}`,
      `Estimated crew size: ${payload.crewSize ?? "Not specified"}`,
      "",
      `Name: ${payload.name}`,
      `Company: ${payload.company || "Not specified"}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone}`,
      "",
      "About the production:",
      payload.message,
    ].join("\n");
    const subject = `Studio GQ booking enquiry — ${formatDate(payload.date)}`;

    window.location.href = `mailto:bookings@studiogq.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmission({ kind: "submitting" });
    setFieldErrors({});

    const rawPayload = Object.fromEntries(new FormData(form).entries());
    const parsed = bookingSchema.safeParse(rawPayload);

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setSubmission({
        kind: "error",
        message: "Check the highlighted fields and try again.",
      });
      focusFeedback();
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

      if (response.status === 409 || result.code === "slot_unavailable") {
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

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setSubmission({
          kind: "error",
          message: result.message ?? "We could not submit your booking. Please try again.",
        });
        focusFeedback();
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
        message: "We could not connect. Please try again or email bookings@studiogq.co.za.",
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
    <form className="space-y-6" noValidate onSubmit={handleSubmit} ref={formRef}>
      <BookingCalendar
        dateError={fieldErrors.date}
        onConfigurationChange={handleConfigurationChange}
        onDateChange={setSelectedDate}
        onSessionChange={setSelectedSession}
        refreshKey={refreshKey}
        selectedDate={selectedDate}
        selectedSession={selectedSession}
        sessionError={fieldErrors.session}
      />

      <input name="date" type="hidden" value={selectedDate} />
      <input name="session" type="hidden" value={selectedSession} />

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

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)]">
        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="facilitiesNeeded">
            Facilities needed <span aria-hidden="true">*</span>
          </label>
          <select
            aria-describedby={
              fieldErrors.facilitiesNeeded ? "facilities-needed-error" : undefined
            }
            aria-invalid={Boolean(fieldErrors.facilitiesNeeded)}
            className={`${fieldClassName} [color-scheme:dark]`}
            defaultValue=""
            id="facilitiesNeeded"
            name="facilitiesNeeded"
            required
          >
            <option disabled value="">
              Choose facilities
            </option>
            {facilitiesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError errors={fieldErrors.facilitiesNeeded} id="facilities-needed-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="crewSize">
            Crew size <span className="text-[#a7a7a3]">(optional)</span>
          </label>
          <input
            aria-describedby={fieldErrors.crewSize ? "crew-size-error" : undefined}
            aria-invalid={Boolean(fieldErrors.crewSize)}
            className={fieldClassName}
            id="crewSize"
            inputMode="numeric"
            min="1"
            name="crewSize"
            step="1"
            type="number"
          />
          <FieldError errors={fieldErrors.crewSize} id="crew-size-error" />
        </div>
      </div>

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
        <p className="mt-2 text-sm text-[#a7a7a3]" id="message-hint">
          Include any equipment, audio, crew, access, or production support requirements.
        </p>
        <FieldError errors={fieldErrors.message} id="message-error" />
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          className="min-h-12 border border-white bg-white px-6 py-3 text-xs font-medium tracking-[0.18em] text-[#050505] transition-colors hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "SENDING…" : "CONTINUE BOOKING ENQUIRY →"}
        </button>
        {calendarConfigured === false ? (
          <p className="max-w-sm text-xs leading-5 text-[#a7a7a3]">
            Preview mode opens a prepared email for you to review and send.
          </p>
        ) : null}
      </div>
    </form>
  );
}
