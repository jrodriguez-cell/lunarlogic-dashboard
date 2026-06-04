# LunarLogic Client Onboarding App

A production-ready 7-step onboarding wizard for LunarLogic AR automation clients. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Vercel infrastructure.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Database Migration](#database-migration)
6. [Environment Variables](#environment-variables)
7. [Wizard Steps](#wizard-steps)
8. [Admin Dashboard](#admin-dashboard)
9. [Deployment](#deployment)
10. [ROI Model](#roi-model)

---

## Overview

The onboarding app collects 7 screens of structured data from prospective LunarLogic clients, computes a personalized ROI projection, saves the submission to Postgres, fires email and Slack notifications to Jonathan, and sends a confirmation email to the client.

**Proof point to always lead with:** Kaptain Clean LLC — 84% reduction in invoice processing time, 19-day DSO improvement.

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript (strict mode, zero `any` types)
- **Styling:** Tailwind CSS v4
- **Forms:** React Hook Form + Zod validation
- **Database:** Vercel Postgres (@vercel/postgres)
- **Auth:** NextAuth.js v4 with CredentialsProvider + bcrypt
- **Email:** Resend
- **PDF Generation:** @react-pdf/renderer
- **Notifications:** Slack Incoming Webhooks
- **Hosting:** Vercel (region: iad1)

## Project Structure

```
onboarding/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── onboard/
│   │   │   │   ├── route.ts              # POST — submit onboarding
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts          # GET/PATCH — single submission
│   │   │   │       └── pdf/route.ts      # GET — generate PDF
│   │   │   └── admin/submissions/route.ts # GET — all submissions
│   │   ├── onboard/
│   │   │   ├── page.tsx                  # 7-step wizard
│   │   │   └── complete/page.tsx         # Success page with ROI
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   └── dashboard/page.tsx        # Admin dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Redirects to /onboard
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── WizardShell.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   └── Step1-7 components
│   │   ├── admin/
│   │   │   ├── SubmissionsTable.tsx
│   │   │   └── SubmissionDetail.tsx
│   │   └── ui/                           # Custom UI primitives
│   ├── lib/
│   │   ├── auth.ts                       # NextAuth options
│   │   ├── db.ts                         # Vercel Postgres queries
│   │   ├── email.ts                      # Resend email functions
│   │   ├── pdf.ts                        # PDF generation
│   │   ├── roi.ts                        # ROI computation model
│   │   ├── slack.ts                      # Slack webhook
│   │   ├── utils.ts                      # cn() utility
│   │   └── validations.ts                # Zod schemas
│   ├── middleware.ts                     # Protects /admin routes
│   └── types/
│       └── onboarding.ts                 # TypeScript interfaces
├── scripts/
│   └── migrate.ts                        # DB migration script
├── .env.example
├── vercel.json
└── README.md
```

## Setup & Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your .env.local values (see Environment Variables section)

# Run database migration
npx tsx scripts/migrate.ts

# Start development server
npm run dev
```

## Database Migration

Run the migration script once to create the `onboarding_submissions` table:

```bash
npx tsx scripts/migrate.ts
```

This creates the table with all required columns and indexes on `created_at`, `status`, and `owner_email`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

| Variable | Description |
|---|---|
| `POSTGRES_URL` | Vercel Postgres connection string |
| `NEXTAUTH_SECRET` | Random 32-char string (openssl rand -base64 32) |
| `NEXTAUTH_URL` | Full URL of your deployment |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password |
| `RESEND_API_KEY` | Resend API key |
| `NOTIFY_EMAIL` | Email to notify on new submissions |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |

**Generate admin password hash:**
```bash
node -e "const b=require('bcryptjs');b.hash('your_password',12).then(console.log)"
```

## Wizard Steps

1. **Business Info** — Name, email, revenue, industry, employee count
2. **QuickBooks** — Version (Online/Desktop), who manages it, current state
3. **AR Workflow** — Invoice creation, delivery method, follow-up process
4. **Invoice Volume** — Monthly count (with tier labels), avg size, DSO, payment terms
5. **Pain Points** — Free-text description, multi-select categories, payroll scare toggle
6. **Integrations** — Toggle cards for Slack, Stripe, Google Sheets, QB Payments, Email
7. **Module Selection** — IA, PR, SO, AR module cards; target start date; notes

Each step uses React Hook Form + Zod for real-time validation. The Continue button is disabled until the step is valid.

## Admin Dashboard

Visit `/admin/dashboard` (protected by NextAuth session).

Features:
- Stats bar (Total, New, Proposal Sent, Active)
- Searchable, filterable submissions table
- Click any row to open a right slide-over panel with full submission details
- Update status (auto-saves on change)
- Admin notes textarea (auto-saves on blur)
- Generate PDF proposal button

## Deployment

This app is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Connect a Vercel Postgres database in the dashboard
```

The `vercel.json` configures Next.js framework, iad1 region.

## ROI Model

The ROI model (`src/lib/roi.ts`) computes personalized financial impact:

- **Target DSO:** Current DSO x 0.55 (45% reduction, proven by Kaptain Clean)
- **Working Capital Released:** (DSO improvement / 365) x Annual Revenue
- **Bad Debt Savings:** Annual Revenue x 2% x 70% reduction
- **Unbilled Revenue Recovered:** Annual Revenue x 2.5% x 85% capture rate
- **Labor Saved:** 500 hours/year x $25/hr x 80% efficiency gain
- **ROI Multiple:** Total Year 1 Value / (Monthly Fee x 12)

The go-live annotation and DSO trend line in the AR Dashboard (WF4) are the most important retention features — they make the value visible every day.
