"use client";

import { FormEvent, useRef, useState } from "react";

import { projectTypes } from "@/lib/contact-schema";

type FieldErrors = Record<string, string[] | undefined>;

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const fieldClassName =
  "min-h-12 w-full border border-[#565656] bg-transparent px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-[#a7a7a3] focus:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;

  return (
    <p className="mt-2 text-sm text-white" id={id}>
      {errors[0]}
    </p>
  );
}

export function BookingEnquiryForm() {
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const feedbackRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setSubmission({ kind: "submitting" });
    setFieldErrors({});

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        message?: string;
        errors?: FieldErrors;
      };

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setSubmission({
          kind: "error",
          message: result.message ?? "We could not submit your enquiry. Please try again.",
        });
        requestAnimationFrame(() => feedbackRef.current?.focus());
        return;
      }

      if (typeof payload.website === "string" && payload.website.trim()) {
        form.reset();
        setSubmission({ kind: "success", message: "Thanks. Your request has been noted." });
        return;
      }

      const emailBody = [
        `Name: ${payload.name ?? ""}`,
        `Company: ${payload.company ?? ""}`,
        `Email: ${payload.email ?? ""}`,
        `Phone: ${payload.phone ?? ""}`,
        `Project type: ${payload.projectType ?? ""}`,
        `Preferred date: ${payload.preferredDate ?? ""}`,
        `Shoot days: ${payload.shootDays ?? ""}`,
        `Crew size: ${payload.crewSize ?? ""}`,
        "",
        String(payload.message ?? ""),
      ].join("\n");
      form.reset();
      setSubmission({
        kind: "success",
        message: "Your email app is opening. Send the prepared email to complete your booking enquiry.",
      });
      window.location.href = `mailto:bookings@studiogq.co.za?subject=${encodeURIComponent(`Studio GQ booking enquiry — ${String(payload.projectType ?? "production")}`)}&body=${encodeURIComponent(emailBody)}`;
      requestAnimationFrame(() => feedbackRef.current?.focus());
    } catch {
      setSubmission({
        kind: "error",
        message:
          "We could not connect. Please try again or email bookings@studiogq.co.za.",
      });
      requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  }

  const isSubmitting = submission.kind === "submitting";
  const feedbackMessage =
    submission.kind === "error" || submission.kind === "success"
      ? submission.message
      : null;

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
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

      <div className="grid gap-6 md:grid-cols-2">
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

        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="projectType">
            Project type <span aria-hidden="true">*</span>
          </label>
          <select
            aria-describedby={fieldErrors.projectType ? "project-type-error" : undefined}
            aria-invalid={Boolean(fieldErrors.projectType)}
            className={`${fieldClassName} [color-scheme:dark]`}
            defaultValue=""
            id="projectType"
            name="projectType"
            required
          >
            <option disabled value="">
              Choose a project type
            </option>
            {projectTypes.map((projectType) => (
              <option key={projectType} value={projectType}>
                {projectType}
              </option>
            ))}
          </select>
          <FieldError errors={fieldErrors.projectType} id="project-type-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="preferredDate">
            Preferred date <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={fieldErrors.preferredDate ? "date-hint date-error" : "date-hint"}
            aria-invalid={Boolean(fieldErrors.preferredDate)}
            className={`${fieldClassName} [color-scheme:dark]`}
            id="preferredDate"
            name="preferredDate"
            required
            type="date"
          />
          <p className="mt-2 text-sm text-[#a7a7a3]" id="date-hint">
            We will confirm availability with you.
          </p>
          <FieldError errors={fieldErrors.preferredDate} id="date-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="shootDays">
            Number of shoot days <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={fieldErrors.shootDays ? "shoot-days-error" : undefined}
            aria-invalid={Boolean(fieldErrors.shootDays)}
            className={fieldClassName}
            id="shootDays"
            inputMode="numeric"
            min="1"
            name="shootDays"
            required
            step="1"
            type="number"
          />
          <FieldError errors={fieldErrors.shootDays} id="shoot-days-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="crewSize">
            Estimated crew size <span className="text-[#a7a7a3]">(optional)</span>
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
          aria-describedby={fieldErrors.message ? "message-hint message-error" : "message-hint"}
          aria-invalid={Boolean(fieldErrors.message)}
          className={`${fieldClassName} min-h-40 resize-y`}
          id="message"
          maxLength={2000}
          name="message"
          required
        />
        <p className="mt-2 text-sm text-[#a7a7a3]" id="message-hint">
          Include any space, equipment, audio, crew, or production support requirements.
        </p>
        <FieldError errors={fieldErrors.message} id="message-error" />
      </div>

      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
      </div>

      <button
        className="min-h-12 border border-white bg-white px-6 py-3 text-xs font-medium tracking-[0.18em] text-[#050505] transition-colors hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "SENDING…" : "SEND BOOKING ENQUIRY →"}
      </button>
    </form>
  );
}
