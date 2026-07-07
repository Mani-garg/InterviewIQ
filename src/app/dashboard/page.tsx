import { currentUser } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const user = await currentUser();
  const displayName = user?.firstName ?? user?.username ?? "there";

  return <DashboardShell displayName={displayName} />;
}
