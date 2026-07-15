"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const email = new FormData(form).get("email")?.toString() ?? "";
    setMessage("Your email app is opening. Send the prepared message to request updates.");
    window.location.href = `mailto:bookings@studiogq.co.za?subject=${encodeURIComponent("Studio GQ updates")}&body=${encodeURIComponent(`Please add ${email} to the Studio GQ update list.`)}`;
    form.reset();
  }

  return (
    <form className="newsletter-form" onSubmit={onSubmit}>
      <label htmlFor="newsletter-email">Email address</label>
      <div className="newsletter-form__field">
        <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
        <button type="submit" aria-label="Join the Studio GQ newsletter">{"\u2192"}</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
    </form>
  );
}
