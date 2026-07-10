import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight, BrainCircuit } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#platform", label: "Platform" },
  { href: "#workflow", label: "Workflow" },
  { href: "#insights", label: "Insights" }
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="InterviewIQ home">
          <span className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 transition-colors group-hover:border-white/20">
            <BrainCircuit className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">InterviewIQ</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                Start free
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}