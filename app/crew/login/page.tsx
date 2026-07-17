import type { Metadata } from "next";
import Link from "next/link";

import { CrewLoginForm } from "@/components/crew-auth/CrewLoginForm";
import { getCrewAuthState } from "@/lib/crew-auth";

export const metadata: Metadata = {
  title: "Crew Portal Login",
  description: "Sign in to manage Studio GQ bookings.",
  robots: { index: false, follow: false },
};

type CrewLoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

function safeNextPath(next: string | string[] | undefined) {
  const candidate = typeof next === "string" ? next : "";
  return candidate.startsWith("/crew") && !candidate.startsWith("//") && !candidate.includes("\\")
    ? candidate
    : "/crew";
}

export default async function CrewLoginPage({ searchParams }: CrewLoginPageProps) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const auth = getCrewAuthState();

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16 pt-40 text-white sm:pt-48">
      <section className="site-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,0.55fr)] lg:items-start lg:gap-20">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#a7a7a3]">STUDIO GQ / CREW PORTAL</p>
          <h1 className="mt-6 max-w-xl text-5xl font-normal leading-[0.95] tracking-[-0.055em] sm:text-7xl">
            Manage the studio day.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#a7a7a3]">
            Use the shared crew account to view bookings, manage availability and contact clients.
          </p>
          <Link className="mt-10 inline-block text-sm text-[#a7a7a3] underline-offset-4 hover:text-white hover:underline" href="/">
            Back to Studio GQ
          </Link>
        </div>

        <div className="border border-[#565656] p-6 sm:p-8">
          <p className="text-xs tracking-[0.18em] text-[#a7a7a3]">CREW SIGN IN</p>
          {auth.state === "configured" ? (
            <CrewLoginForm crewEmail={auth.config.crewEmail} nextPath={nextPath} />
          ) : (
            <div className="mt-7 border-l border-white pl-4">
              <p className="text-base leading-7">Crew portal setup is still needed.</p>
              <p className="mt-3 text-sm leading-6 text-[#a7a7a3]">{auth.reason}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
