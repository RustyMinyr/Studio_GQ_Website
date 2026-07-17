import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CrewDashboard } from "@/components/crew/CrewDashboard";
import { CrewPortalHeader } from "@/components/crew/CrewPortalHeader";
import { CrewSetupState } from "@/components/crew/CrewSetupState";
import { crewLoginUrl, getCrewAuthState, getCrewSession } from "@/lib/crew-auth";
import { getCrewDashboard } from "@/lib/crew-bookings";

export const metadata: Metadata = {
  title: "Crew Portal",
  robots: { index: false, follow: false },
};

export default async function CrewPortalPage() {
  const auth = getCrewAuthState();
  if (auth.state !== "configured") return <CrewSetupState />;

  if (!(await getCrewSession())) redirect(crewLoginUrl("/crew"));
  const dashboard = await getCrewDashboard();

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <CrewPortalHeader current="dashboard" />
      <CrewDashboard dashboard={dashboard} />
    </div>
  );
}
