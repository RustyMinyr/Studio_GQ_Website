"use client";

import { FormEvent, useState } from "react";

type CrewLoginFormProps = {
  crewEmail: string;
  nextPath: string;
};

type SubmitState = "idle" | "submitting" | "error";

export function CrewLoginForm({ crewEmail, nextPath }: CrewLoginFormProps) {
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/crew/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setSubmitState("error");
        setMessage(result.message ?? "We could not sign you in. Please try again.");
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setSubmitState("error");
      setMessage("We could not sign you in. Please check your connection and try again.");
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="border-y border-[#565656] py-4">
        <p className="text-[10px] tracking-[0.18em] text-[#a7a7a3]">SHARED CREW ACCOUNT</p>
        <p className="mt-2 text-base text-white">{crewEmail}</p>
      </div>

      <div>
        <label className="block text-sm text-white" htmlFor="crew-password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full border border-[#565656] bg-transparent px-4 text-white outline-none transition-colors placeholder:text-[#777] focus:border-white"
          disabled={submitState === "submitting"}
          id="crew-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {message ? (
        <p aria-live="polite" className="text-sm leading-6 text-[#d6d6d2]" role={submitState === "error" ? "alert" : undefined}>
          {message}
        </p>
      ) : null}

      <button
        className="arrow-link arrow-link--light w-full sm:w-auto"
        disabled={submitState === "submitting"}
        type="submit"
      >
        {submitState === "submitting" ? "SIGNING IN…" : "OPEN CREW PORTAL"}
        <span aria-hidden="true" className="arrow-link__arrow">→</span>
      </button>
    </form>
  );
}

