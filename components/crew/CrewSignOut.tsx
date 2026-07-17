"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CrewSignOut() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/crew/session", { method: "DELETE" });
    } finally {
      router.replace("/crew/login");
      router.refresh();
    }
  }

  return (
    <button
      className="text-xs tracking-[.12em] text-[#a7a7a3] uppercase transition-colors hover:text-white disabled:cursor-wait"
      disabled={isSigningOut}
      onClick={() => void signOut()}
      type="button"
    >
      {isSigningOut ? "Signing out" : "Sign out"}
    </button>
  );
}
