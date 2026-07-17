import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CrewBookingDetail } from "@/components/crew/CrewBookingDetail";
import { CrewPortalHeader } from "@/components/crew/CrewPortalHeader";
import { CrewSetupState } from "@/components/crew/CrewSetupState";
import { crewLoginUrl, getCrewAuthState, getCrewSession } from "@/lib/crew-auth";
import { getCrewBooking } from "@/lib/crew-bookings";

export const metadata: Metadata = {
  title: "Manage Booking",
  robots: { index: false, follow: false },
};

type CrewBookingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CrewBookingPage({ params }: CrewBookingPageProps) {
  const auth = getCrewAuthState();
  if (auth.state !== "configured") return <CrewSetupState />;

  const { id } = await params;
  if (!(await getCrewSession())) redirect(crewLoginUrl(`/crew/bookings/${id}`));
  const booking = await getCrewBooking(id);
  if (!booking) notFound();

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <CrewPortalHeader current="bookings" />
      <CrewBookingDetail booking={booking} />
    </div>
  );
}
