"use client";

import { FormEvent, useRef, useState } from "react";

import { createBrowserRequestId } from "@/lib/browser-request-id";

const fieldClassName =
  "min-h-11 w-full border border-[#565656] bg-transparent px-4 py-2.5 text-base text-white outline-none transition-colors placeholder:text-[#777] focus:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

export function QuickEnquiryForm() {
  const [feedback, setFeedback] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      const invalid = Array.from(form.elements)
        .filter(
          (element): element is HTMLInputElement | HTMLTextAreaElement =>
            (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
            !element.checkValidity(),
        )
        .map((element) => element.name);
      setInvalidFields(invalid);
      setFeedback("Please complete the required fields before sending.");
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }

    setInvalidFields([]);
    setIsSubmitting(true);
    setFeedback("Sending your enquiry…");

    const data = new FormData(form);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "quick_enquiry",
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
      setFeedback(
        result.message ??
          "Thanks — your enquiry has been sent. A member of the Studio GQ team will be in touch shortly.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error && error.message
          ? error.message
          : "We could not send your enquiry. Please try again or email bookings@studiogq.co.za.",
      );
    } finally {
      setIsSubmitting(false);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  }

  return (
    <form aria-busy={isSubmitting} className="space-y-4" noValidate onSubmit={handleSubmit}>
      <fieldset className="contents" disabled={isSubmitting}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="quick-name">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={invalidFields.includes("name") ? "quick-feedback" : undefined}
            aria-invalid={invalidFields.includes("name")}
            autoComplete="name"
            className={fieldClassName}
            id="quick-name"
            name="name"
            required
            type="text"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="quick-email">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={invalidFields.includes("email") ? "quick-feedback" : undefined}
            aria-invalid={invalidFields.includes("email")}
            autoComplete="email"
            className={fieldClassName}
            id="quick-email"
            inputMode="email"
            name="email"
            required
            type="email"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-white" htmlFor="quick-phone">
          Phone <span className="text-[#a7a7a3]">(optional)</span>
        </label>
        <input
          autoComplete="tel"
          className={fieldClassName}
          id="quick-phone"
          inputMode="tel"
          name="phone"
          type="tel"
        />
      </div>

      <div aria-hidden="true" hidden>
        <label htmlFor="quick-website">Website</label>
        <input autoComplete="off" id="quick-website" name="website" tabIndex={-1} type="text" />
      </div>

      <div>
        <label className="mb-2 block text-sm text-white" htmlFor="quick-message">
          How can we help? <span aria-hidden="true">*</span>
        </label>
        <textarea
          aria-describedby={invalidFields.includes("message") ? "quick-feedback" : undefined}
          aria-invalid={invalidFields.includes("message")}
          className={`${fieldClassName} min-h-24 resize-y`}
          id="quick-message"
          maxLength={1500}
          name="message"
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          className="min-h-11 border border-white bg-white px-6 py-2.5 text-xs font-medium tracking-[0.18em] text-[#050505] transition-colors hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "SENDING…" : "SEND QUICK ENQUIRY"} <span aria-hidden="true">→</span>
        </button>
        <p
          aria-live="polite"
          className="max-w-sm text-sm leading-6 text-[#a7a7a3] outline-none"
          id="quick-feedback"
          ref={feedbackRef}
          tabIndex={-1}
        >
          {feedback}
        </p>
      </div>
      </fieldset>
    </form>
  );
}
