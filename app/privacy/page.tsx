import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Studio GQ handles information submitted through this website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main>
      <PageHero eyebrow="Legal" title="Privacy policy." intro="A clear overview of the information this website collects and how it is used." />
      <article className="bg-[#f7f7f5] px-5 py-20 text-[#050505] md:px-8 md:py-28 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-10 leading-7 text-[#565656]">
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Information you provide</h2><p>When you submit a booking enquiry, Studio GQ receives the contact and production details you enter so the team can respond to your request. Please do not include sensitive personal information that is not needed for the booking.</p></section>
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">How it is used</h2><p>Enquiry information is used to check availability, prepare an appropriate response, discuss production requirements and administer a booking. It is not sold to third parties.</p></section>
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Website security</h2><p>The enquiry endpoint uses validation, spam protection and basic request controls. Once a delivery provider is connected, its privacy and retention terms will also apply.</p></section>
          <section><h2 className="mb-4 text-2xl font-normal text-[#050505]">Contact</h2><p>For a privacy question or information request, email <a className="underline" href="mailto:bookings@studiogq.co.za">bookings@studiogq.co.za</a>.</p></section>
        </div>
      </article>
    </main>
  );
}

