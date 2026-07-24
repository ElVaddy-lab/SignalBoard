# SignalBoard

SignalBoard is an English-first private project-management dashboard built as a production-style portfolio project. It combines responsive Project CRUD, immutable Activity history, useful deadline analytics, optional Ukrainian localization, Supabase Auth and strict row-level data isolation.

The approved visual direction is **Warm Signal**: an ink application shell, warm chalk surfaces, terracotta actions and petrol analytics. Design sources and implementation overrides live in [`design/`](design/README.md).

## v1 capabilities

- Email/password sign-up, sign-in and sign-out with no email-confirmation step.
- Cloudflare Turnstile token passed to protected Supabase password-auth requests.
- Private per-User Projects protected by Postgres RLS.
- Create, read, update and hard-delete Projects.
- Required free-text Project Lead and optional Deadline.
- Immutable Project Activity with retained title snapshots after deletion.
- URL-driven Project search, filters, sorting and pagination.
- Dashboard metrics for totals, active work, completion, overdue work and late completions.
- Twelve-week completion trend, status distribution, upcoming Deadlines and recent Activity.
- Explicit idempotent 18-Project sample loader.
- English by default; optional Ukrainian through the `EN` / `UA` language menu.
- Desktop table, mobile cards, responsive Sheets/dialogs and designed system states.

Not included in v1: teams, roles, invitations, Tasks, files, comments, sharing, payments, notifications or AI features.

## Stack

- Next.js App Router, React and strict TypeScript
- Tailwind CSS v4 plus feature-local CSS modules
- Supabase Postgres, Auth, Data API, RLS, SQL migrations and pgTAP
- `@supabase/ssr`, React Hook Form and Zod
- `next-intl` cookie localization with English as the default locale
- Radix primitives, Lucide icons, Recharts and Sonner
- Vitest, Playwright and axe
- pnpm with exact dependency versions and an allowlist for native build scripts

## Requirements

- Node.js 22.22.2 or a compatible Node 22–24 runtime
- pnpm 11.9.0
- Docker Desktop

Supabase CLI 2.109.1 is installed as a project dependency, so a separate global CLI is not required.

## Local setup

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm supabase:start
pnpm db:reset
```

Create `.env.local` from `.env.example` and copy the local API URL and publishable/anon key reported by `pnpm supabase:start`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

The Turnstile value above is Cloudflare's public test site key for local development only. Never use it in production.

Start the application:

```powershell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account and load the Sample Project Set from the empty Dashboard.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test:run
pnpm test:db
pnpm build
pnpm test:e2e
```

`pnpm check` runs the non-browser application release gate. Database and browser suites are separate because they own local services.

CI runs the Playwright suite in a dedicated browser job against a freshly reset local Supabase stack. The job exports the local API URL and publishable key only for its own Next.js process, uses Cloudflare's public Turnstile test key, covers desktop and mobile Chromium, and retains traces, screenshots, the HTML report, and local service logs when a run fails.

## Portfolio screenshots

The approved reference, desktop/mobile implementation captures and capture notes live in [`portfolio-screenshots/`](portfolio-screenshots/README.md). With the local app and Supabase stack running, regenerate the populated Dashboard captures with:

```powershell
pnpm screenshots:portfolio
```

## Architecture

- `src/app/` — App Router routes, loading/error/not-found boundaries and layouts.
- `src/components/layout/` — responsive authenticated shell and navigation.
- `src/components/ui/` — shared accessible UI primitives.
- `src/features/auth/` — Auth actions, forms, Turnstile and validation.
- `src/features/projects/` — Project contracts, queries/actions and responsive experiences.
- `src/features/dashboard/` — metrics, charts and Dashboard states.
- `src/features/preferences/` and `src/i18n/` — locale/timezone persistence and messages.
- `supabase/migrations/` — authoritative schema, RLS, triggers and RPCs.
- `supabase/tests/database/` — pgTAP database-contract tests.
- `src/types/database.generated.ts` — generated Supabase database types.

The domain vocabulary is defined in [`CONTEXT.md`](CONTEXT.md). The approved delivery plan is [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## Security model

- RLS is enabled for every User-owned table.
- Authenticated Users can access only rows whose `user_id` equals `auth.uid()`.
- Project Activity is written by database triggers and is read-only to application Users.
- Server Actions revalidate authenticated input with Zod; RLS remains the mandatory second boundary.
- No service-role key is used by the application runtime.
- Production CAPTCHA secret belongs in Supabase Auth configuration, never in Next.js public environment variables.

## Deployment

1. Create a hosted Supabase project and apply the committed SQL migrations.
2. Disable email confirmation for the portfolio v1 Auth flow.
3. Enable Cloudflare Turnstile in Supabase Auth and configure its production secret there.
4. Set the four public variables from `.env.example` in Vercel.
5. Deploy the Next.js application and run Auth, RLS, CRUD and mobile smoke tests.

Do not publish shared demo credentials. Use a private portfolio demo account only for controlled screenshots.
