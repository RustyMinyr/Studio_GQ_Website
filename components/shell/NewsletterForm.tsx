"use client";

import { FormEvent, useState } from "react";

import { createBrowserRequestId } from "@/lib/browser-request-id";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const email = new FormData(form).get("email")?.toString() ?? "";
    setIsSubmitting(true);
    setMessage("Sending…");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "newsletter",
          requestId: createBrowserRequestId(),
          email,
          website: "",
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message);
      form.reset();
      setMessage(result.message ?? "Thanks — your request for Studio GQ updates has been received.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "We could not send your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="newsletter-form" onSubmit={onSubmit}>
      <label htmlFor="newsletter-email">Email address</label>
      <div className="newsletter-form__field">
        <input disabled={isSubmitting} id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        <button disabled={isSubmitting} type="submit" aria-label="Request Studio GQ updates">{isSubmitting ? "…" : "\u2192"}</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
    </form>
  );
}
