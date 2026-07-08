"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const heroStats = [
  { label: "Interview signal captured", value: "94%" },
  { label: "Faster debrief cycles", value: "3.2x" },
  { label: "Structured scorecards", value: "100%" }
] as const;

const features = [
  {
    icon: BrainCircuit,
    title: "Adaptive interview plans",
    description: "Generate role-specific question paths, competency rubrics, and follow-ups that keep every conversation focused."
  },
  {
    icon: MessageSquareText,
    title: "Realtime evidence capture",
    description: "Convert live notes into timestamped proof points, strengths, risks, and calibrated hiring signals."
  },
  {
    icon: BarChart3,
    title: "Decision-ready insights",
    description: "Compare candidates across scorecards, uncover panel alignment, and move from discussion to decision faster."
  },
  {
    icon: ShieldCheck,
    title: "Fairness guardrails",
    description: "Standardize criteria, reduce recency bias, and keep evaluation anchored to role requirements."
  },
  {
    icon: FileText,
    title: "Executive summaries",
    description: "Create crisp candidate briefs for hiring managers with highlights, concerns, and next-step recommendations."
  },
  {
    icon: LockKeyhole,
    title: "Enterprise controls",
    description: "Built with privacy-first workflows, workspace permissions, and audit-friendly collaboration."
  }
] as const;

const statistics = [
  { value: "42k+", label: "interviews analyzed" },
  { value: "68%", label: "less time in debrief" },
  { value: "4.9/5", label: "hiring manager rating" },
  { value: "21%", label: "higher panel alignment" }
] as const;

const steps = [
  { title: "Design the loop", description: "Pick the role, competencies, and interview type. InterviewIQ builds a structured plan in seconds." },
  { title: "Run high-signal interviews", description: "Capture notes, evidence, and follow-ups in a premium workspace built for focus." },
  { title: "Align on the decision", description: "Review calibrated scorecards, candidate briefs, and panel summaries before making the call." }
] as const;

const testimonials = [
  {
    quote: "InterviewIQ made our debriefs sharper overnight. We finally have consistent evidence instead of scattered opinions.",
    name: "Maya Chen",
    role: "VP Talent, Northstar Labs"
  },
  {
    quote: "The product feels like an operating system for quality hiring. Our managers trust the summaries and our recruiters save hours.",
    name: "Andre Williams",
    role: "Head of Recruiting, VantaWorks"
  },
  {
    quote: "Structured scorecards used to be hard to enforce. Now every panel has the right rubric before the interview starts.",
    name: "Priya Raman",
    role: "People Ops Lead, Alloy Studio"
  }
] as const;

const pricing = [
  {
  name: "Starter",
  price: "$49",
  description: "For lean teams bringing structure to every interview.",
  features: [
    "25 interviews / month",
    "AI question plans",
    "Shared scorecards",
    "Candidate briefs",
  ],
  cta: "Start free",
  highlighted: false,
},
  {
    name: "Scale",
    price: "$149",
    description: "For growing hiring teams that need deeper insight and collaboration.",
    features: ["Unlimited interviews", "Panel alignment analytics", "Custom competencies", "Priority support", "Workspace permissions"],
    cta: "Choose Scale",
    highlighted: true
  },
  {
  name: "Enterprise",
  price: "Custom",
  description: "For organizations with advanced governance and rollout needs.",
  features: [
    "SSO and audit logs",
    "Custom retention",
    "Dedicated success",
    "Security review",
    "Advanced integrations",
  ],
  cta: "Talk to sales",
  highlighted: false,
},
] as const;

