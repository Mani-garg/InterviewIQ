# InterviewIQ

InterviewIQ is an AI-powered mock interview platform built with Next.js. Users upload a resume, generate a tailored interview for a specific company/role/difficulty, answer the questions, and get scored feedback — with a dashboard that tracks goals, upcoming interviews, and recent activity.

## Features

- **Resume upload & parsing** — Upload a PDF resume; text is extracted (`unpdf`) and structured into sections (skills, education, projects, experience) using Gemini, then stored in Supabase Storage.
- **AI-generated interviews** — Generate a set of interview questions tailored to a company, role, and difficulty level (Beginner → Expert) using Google's Gemini API (`@google/genai`). Each question includes its category, intent, "strong answer" signals, and follow-ups.
- **Interview sessions** — Answer generated questions in a guided session flow, then finish the interview to receive per-answer and overall scores.
- **Heuristic answer scoring** — Answers are scored 0–100 based on response depth and keyword overlap with the question's expected signals (see `src/lib/scoring.ts`), with feedback text. Designed to be swapped for LLM-graded scoring later without touching callers.
- **Dashboard** — At-a-glance view of resume status, recent interviews, upcoming (scheduled) interviews, goals progress, and an activity feed.
- **Goals & scheduled interviews** — Track practice goals (e.g. "complete 5 interviews") and schedule upcoming real interviews.
- **Auth** — User accounts and route protection via Clerk (`/dashboard/*` is protected).
- **Rate limiting** — Interview generation is rate-limited per user using a Postgres-backed check (no extra infra like Redis required).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, `class-variance-authority`, `tailwind-merge` |
| Auth | [Clerk](https://clerk.com/) (`@clerk/nextjs`) |
| Database / ORM | PostgreSQL via [Prisma](https://www.prisma.io/) (`@prisma/client`) |
| File storage | [Supabase Storage](https://supabase.com/) (`@supabase/supabase-js`) |
| AI | [Google Gemini](https://ai.google.dev/) (`@google/genai`) for resume section extraction and interview question generation |
| PDF parsing | `unpdf` |
| Forms & validation | `react-hook-form`, `@hookform/resolvers`, `zod` |
| UI | Radix UI primitives, `lucide-react` icons, `framer-motion`, `recharts` for charts |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── goals/                    # CRUD for practice goals
│   │   ├── interviews/               # Generate, list, answer, and finish interviews
│   │   ├── resumes/                  # Upload, list, and delete resumes
│   │   └── scheduled-interviews/     # CRUD for scheduled (real) interviews
│   ├── dashboard/
│   │   ├── interviews/               # Interview list + interview detail/session pages
│   │   ├── resume/                   # Resume upload/history page
│   │   └── page.tsx                  # Main dashboard
│   ├── sign-in/ , sign-up/           # Clerk auth pages
│   └── page.tsx                      # Marketing / landing page
├── components/
│   ├── dashboard/                    # Dashboard panels (goals, activity, resume status, etc.)
│   ├── interview/                    # Interview generator, session, and history UI
│   ├── resume/                       # Resume upload and history UI
│   ├── layout/                       # Navbar
│   └── ui/                           # Shared UI primitives
├── lib/
│   ├── activity.ts                   # Activity feed event logging
│   ├── prisma.ts                     # Prisma client singleton
│   ├── rate-limit.ts                 # Postgres-backed rate limiting for AI generation
│   ├── resume-parser.ts              # PDF text extraction + section parsing
│   ├── scoring.ts                    # Heuristic answer scoring
│   └── utils.ts
└── middleware.ts                     # Clerk route protection

prisma/
├── schema.prisma                     # Data models (Resume, Interview, Answer, Goal, ScheduledInterview, ActivityEvent)
└── migrations/
```

## Data Model

Defined in `prisma/schema.prisma`:

- **Resume** — uploaded file metadata, extracted text, and parsed sections (JSON).
- **Interview** — company, role, difficulty, generated questions (JSON), status, and overall score.
- **Answer** — one per question per interview, with score and feedback.
- **Goal** — user-defined practice goals with a target/current count.
- **ScheduledInterview** — upcoming real interviews a user wants to track.
- **ActivityEvent** — feed of user activity shown on the dashboard.

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or local Postgres)
- A [Supabase](https://supabase.com/) project with a storage bucket (for resume files)
- A [Clerk](https://clerk.com/) application (for auth)
- A [Google AI Studio](https://ai.google.dev/) Gemini API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
# Database (Prisma)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Supabase storage
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_STORAGE_BUCKET="interviewiq"   # optional, defaults to "interviewiq"

# Gemini
GEMINI_API_KEY="..."
```

### 3. Set up the database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking with no emit |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations in dev mode |

## Notes

- `/dashboard/*` routes are protected by Clerk middleware; unauthenticated users are redirected to sign in.
- Interview generation is rate-limited per user, keyed off the `Interview` table itself rather than an in-memory store, so limits hold correctly across serverless instances.
- Answer scoring is currently heuristic (length + keyword overlap) by design, with an explicit roadmap to move to LLM-graded scoring — see the comments in `src/lib/scoring.ts`.