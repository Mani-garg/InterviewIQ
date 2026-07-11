import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, security, and connected accounts.
          </p>
        </div>

        <div className="mt-6">
          <UserProfile routing="path" path="/dashboard/settings" />
        </div>
      </div>
    </main>
  );
}