const faqs = [
  {
    question: "Does InterviewIQ replace interviewers?",
    answer: "No. InterviewIQ supports human hiring teams by structuring interviews, organizing evidence, and making decisions easier to calibrate."
  },
  {
    question: "Can we customize competencies and rubrics?",
    answer: "Yes. Teams can tailor interview kits by role, level, department, and company-specific success criteria."
  },
  {
    question: "Is the landing page responsive?",
    answer: "Yes. The interface is built mobile-first with adaptive grids, fluid spacing, and dark-theme contrast across breakpoints."
  },
  {
    question: "What makes the product premium for SaaS teams?",
    answer: "It combines polished workflows, AI-assisted synthesis, governance-friendly structure, and analytics that help teams hire with confidence."
  }
] as const;

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <motion.div className="mx-auto max-w-3xl text-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-120px" }} variants={fadeUp} transition={{ duration: 0.6 }}>
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">{title}</h2>
      <p className="mt-5 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.22),transparent_24rem),radial-gradient(circle_at_80%_10%,rgb(168_85_247/0.16),transparent_26rem)]" />
        <motion.div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]" initial="hidden" animate="visible" variants={stagger}>
          <motion.div className="max-w-3xl" variants={fadeUp} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-muted-foreground shadow-2xl shadow-black/20">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Premium AI workspace for modern hiring teams
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
              Interview intelligence that turns every conversation into a confident decision.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              InterviewIQ combines structured interview kits, realtime AI synthesis, and calibrated scorecards in one beautiful dark-mode command center.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/sign-up">Create workspace<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="#features">Explore platform</Link></Button>
            </div>
            <dl className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {heroStats.map((metric) => <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur"><dt className="text-sm text-muted-foreground">{metric.label}</dt><dd className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</dd></div>)}
            </dl>
          </motion.div>

          <motion.div className="relative" id="platform" variants={fadeUp} transition={{ duration: 0.7, delay: 0.1 }}>
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[2rem] border border-white/10 bg-card/80 p-3 shadow-2xl shadow-black/40 backdrop-blur md:p-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-background/80 p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-sm text-muted-foreground">Senior Product Designer</p><h2 className="mt-1 text-xl font-semibold">Candidate intelligence brief</h2></div><div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">92 fit score</div></div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Recommendation</p><p className="mt-3 text-2xl font-semibold">Strong hire</p><p className="mt-2 text-sm text-muted-foreground">Exceptional product craft and strong systems thinking.</p></div><div className="rounded-2xl border border-white/10 bg-primary/10 p-4"><p className="text-xs uppercase tracking-[0.22em] text-primary">AI summary</p><p className="mt-3 text-sm leading-6 text-foreground">Candidate anchored examples in measurable launches and clarified ambiguous tradeoffs quickly.</p></div></div>
                <div className="mt-6 space-y-4">{[88, 76, 94].map((value, index) => <div key={value} className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>{["Role mastery", "Communication", "Team impact"][index]}</span><span>{value}%</span></div><div className="h-2 rounded-full bg-secondary"><motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, delay: 0.5 + index * 0.1 }} /></div></div>)}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Features" title="Everything your panel needs before, during, and after the interview." description="A premium suite of AI workflows designed to make interviews more consistent, insightful, and decision-ready." /><motion.div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-120px" }} variants={stagger}>{features.map((feature) => <motion.div key={feature.title} variants={fadeUp} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.055]"><feature.icon className="size-6 text-primary" /><h3 className="mt-5 text-xl font-semibold">{feature.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{feature.description}</p></motion.div>)}</motion.div></section>

      <section id="insights" className="border-y border-white/10 bg-white/[0.025] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">{statistics.map((stat) => <motion.div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-background/60 p-6 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}><p className="text-4xl font-semibold tracking-[-0.04em] text-primary">{stat.value}</p><p className="mt-2 text-sm text-muted-foreground">{stat.label}</p></motion.div>)}</div></section>

      <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="How it works" title="From interview design to hiring decision in three elegant steps." description="InterviewIQ gives every stakeholder a guided path from preparation to evidence-backed alignment." /><div className="mt-14 grid gap-5 lg:grid-cols-3">{steps.map((step, index) => <motion.div key={step.title} className="relative rounded-[1.5rem] border border-white/10 bg-card/70 p-7" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}><div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">{index + 1}</div><h3 className="mt-6 text-xl font-semibold">{step.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{step.description}</p>{index < steps.length - 1 && <ChevronRight className="absolute -right-5 top-1/2 hidden size-8 text-white/20 lg:block" />}</motion.div>)}</div></section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Testimonials" title="Loved by teams that treat hiring quality as a product advantage." description="Recruiting leaders, hiring managers, and people teams use InterviewIQ to create repeatable, high-signal decisions." /><div className="mt-12 grid gap-5 lg:grid-cols-3">{testimonials.map((item) => <motion.figure key={item.name} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-7" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}><Quote className="size-6 text-primary" /><blockquote className="mt-5 leading-7 text-foreground">“{item.quote}”</blockquote><figcaption className="mt-6 border-t border-white/10 pt-5"><p className="font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{item.role}</p></figcaption></motion.figure>)}</div></section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="Pricing" title="Simple plans for serious hiring teams." description="Start with structured interviews today and scale into a complete interview intelligence platform as your team grows." /><div className="mt-12 grid gap-5 lg:grid-cols-3">{pricing.map((plan) => <motion.div key={plan.name} className={`rounded-[1.75rem] border p-7 ${plan.highlighted ? "border-primary/50 bg-primary/10 shadow-[0_0_60px_-28px_hsl(var(--primary))]" : "border-white/10 bg-white/[0.035]"}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>{plan.highlighted && <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"><Star className="size-3" /> Most popular</div>}<h3 className="text-2xl font-semibold">{plan.name}</h3><p className="mt-3 min-h-14 text-muted-foreground">{plan.description}</p><div className="mt-6 flex items-end gap-1"><span className="text-5xl font-semibold tracking-[-0.05em]">{plan.price}</span>{plan.price.startsWith("$") && <span className="pb-2 text-muted-foreground">/mo</span>}</div><Button asChild className="mt-7 w-full" variant={plan.highlighted ? "default" : "outline"}><Link href="/sign-up">{plan.cta}</Link></Button><ul className="mt-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 text-primary" />{feature}</li>)}</ul></motion.div>)}</div></section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8"><SectionHeading eyebrow="FAQ" title="Questions before you build a better interview loop?" description="Here are the essentials for evaluating InterviewIQ for your hiring team." /><div className="mt-12 space-y-4">{faqs.map((faq) => <motion.details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold"><span>{faq.question}</span><CheckCircle2 className="size-5 text-primary transition group-open:rotate-45" /></summary><p className="mt-4 leading-7 text-muted-foreground">{faq.answer}</p></motion.details>)}</div></section>

      <footer className="border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]"><BrainCircuit className="size-5 text-primary" /></span><span className="font-semibold">InterviewIQ</span></div><p className="mt-3 max-w-md text-sm text-muted-foreground">Premium AI interview intelligence for structured, fair, and confident hiring decisions.</p></div><div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><Link href="#features" className="hover:text-foreground">Features</Link><Link href="#workflow" className="hover:text-foreground">How it works</Link><Link href="#pricing" className="hover:text-foreground">Pricing</Link><Link href="/sign-up" className="hover:text-foreground">Get started</Link></div></div><div className="mx-auto mt-8 flex max-w-7xl items-center justify-between border-t border-white/10 pt-6 text-xs text-muted-foreground"><span>© 2026 InterviewIQ. All rights reserved.</span><span className="flex items-center gap-2"><Clock3 className="size-3" /> Built for faster hiring loops</span></div></footer>
    </main>
  );
}
