"use client";

import { FormEvent, useRef, useState } from "react";

const fieldClassName =
  "min-h-11 w-full border border-[#565656] bg-transparent px-4 py-2.5 text-base text-white outline-none transition-colors placeholder:text-[#777] focus:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

export function QuickEnquiryForm() {
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      setFeedback("Please complete the required fields before sending.");
      form.reportValidity();
      requestAnimationFrame(() => feedbackRef.current?.focus());
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const body = [
      "Studio GQ quick enquiry",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Enquiry:",
      message,
    ].join("\n");

    setFeedback("Your email app is opening with your enquiry ready to send.");
    requestAnimationFrame(() => feedbackRef.current?.focus());
    window.location.href = `mailto:bookings@studiogq.co.za?subject=${encodeURIComponent(
      `Studio GQ enquiry from ${name}`,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-white" htmlFor="quick-name">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
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

      <div>
        <label className="mb-2 block text-sm text-white" htmlFor="quick-message">
          How can we help? <span aria-hidden="true">*</span>
        </label>
        <textarea
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
          type="submit"
        >
          SEND QUICK ENQUIRY <span aria-hidden="true">→</span>
        </button>
        <p
          aria-live="polite"
          className="max-w-sm text-sm leading-6 text-[#a7a7a3] outline-none"
          ref={feedbackRef}
          tabIndex={-1}
        >
          {feedback}
        </p>
      </div>
    </form>
  );
}
